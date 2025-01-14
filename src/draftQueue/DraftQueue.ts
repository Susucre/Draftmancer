import { v4 as uuidv4 } from "uuid";
import { UserID } from "../IDTypes";
import { SetCode } from "../Types";

import { Connections } from "../Connection.js";
import { Session, Sessions } from "../Session.js";
import { SocketAck, SocketError } from "../Message.js";
import { Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "../SocketType";
import { ReadyState } from "../Session/SessionTypes.js";

import { QueueID, QueueDescription } from "./QueueDescription.js";
import { AvailableQueues } from "./AvailableQueues.js";

const PlayerQueues: Map<QueueID, { description: QueueDescription; users: UserID[] }> = new Map<
	QueueID,
	{ description: QueueDescription; users: UserID[] }
>();

for (const queue of AvailableQueues) {
	PlayerQueues.set(queue.id, {
		description: queue,
		users: [],
	});
}

function readyCheck(queueID: QueueID, users: UserID[]) {
	const playersStatus: Record<UserID, { status: ReadyState; onDisconnect: () => void }> = {};

	const timeout = Date.now() + 45 * 1000;
	const cancelTimeout = setTimeout(() => {
		cancel(true);
	}, timeout - Date.now());

	const getTableStatus = () =>
		Object.values(playersStatus).map((p) => {
			return {
				status: p.status,
			};
		});

	const cancel = (timeout: boolean = false) => {
		clearTimeout(cancelTimeout);
		for (const uid of users) {
			Connections[uid]?.socket?.emit("draftQueueReadyCheckUpdate", queueID, getTableStatus());
			Connections[uid]?.socket?.off("disconnect", playersStatus[uid].onDisconnect);
			Connections[uid]?.socket?.removeAllListeners("draftQueueSetReadyState");
			if (
				playersStatus[uid].status === ReadyState.Ready ||
				(!timeout && playersStatus[uid].status === ReadyState.Unknown)
			) {
				Connections[uid]?.socket?.emit("draftQueueReadyCheckCancel", queueID, true);
				registerPlayer(uid, queueID);
			} else Connections[uid]?.socket?.emit("draftQueueReadyCheckCancel", queueID, false);
		}
	};

	for (const uid of users)
		playersStatus[uid] = {
			status: ReadyState.Unknown,
			onDisconnect: () => {
				playersStatus[uid].status = ReadyState.NotReady;
				cancel();
			},
		};

	for (const uid of users) {
		// Make sure player is still connected. This shouldn't be needed, but the case comes up in tests, and I'm not sure how...
		if (!Connections[uid]) return playersStatus[uid].onDisconnect();

		Connections[uid].socket.once("disconnect", playersStatus[uid].onDisconnect);
		Connections[uid].socket.once("draftQueueSetReadyState", (status: ReadyState) => {
			playersStatus[uid].status = status;

			if (status !== ReadyState.Ready) {
				cancel();
			} else {
				for (const uid of users)
					Connections[uid]?.socket?.emit("draftQueueReadyCheckUpdate", queueID, getTableStatus());
				if (Object.values(playersStatus).every((p) => p.status === ReadyState.Ready)) {
					clearTimeout(cancelTimeout);
					launchSession(queueID, users);
				}
			}
		});
		Connections[uid].socket.emit("draftQueueReadyCheck", queueID, timeout, getTableStatus());
	}
}

function launchSession(queueID: QueueID, users: UserID[]) {
	let sessionID = `DraftQueue-${queueID.toUpperCase()}-${uuidv4()}`;
	while (sessionID in Sessions) sessionID = `DraftQueue-${queueID.toUpperCase()}-${uuidv4()}`;

	const session = new Session(sessionID, undefined);

	const queue = PlayerQueues.get(queueID);
	if (!queue) {
		console.error("DraftQueue.launchSession: Queue not found.");
		return;
	}

	if (queue.description.settings) {
		if (queue.description.settings.pickedCardsPerRound)
			session.pickedCardsPerRound = queue.description.settings.pickedCardsPerRound;
	}
	session.setRestriction = [queue.description.setCode];
	session.maxTimer = 70;
	for (const uid of users) {
		session.addUser(uid);
		Connections[uid].socket.emit("setSession", sessionID);
	}

	Sessions[sessionID] = session;

	session.startDraft();
}

function searchPlayer(userID: UserID): QueueID | undefined {
	for (const [key, value] of PlayerQueues) {
		const val = value.users.find((uid) => uid === userID);
		if (val) return key;
	}
	return undefined;
}

function onDisconnect(this: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
	const userID = this.data.userID;
	if (userID) {
		const previous = searchPlayer(userID);
		if (previous) unregisterPlayer(userID, previous);
	}
}

export function registerPlayer(userID: UserID, queueID: QueueID): SocketAck {
	const conn = Connections[userID];
	if (!conn) return new SocketError("Internal Error.");
	if (conn.sessionID) return new SocketError("Already in a session.");

	unregisterPlayer(userID);

	const queue = PlayerQueues.get(queueID);
	if (!queue) return new SocketError(`Invalid queue '${queueID}'.`);

	queue.users.push(userID);

	conn.socket.once("disconnect", onDisconnect);

	if (queue.users.length >= queue.description.playerCount) {
		const users = queue.users.slice(0, queue.description.playerCount);
		for (const uid of users) unregisterPlayer(uid, queueID);
		readyCheck(queueID, users);
	}

	return new SocketAck();
}

export function unregisterPlayer(userID: UserID, queueID?: QueueID): SocketAck {
	let qid = queueID;
	if (!qid) {
		qid = searchPlayer(userID);
		if (!qid) return new SocketError(`Player not found.`);
	}

	const queue = PlayerQueues.get(qid);
	if (!queue) return new SocketError(`Invalid queue '${qid}'.`);
	const idx = queue.users.indexOf(userID);
	if (idx < 0) return new SocketError(`Player not found.`);
	queue.users.splice(idx, 1);
	Connections[userID]?.socket.off("disconnect", onDisconnect);
	return new SocketAck();
}

export function getQueueStatus() {
	const queues: Record<SetCode, { set: string; inQueue: number; playing: number }> = {};

	// NOTE: Might be worth optimizing/caching at some point.
	const managedSessions = Object.keys(Sessions).filter((sid) => Sessions[sid].managed);

	for (const [k, v] of PlayerQueues.entries()) {
		queues[k] = {
			set: k,
			inQueue: v.users.length,
			playing: managedSessions
				.filter(
					(sid) =>
						Sessions[sid].setRestriction.length === 1 &&
						Sessions[sid].setRestriction[0] === v.description.setCode
				)
				.map((sid) => Sessions[sid].users.size)
				.reduce((a, b) => a + b, 0),
		};
	}

	return {
		playing: managedSessions.map((sid) => Sessions[sid].users.size).reduce((a, b) => a + b, 0),
		queues,
	};
}
