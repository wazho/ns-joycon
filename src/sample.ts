// Local modules.
import * as JoyCon from './index';

const { joycons } = JoyCon.findControllers();

joycons.forEach(async (device) => {
    device.manageHandler('add', (packet) => {
        console.log(device.meta.product, packet);
    });
    // const deviceInfo = await device.requestDeviceInfo();
    await device.enableIMU();
    // await device.disableIMU();
    // await device.enableVibration();
    // await device.disableVibration();
});
