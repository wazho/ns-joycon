"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Local modules.
const JoyCon = __importStar(require("./index"));
const { joyconDevices } = JoyCon.findDevices();
const joycons = joyconDevices.map((device) => ({
    device,
    hid: JoyCon.convertToHumanInterfaceDevice(device),
}));
joycons.forEach(({ device, hid }) => {
    JoyCon.addJoyConHandler(hid, (packet) => {
        console.log(packet);
    });
    JoyCon.enableJoyConIMU(hid);
});
//# sourceMappingURL=sample.js.map