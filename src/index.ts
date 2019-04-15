// Local modules.
import * as JoyCon from './joy-con';

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
