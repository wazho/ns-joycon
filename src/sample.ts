// Local modules.
import * as JoyCon from './index';

const { joycons } = JoyCon.findControllers();

joycons.forEach(async (device) => {
    device.addHandler((packet) => {
        console.log(device.meta.product, packet);
    });
    await device.enableIMU();
});
