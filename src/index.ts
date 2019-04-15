import { inspect } from 'util';
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
                        accelerometers: [
                            {
                                x: data.slice(13, 15), // index 13,14
                                y: data.slice(15, 17), // index 15,16
                                z: data.slice(17, 19), // index 17,18
                            },
                            {
                                x: data.slice(25, 27), // index 25,26
                                y: data.slice(27, 29), // index 27,28
                                z: data.slice(29, 31), // index 29,30
                            },
                            {
                                x: data.slice(37, 39), // index 37,38
                                y: data.slice(39, 41), // index 39,40
                                z: data.slice(41, 43), // index 41,42
                            },
                        ],
                        gyroscopes: [
                            [
                                data.slice(19, 21), // index 19,20
                                data.slice(21, 23), // index 21,22
                                data.slice(23, 25), // index 23,24
                            ],
                            [
                                data.slice(31, 33), // index 31,32
                                data.slice(33, 35), // index 33,34
                                data.slice(35, 37), // index 35,36
                            ],
                            [
                                data.slice(43, 45), // index 43,44
                                data.slice(45, 47), // index 45,46
                                data.slice(47, 49), // index 47,48
                            ],
                        ],
                    };
                }
                break;
            }
        }

        console.log(product, inspect(packet, { showHidden: false, depth: null }));
    });

    joycon.on('error', (data) => {
        console.log('Error', product, data);
    });
}
