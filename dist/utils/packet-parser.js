"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Node modules.
const lodash_1 = __importDefault(require("lodash"));
function calculateBatteryLevel(value) {
    let level;
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
    ;
    return level;
}
/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#accelerometer---acceleration-in-g)
 * @param {Buffer} value
 */
function toAcceleration(value) {
    return parseFloat((0.000244 * value.readInt16LE(0)).toFixed(6));
}
/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-degreess---dps)
 * @param {Buffer} value
 */
function toDegreesPerSecond(value) {
    return parseFloat((0.06103 * value.readInt16LE(0)).toFixed(6));
}
/**
 * Check on [Documetation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-revolutionss)
 * @param {Buffer} value
 */
function toRevolutionsPerSecond(value) {
    return parseFloat((0.0001694 * value.readInt16LE(0)).toFixed(6));
}
function parseInputReportID(rawData, data) {
    const inputReportID = {
        _raw: rawData.slice(0, 1),
        _hex: data.slice(0, 1),
    };
    return inputReportID;
}
exports.parseInputReportID = parseInputReportID;
function parseTimer(rawData, data) {
    const timer = {
        _raw: rawData.slice(1, 2),
        _hex: data.slice(1, 2),
    };
    return timer;
}
exports.parseTimer = parseTimer;
function parseBatteryLevel(rawData, data) {
    const batteryLevel = {
        _raw: rawData.slice(2, 3),
        _hex: data[2][0],
        level: calculateBatteryLevel(data[2][0]),
    };
    return batteryLevel;
}
exports.parseBatteryLevel = parseBatteryLevel;
function parseConnectionInfo(rawData, data) {
    const connectionInfo = {
        _raw: rawData.slice(2, 3),
        _hex: data[2][1],
    };
    return connectionInfo;
}
exports.parseConnectionInfo = parseConnectionInfo;
function parseButtonStatus(rawData, data) {
    const buttonStatus = {
        _raw: rawData.slice(1, 3),
        _hex: data.slice(1, 3),
    };
    return buttonStatus;
}
exports.parseButtonStatus = parseButtonStatus;
function parseCompleteButtonStatus(rawData, data) {
    const buttonStatus = {
        _raw: rawData.slice(3, 6),
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
    };
    return buttonStatus;
}
exports.parseCompleteButtonStatus = parseCompleteButtonStatus;
function parseAnalogStick(rawData, data) {
    const analogStick = {
        _raw: rawData.slice(3, 4),
        _hex: data.slice(3, 4),
    };
    return analogStick;
}
exports.parseAnalogStick = parseAnalogStick;
function parseAnalogStickLeft(rawData, data) {
    const analogStickLeft = {
        _raw: rawData.slice(6, 9),
        _hex: data.slice(6, 9),
        horizontal: rawData[6] | ((rawData[7] & 0xF) << 8),
        vertical: (rawData[7] >> 4) | (rawData[8] << 4),
    };
    return analogStickLeft;
}
exports.parseAnalogStickLeft = parseAnalogStickLeft;
function parseAnalogStickRight(rawData, data) {
    const analogStickRight = {
        _raw: rawData.slice(9, 12),
        _hex: data.slice(9, 12),
        horizontal: rawData[9] | ((rawData[10] & 0xF) << 8),
        vertical: (rawData[10] >> 4) | (rawData[11] << 4),
    };
    return analogStickRight;
}
exports.parseAnalogStickRight = parseAnalogStickRight;
function parseFilter(rawData, data) {
    const filter = {
        _raw: rawData.slice(4),
        _hex: data.slice(4),
    };
    return filter;
}
exports.parseFilter = parseFilter;
function parseVibrator(rawData, data) {
    const vibrator = {
        _raw: rawData.slice(12, 13),
        _hex: data.slice(12, 13),
    };
    return vibrator;
}
exports.parseVibrator = parseVibrator;
function parseAck(rawData, data) {
    const ack = {
        _raw: rawData.slice(13, 14),
        _hex: data.slice(13, 14),
    };
    return ack;
}
exports.parseAck = parseAck;
function parseReplySubcommand(rawData, data) {
    const replySubcommand = {
        _raw: rawData.slice(14, 15),
        _hex: data.slice(14, 15),
    };
    return replySubcommand;
}
exports.parseReplySubcommand = parseReplySubcommand;
function parseAccelerometers(rawData, data) {
    const accelerometers = [
        {
            x: {
                _raw: rawData.slice(13, 15),
                _hex: data.slice(13, 15),
                acc: toAcceleration(rawData.slice(13, 15)),
            },
            y: {
                _raw: rawData.slice(15, 17),
                _hex: data.slice(15, 17),
                acc: toAcceleration(rawData.slice(15, 17)),
            },
            z: {
                _raw: rawData.slice(17, 19),
                _hex: data.slice(17, 19),
                acc: toAcceleration(rawData.slice(17, 19)),
            },
        },
        {
            x: {
                _raw: rawData.slice(25, 27),
                _hex: data.slice(25, 27),
                acc: toAcceleration(rawData.slice(25, 27)),
            },
            y: {
                _raw: rawData.slice(27, 29),
                _hex: data.slice(27, 29),
                acc: toAcceleration(rawData.slice(27, 29)),
            },
            z: {
                _raw: rawData.slice(29, 31),
                _hex: data.slice(29, 31),
                acc: toAcceleration(rawData.slice(29, 31)),
            },
        },
        {
            x: {
                _raw: rawData.slice(37, 39),
                _hex: data.slice(37, 39),
                acc: toAcceleration(rawData.slice(37, 39)),
            },
            y: {
                _raw: rawData.slice(39, 41),
                _hex: data.slice(39, 41),
                acc: toAcceleration(rawData.slice(39, 41)),
            },
            z: {
                _raw: rawData.slice(41, 43),
                _hex: data.slice(41, 43),
                acc: toAcceleration(rawData.slice(41, 43)),
            },
        },
    ];
    return accelerometers;
}
exports.parseAccelerometers = parseAccelerometers;
function parseGyroscopes(rawData, data) {
    const gyroscopes = [
        [
            {
                _raw: rawData.slice(19, 21),
                _hex: data.slice(19, 21),
                dps: toDegreesPerSecond(rawData.slice(19, 21)),
                rps: toRevolutionsPerSecond(rawData.slice(19, 21)),
            },
            {
                _raw: rawData.slice(21, 23),
                _hex: data.slice(21, 23),
                dps: toDegreesPerSecond(rawData.slice(21, 23)),
                rps: toRevolutionsPerSecond(rawData.slice(21, 23)),
            },
            {
                _raw: rawData.slice(23, 25),
                _hex: data.slice(23, 25),
                dps: toDegreesPerSecond(rawData.slice(23, 25)),
                rps: toRevolutionsPerSecond(rawData.slice(23, 25)),
            },
        ],
        [
            {
                _raw: rawData.slice(31, 33),
                _hex: data.slice(31, 33),
                dps: toDegreesPerSecond(rawData.slice(31, 33)),
                rps: toRevolutionsPerSecond(rawData.slice(31, 33)),
            },
            {
                _raw: rawData.slice(33, 35),
                _hex: data.slice(33, 35),
                dps: toDegreesPerSecond(rawData.slice(33, 35)),
                rps: toRevolutionsPerSecond(rawData.slice(33, 35)),
            },
            {
                _raw: rawData.slice(35, 37),
                _hex: data.slice(35, 37),
                dps: toDegreesPerSecond(rawData.slice(35, 37)),
                rps: toRevolutionsPerSecond(rawData.slice(35, 37)),
            },
        ],
        [
            {
                _raw: rawData.slice(43, 45),
                _hex: data.slice(43, 45),
                dps: toDegreesPerSecond(rawData.slice(43, 45)),
                rps: toRevolutionsPerSecond(rawData.slice(43, 45)),
            },
            {
                _raw: rawData.slice(45, 47),
                _hex: data.slice(45, 47),
                dps: toDegreesPerSecond(rawData.slice(45, 47)),
                rps: toRevolutionsPerSecond(rawData.slice(45, 47)),
            },
            {
                _raw: rawData.slice(47, 49),
                _hex: data.slice(47, 49),
                dps: toDegreesPerSecond(rawData.slice(47, 49)),
                rps: toRevolutionsPerSecond(rawData.slice(47, 49)),
            },
        ],
    ];
    return gyroscopes;
}
exports.parseGyroscopes = parseGyroscopes;
function calculateActualAccelerometer(accelerometers) {
    const elapsedTime = 0.005 * accelerometers.length; // Spent 5ms to collect each data.
    const actualAccelerometer = {
        x: parseFloat((lodash_1.default.mean(accelerometers.map(g => g[0])) * elapsedTime).toFixed(6)),
        y: parseFloat((lodash_1.default.mean(accelerometers.map(g => g[1])) * elapsedTime).toFixed(6)),
        z: parseFloat((lodash_1.default.mean(accelerometers.map(g => g[2])) * elapsedTime).toFixed(6)),
    };
    return actualAccelerometer;
}
exports.calculateActualAccelerometer = calculateActualAccelerometer;
function calculateActualGyroscope(gyroscopes) {
    const elapsedTime = 0.005 * gyroscopes.length; // Spent 5ms to collect each data.
    const actualGyroscopes = [
        lodash_1.default.mean(gyroscopes.map(g => g[0])),
        lodash_1.default.mean(gyroscopes.map(g => g[1])),
        lodash_1.default.mean(gyroscopes.map(g => g[2])),
    ].map(v => parseFloat((v * elapsedTime).toFixed(6)));
    return actualGyroscopes;
}
exports.calculateActualGyroscope = calculateActualGyroscope;
//# sourceMappingURL=packet-parser.js.map