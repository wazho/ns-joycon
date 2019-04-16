// Node modules.
import _ from 'lodash';
import { HID, Device, devices as hidDevices } from 'node-hid';
import { IInputReport0x3f, IInputReport0x21, IInputReport0x30, InputReport, BatteryLevel } from './models/indes';

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
    // console.log(`Found device: ${joyconDevice.product} (${joyconDevice.serialNumber})`);

    return joycon;
}

export function addJoyConHandler(joycon: HID, callback: (packet: InputReport) => void) {
    joycon.on('data', (rawData: Buffer) => {
        const data = rawData.toString('hex').match(/.{2}/g);

        if (!data) { return; }

        const inputReportID = parseInt(data[0], 16);

        let packet: Partial<InputReport> = {
            inputReportID: {
                _raw: rawData.slice(0, 1), // index 0
                _hex: data.slice(0, 1),
            },
        };

        switch (inputReportID) {
            case 0x3f: {
                packet = {
                    ...packet,
                    buttonStatus: {
                        _raw: rawData.slice(1, 3), // index 1,2
                        _hex: data.slice(1, 3),
                    },
                    analogStick: {
                        _raw: rawData.slice(3, 4), // index 3
                        _hex: data.slice(3, 4),
                    },
                    filter: {
                        _raw: rawData.slice(4), // index 4 ~
                        _hex: data.slice(4),
                    },
                } as IInputReport0x3f;
                break;
            }
            case 0x21:
            case 0x30: {
                packet = {
                    ...packet,
                    timer: {
                        _raw: rawData.slice(1, 2), // index 1
                        _hex: data.slice(1, 2),
                    },
                    batteryLevel: {
                        _raw: rawData.slice(2, 3), // high nibble
                        _hex: data[2][0],
                        level: calculateBatteryLevel(data[2][0]),
                    },
                    connectionInfo: {
                        _raw: rawData.slice(2, 3), // low nibble
                        _hex: data[2][1],
                    },
                    buttonStatus: {
                        _raw: rawData.slice(3, 6), // index 3,4,5
                        _hex: data.slice(3, 6),
                        // Byte 3 (Right Joy-Con)
                        y: Boolean(0x01 & rawData[3]),
                        x: Boolean(0x02 & rawData[3]),
                        b: Boolean(0x04 & rawData[3]),
                        a: Boolean(0x08 & rawData[3]),
                        r: Boolean(0x40 & rawData[3]),
                        zr: Boolean(0x80 & rawData[3]),
                        // Byte 5 (Left Joy-Con)
                        down: Boolean(0x01 & rawData[5]),
                        up: Boolean(0x02 & rawData[5]),
                        right: Boolean(0x04 & rawData[5]),
                        left: Boolean(0x08 & rawData[5]),
                        l: Boolean(0x40 & rawData[5]),
                        zl: Boolean(0x80 & rawData[5]),
                        // Byte 3,5 (Shared)
                        sr: Boolean(0x10 & rawData[3]) || Boolean(0x10 & rawData[5]),
                        sl: Boolean(0x20 & rawData[3]) || Boolean(0x20 & rawData[5]),
                        // Byte 4 (Shared)
                        minus: Boolean(0x01 & rawData[4]),
                        plus: Boolean(0x02 & rawData[4]),
                        rightStick: Boolean(0x04 & rawData[4]),
                        leftStick: Boolean(0x08 & rawData[4]),
                        home: Boolean(0x10 & rawData[4]),
                        caputure: Boolean(0x20 & rawData[4]),
                        chargingGrip: Boolean(0x80 & rawData[4]),
                    },
                    analogStickLeft: {
                        _raw: rawData.slice(6, 9), // index 6,7,8
                        _hex: data.slice(6, 9),
                        horizontal: rawData[6] | ((rawData[7] & 0xF) << 8),
                        vertical: (rawData[7] >> 4) | (rawData[8] << 4),
                    },
                    analogStickRight: {
                        _raw: rawData.slice(9, 12), // index 9,10,11
                        _hex: data.slice(9, 12),
                        horizontal: rawData[9] | ((rawData[10] & 0xF) << 8),
                        vertical: (rawData[10] >> 4) | (rawData[11] << 4),
                    },
                    vibrator: {
                        _raw: rawData.slice(12, 13), // index 12
                        _hex: data.slice(12, 13),
                    },
                };

                if (inputReportID === 0x21) {
                    packet = {
                        ...packet,
                        ack: {
                            _raw: rawData.slice(13, 14), // index 13
                            _hex: data.slice(13, 14),
                        },
                        replySubcommand: {
                            _raw: rawData.slice(14, 15), // index 14
                            _hex: data.slice(14, 15),
                        },
                    } as IInputReport0x21;
                }

                if (inputReportID === 0x30) {
                    const accelerometers = [
                        {
                            x: {
                                _raw: rawData.slice(13, 15), // index 13,14
                                _hex: data.slice(13, 15),
                                acc: toAcceleration(rawData.slice(13, 15)),
                            },
                            y: {
                                _raw: rawData.slice(15, 17), // index 15,16
                                _hex: data.slice(15, 17),
                                acc: toAcceleration(rawData.slice(15, 17)),
                            },
                            z: {
                                _raw: rawData.slice(17, 19), // index 17,18
                                _hex: data.slice(17, 19),
                                acc: toAcceleration(rawData.slice(17, 19)),
                            },
                        },
                        {
                            x: {
                                _raw: rawData.slice(25, 27), // index 25,26
                                _hex: data.slice(25, 27),
                                acc: toAcceleration(rawData.slice(25, 27)),
                            },
                            y: {
                                _raw: rawData.slice(27, 29), // index 27,28
                                _hex: data.slice(27, 29),
                                acc: toAcceleration(rawData.slice(27, 29)),
                            },
                            z: {
                                _raw: rawData.slice(29, 31), // index 29,30
                                _hex: data.slice(29, 31),
                                acc: toAcceleration(rawData.slice(29, 31)),
                            },
                        },
                        {
                            x: {
                                _raw: rawData.slice(37, 39), // index 37,38
                                _hex: data.slice(37, 39),
                                acc: toAcceleration(rawData.slice(37, 39)),
                            },
                            y: {
                                _raw: rawData.slice(39, 41), // index 39,40
                                _hex: data.slice(39, 41),
                                acc: toAcceleration(rawData.slice(39, 41)),
                            },
                            z: {
                                _raw: rawData.slice(41, 43), // index 41,42
                                _hex: data.slice(41, 43),
                                acc: toAcceleration(rawData.slice(41, 43)),
                            },
                        },
                    ];

                    const gyroscopes = [
                        [
                            {
                                _raw: rawData.slice(19, 21), // index 19,20
                                _hex: data.slice(19, 21),
                                dps: toDegreesPerSecond(rawData.slice(19, 21)),
                                rps: toRevolutionsPerSecond(rawData.slice(19, 21)),
                            },
                            {
                                _raw: rawData.slice(21, 23), // index 21,22
                                _hex: data.slice(21, 23),
                                dps: toDegreesPerSecond(rawData.slice(21, 23)),
                                rps: toRevolutionsPerSecond(rawData.slice(21, 23)),
                            },
                            {
                                _raw: rawData.slice(23, 25), // index 23,24
                                _hex: data.slice(23, 25),
                                dps: toDegreesPerSecond(rawData.slice(23, 25)),
                                rps: toRevolutionsPerSecond(rawData.slice(23, 25)),
                            },
                        ],
                        [
                            {
                                _raw: rawData.slice(31, 33), // index 31,32
                                _hex: data.slice(31, 33),
                                dps: toDegreesPerSecond(rawData.slice(31, 33)),
                                rps: toRevolutionsPerSecond(rawData.slice(31, 33)),
                            },
                            {
                                _raw: rawData.slice(33, 35), // index 33,34
                                _hex: data.slice(33, 35),
                                dps: toDegreesPerSecond(rawData.slice(33, 35)),
                                rps: toRevolutionsPerSecond(rawData.slice(33, 35)),
                            },
                            {
                                _raw: rawData.slice(35, 37), // index 35,36
                                _hex: data.slice(35, 37),
                                dps: toDegreesPerSecond(rawData.slice(35, 37)),
                                rps: toRevolutionsPerSecond(rawData.slice(35, 37)),
                            },
                        ],
                        [
                            {
                                _raw: rawData.slice(43, 45), // index 43,44
                                _hex: data.slice(43, 45),
                                dps: toDegreesPerSecond(rawData.slice(43, 45)),
                                rps: toRevolutionsPerSecond(rawData.slice(43, 45)),
                            },
                            {
                                _raw: rawData.slice(45, 47), // index 45,46
                                _hex: data.slice(45, 47),
                                dps: toDegreesPerSecond(rawData.slice(45, 47)),
                                rps: toRevolutionsPerSecond(rawData.slice(45, 47)),
                            },
                            {
                                _raw: rawData.slice(47, 49), // index 47,48
                                _hex: data.slice(47, 49),
                                dps: toDegreesPerSecond(rawData.slice(47, 49)),
                                rps: toRevolutionsPerSecond(rawData.slice(47, 49)),
                            },
                        ],
                    ];

                    const actualAcc = calculateActualAccelerometer(accelerometers.map(a => [a.x.acc, a.y.acc, a.z.acc]));
                    const actualDPS = calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.dps)));
                    const actualRPS = calculateActualGyroscope(gyroscopes.map(g => g.map(v => v.rps)));

                    packet = {
                        ...packet,
                        accelerometers,
                        gyroscopes,
                        actualAccelerometer: {
                            acc: actualAcc,
                        },
                        actualGyroscope: {
                            dps: actualDPS,
                            rps: actualRPS,
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

function calculateBatteryLevel(value: string) {
    let level: BatteryLevel;

    switch (value) {
        case '8':
            level = 'full';
            break;
        case '4':
            level = 'medium';
            break;
        case '2':
            level = 'low';
            break;
        case '1':
            level = 'critical';
            break;
        case '0':
            level = 'empty';
            break;
        default:
            level = 'charging';
    }

    return level;
}

/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#accelerometer---acceleration-in-g)
 * @param {Buffer} value
 */
function toAcceleration(value: Buffer) {
    return parseFloat((0.000244 * value.readInt16LE(0)).toFixed(6));
}

/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-degreess---dps)
 * @param {Buffer} value
 */
function toDegreesPerSecond(value: Buffer) {
    return parseFloat((0.06103 * value.readInt16LE(0)).toFixed(6));
}

/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-revolutionss)
 * @param {Buffer} value
 */
function toRevolutionsPerSecond(value: Buffer) {
    return parseFloat((0.0001694 * value.readInt16LE(0)).toFixed(6));
}

function calculateActualAccelerometer(accelerometers: number[][]) {
    const elapsedTime = 0.005 * accelerometers.length; // Spent 5ms to collect each data.

    const actualAccelerometer = {
        x: parseFloat((_.mean(accelerometers.map(g => g[0])) * elapsedTime).toFixed(6)),
        y: parseFloat((_.mean(accelerometers.map(g => g[1])) * elapsedTime).toFixed(6)),
        z: parseFloat((_.mean(accelerometers.map(g => g[2])) * elapsedTime).toFixed(6)),
    };

    return actualAccelerometer;
}

function calculateActualGyroscope(gyroscopes: number[][]) {
    const elapsedTime = 0.005 * gyroscopes.length; // Spent 5ms to collect each data.

    const actualGyroscopes = [
        _.mean(gyroscopes.map(g => g[0])),
        _.mean(gyroscopes.map(g => g[1])),
        _.mean(gyroscopes.map(g => g[2])),
    ].map(v => parseFloat((v * elapsedTime).toFixed(6)));

    return actualGyroscopes;
}
