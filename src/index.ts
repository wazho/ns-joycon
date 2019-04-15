import { HID, Device, devices as hidDevices } from 'node-hid';

const devices = hidDevices();
// Products: ['Pro Controller', 'Joy-Con (L)', 'Joy-Con (R)']
const proDevices = devices.filter((d) => d.product.includes('Pro Controller'));
const joyconDevices = devices.filter((d) => d.product.includes('Joy-Con'));
const selectedDevices = joyconDevices;

selectedDevices.forEach((device) => {
    const joycon = new HID(device.vendorId, device.productId);
    console.log(`Found device: ${device.product} (${device.serialNumber})`);

    // Add listeners.
    addJoyConListener(device, joycon);

    // Subcommand format:
    //   https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01
    //
    // Subcommand 0x40: Enable IMU (6-Axis sensor)
    //   https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01]), 1000);
    // Subcommand 0x03: Set input report mode
    //   https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x30]), 2000);
});

function addJoyConListener(device: Device, joycon: HID) {
    const { product } = device;

    joycon.on('data', (rawData: Buffer) => {
        const data = rawData.toString('hex').match(/.{2}/g);
        const inputReportID = parseInt(data[0], 16);

        let packet: any = {
            inputReportID: data[0],
        };

        switch (inputReportID) {
            case 0x3f: {
                packet = {
                    ...packet,
                    buttonStatus: data.slice(1, 3), // index 1,2
                    analogStick: data[3],
                    filter: data.slice(4),
                };
                break;
            }
            case 0x21:
            case 0x30: {
                packet = {
                    ...packet,
                    timer: data[1],
                    batteryLevel: data[2][0], // high nibble
                    connectionInfo: data[2][1], // low nibble
                    buttonStatus: data.slice(3, 6), // index 3,4,5
                    analogStickLeft: data.slice(6, 9), // index 6,7,8
                    analogStickRight: data.slice(9, 12), // index 9,10,11
                    vibrator: data[12],
                };

                if (inputReportID === 0x21) {
                    packet = {
                        ...packet,
                        ack: data[13],
                        replySubcommand: data[14],
                    };
                }

                if (inputReportID === 0x30) {
                    packet = {
                        ...packet,
                        acceleratorX: data.slice(13, 15), // index 13,14
                        acceleratorY: data.slice(15, 17), // index 15,16
                        acceleratorZ: data.slice(17, 19), // index 17,18
                        gyroscope1: data.slice(19, 21), // index 19,20
                        gyroscope2: data.slice(21, 23), // index 21,22
                        gyroscope3: data.slice(23, 25), // index 23,24
                    };
                }
                break;
            }
        }

        console.log(product, packet);
    });

    joycon.on('error', (data) => {
        console.log('Error', product, data);
    });
}
