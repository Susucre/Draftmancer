import { createApp } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from "@fortawesome/vue-fontawesome";
import { faEye, faEyeSlash, faComments, faWindowMaximize } from "@fortawesome/free-regular-svg-icons";
import {
	faAngleDoubleLeft,
	faAngleDoubleRight,
	faAngleDown,
	faAngleUp,
	faArrowsAltV,
	faBan,
	faBell,
	faBellSlash,
	faBook,
	faChartBar,
	faChartPie,
	faCheck,
	faCheckSquare,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faChevronUp,
	faClipboard,
	faClipboardCheck,
	faClock,
	faCog,
	faColumns,
	faCrown,
	faEllipsisV,
	faEnvelope,
	faExclamationCircle,
	faExclamationTriangle,
	faExternalLinkAlt,
	faFileAlt,
	faFileDownload,
	faFileExport,
	faFileLines,
	faInfoCircle,
	faList,
	faLock,
	faMinus,
	faMinusSquare,
	faMousePointer,
	faMugHot,
	faPause,
	faPlay,
	faPlus,
	faPlusSquare,
	faQuestionCircle,
	faRandom,
	faRobot,
	faRocket,
	faSearchMinus,
	faSearchPlus,
	faShareFromSquare,
	faSitemap,
	faSlash,
	faSortAmountUp,
	faSpinner,
	faSquare,
	faStop,
	faSync,
	faThumbTack,
	faTimes,
	faTimesCircle,
	faTrash,
	faTrophy,
	faUndo,
	faUndoAlt,
	faUpload,
	faUser,
	faUserCheck,
	faUserSlash,
	faVolumeMute,
	faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faPaypal, faDiscord, faPatreon, faWindows, faApple } from "@fortawesome/free-brands-svg-icons";

library.add(faEye, faEyeSlash, faComments, faWindowMaximize);
library.add(
	faAngleDoubleLeft,
	faAngleDoubleRight,
	faAngleDown,
	faAngleUp,
	faArrowsAltV,
	faBan,
	faBell,
	faBellSlash,
	faBook,
	faChartBar,
	faChartPie,
	faCheck,
	faCheckSquare,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faChevronUp,
	faClipboard,
	faClipboardCheck,
	faClock,
	faCog,
	faColumns,
	faCrown,
	faEllipsisV,
	faEnvelope,
	faExclamationCircle,
	faExclamationTriangle,
	faExternalLinkAlt,
	faFileAlt,
	faFileDownload,
	faFileExport,
	faFileLines,
	faInfoCircle,
	faList,
	faLock,
	faMinus,
	faMinusSquare,
	faMousePointer,
	faMugHot,
	faPause,
	faPlay,
	faPlus,
	faPlusSquare,
	faQuestionCircle,
	faRandom,
	faRobot,
	faRocket,
	faSearchMinus,
	faSearchPlus,
	faShareFromSquare,
	faSitemap,
	faSlash,
	faSortAmountUp,
	faSpinner,
	faSquare,
	faStop,
	faSync,
	faThumbTack,
	faTimes,
	faTimesCircle,
	faTrash,
	faTrophy,
	faUndo,
	faUndoAlt,
	faUpload,
	faUser,
	faUserCheck,
	faUserSlash,
	faVolumeMute,
	faVolumeUp
);
library.add(faGithub, faPaypal, faDiscord, faPatreon, faWindows, faApple);

export const installFontAwesome = (app: ReturnType<typeof createApp>) => {
	app.component("font-awesome-layers", FontAwesomeLayers);
	app.component("font-awesome-layer-text", FontAwesomeLayersText);
	app.component("font-awesome-icon", FontAwesomeIcon);
};
