// Node modules.
import _ from 'lodash';
import { HID, Device, devices as hidDevices } from 'node-hid';
import { IInputReport0x3f, IInputReport0x21, IInputReport0x30, InputReport } from './models/';
// Local modules.
import * as PacketParser from './utils/packet-parser';

export function findDevices() {
    const devices = hidDevices();
    // Products: ['Pro Controller', 'Joy-Con (L)', 'Joy-Con (R)']
    const proControllerDevices = devices.filter((d) => d.product && d.product.includes('Pro Controller'));
    const joyconDevices = devices.filter((d) => d.product && d.product.includes('Joy-Con'));

    return {
        joyconDevices,
        proControllerDevices,
    };
}

export function convertToHumanInterfaceDevice(joyconDevice: Device) {
    const joycon = new HID(joyconDevice.vendorId, joyconDevice.productId);

    return joycon;
}

export function addJoyConHandler(joycon: HID, callback: (packet: InputReport) => void) {
    joycon.on('data', (rawData: Buffer) => {
        const data = rawData.toString('hex').match(/.{2}/g);

        if (!data) { return; }

        const inputReportID = parseInt(data[0], 16);

        let packet: Partial<InputReport> = {
            inputReportID: PacketParser.parseInputReportID(rawData, data),
        };

        switch (inputReportID) {
            case 0x3f: {
                packet = {
                    ...packet,
                    buttonStatus: PacketParser.parseButtonStatus(rawData, data),
                    analogStick: PacketParser.parseAnalogStick(rawData, data),
                    filter: PacketParser.parseFilter(rawData, data),
                } as IInputReport0x3f;
                break;
            }
            case 0x21:
            case 0x30: {
                packet = {
                    ...packet,
                    timer: PacketParser.parseTimer(rawData, data),
                    batteryLevel: PacketParser.parseBatteryLevel(rawData, data),
                    connectionInfo: PacketParser.parseConnectionInfo(rawData, data),
                    buttonStatus: PacketParser.parseCompleteButtonStatus(rawData, data),
                    analogStickLeft: PacketParser.parseAnalogStickLeft(rawData, data),
                    analogStickRight: PacketParser.parseAnalogStickRight(rawData, data),
                    vibrator: PacketParser.parseVibrator(rawData, data),
                };

                if (inputReportID === 0x21) {
                    packet = {
                        ...packet,
                        ack: PacketParser.parseAck(rawData, data),
                        replySubcommand: PacketParser.parseReplySubcommand(rawData, data),
                    } as IInputReport0x21;
                }

                if (inputReportID === 0x30) {
                    const accelerometers = PacketParser.parseAccelerometers(rawData, data);
                    const gyroscopes = PacketParser.parseGyroscopes(rawData, data);

                    packet = {
                        ...packet,
                        accelerometers,
                        gyroscopes,
                        actualAccelerometer: {
                            acc: PacketParser.calculateActualAccelerometer(accelerometers.map(a => [a.x.acc, a.y.acc, a.z.acc])),
                        },
                        actualGyroscope: {
                            dps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.dps))),
                            rps: PacketParser.calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.rps))),
                        },
                    } as IInputReport0x30;
                }
                break;
            }
        }

        callback(packet as InputReport);
    });

    joycon.on('error', (data) => {
        throw new Error(data);
    });
}

/**
 * Enable IMU data will make Jon-Con sends **Input Report 0x30**.
 */
export function enableJoyConIMU(joycon: HID) {
    // Subcommand format:
    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_notes.md#output-0x01

    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x40-enable-imu-6-axis-sensor
    // Subcommand 0x40: Enable IMU (6-Axis sensor)
    // Argument 0x01: Enable
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01]), 1000);

    // https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/66935b7f456f6724464a53781035d25a215d7caa/bluetooth_hid_subcommands_notes.md#subcommand-0x03-set-input-report-mode
    // Subcommand 0x03: Set input report mode
    // Argument 0x30: Standard full mode. Pushes current state @60Hz
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x30]), 2000);
}

/**
 * Disable IMU data will cancel Jon-Con to send **Input Report 0x30**.
 */
export function disableJoyConIMU(joycon: HID) {
    // Subcommand 0x40: Enable IMU (6-Axis sensor)
    // Argument 0x00: Disable
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00]), 1000);

    // Subcommand 0x03: Set input report mode
    // Argument 0x3f: Simple HID mode. Pushes updates with every button press
    setTimeout(() => joycon.write([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x3f]), 2000);
}
