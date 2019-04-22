// Local modules.
import * as JoyCon from './index';

const { joyconDevices } = JoyCon.findDevices();
const joycons = joyconDevices.map((device) => ({
    device,
    hid: JoyCon.convertToHumanInterfaceDevice(device),
}));

joycons.forEach(({ device, hid }) => {
    JoyCon.addJoyConHandler(hid, (packet) => {
        console.log(JSON.stringify(packet, null, 2));
    });
    JoyCon.enableJoyConIMU(hid);
});
