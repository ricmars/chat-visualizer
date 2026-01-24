// Register cosmos icons used throughout the application
import { registerIcon } from "@pega/cosmos-react-core";

// Import icon modules
import * as sendIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/send.icon";
import * as checkIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/check.icon";
import * as timesIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/times.icon";
import * as warnIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/warn.icon";
import * as informationIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/information.icon";
import * as codeIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/code.icon";
import * as eyeIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/eye.icon";
import * as pencilIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/pencil.icon";
import * as caretRightIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/caret-right.icon";
import * as caretDownIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/caret-down.icon";
import * as chatIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/chat.icon";
import * as resetIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/reset.icon";
import * as paperClipIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/paper-clip.icon";
import * as speakerOnIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/speaker-on.icon";
import * as speakerMuteIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/speaker-mute.icon";
import * as documentIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/document.icon";
import * as pictureIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/picture.icon";
import * as chainIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/chain.icon";
import * as clockIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/clock.icon";
import * as plusIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/plus.icon";
import * as minusIcon from "@pega/cosmos-react-core/lib/components/Icon/icons/minus.icon";

// Register all icons
export function registerCosmosIcons() {
  registerIcon(
    sendIcon,
    checkIcon,
    timesIcon,
    warnIcon,
    informationIcon,
    codeIcon,
    eyeIcon,
    pencilIcon,
    caretRightIcon,
    caretDownIcon,
    chatIcon,
    resetIcon,
    paperClipIcon,
    speakerOnIcon,
    speakerMuteIcon,
    documentIcon,
    pictureIcon,
    chainIcon,
    clockIcon,
    plusIcon,
    minusIcon
  );
}
