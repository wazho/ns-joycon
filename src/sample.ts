// Local modules.
import * as JoyCon from './index';

JoyCon.findControllers((devices) => {
    // When found any device.
    devices.forEach(async (device) => {
        console.log(`Found a device (${device.meta.serialNumber})`);

        // Add a handler for new device.
        device.manageHandler('add', (packet) => {
            console.log(device.meta.product, packet);
        });

        // const deviceInfo = await device.requestDeviceInfo();
        await device.enableIMU();
        // await device.disableIMU();
        // await device.enableVibration();
        // await device.disableVibration();
    });
});
