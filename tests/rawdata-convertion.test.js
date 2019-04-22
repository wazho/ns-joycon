const fs = require('fs');
const PacketParser = require('../src/utils/packet-parser');

const stringify = (str) => JSON.stringify(str, null, 2);

describe('Packet Parser', () => {
    // Inputs.
    const buffer = new Buffer([
        0x30, 0x3e, 0x4e, 0x0a, 0x10, 0x00, 0x00, 0x00,
        0x00, 0xc7, 0x18, 0x76, 0x09, 0x1a, 0x00, 0xf1,
        0x09, 0xd5, 0xf3, 0xb4, 0xff, 0x5b, 0xff, 0x90,
        0xff, 0x17, 0x00, 0xde, 0x09, 0xc7, 0xf3, 0xaf,
        0xff, 0x5e, 0xff, 0x8f, 0xff, 0x0a, 0x00, 0xcd,
        0x09, 0xc7, 0xf3, 0xb8, 0xff, 0x65, 0xff, 0x89,
        0xff,
    ]);

    it('parseCompleteButtonStatus', async () => {
        const data = buffer.toString('hex').match(/.{2}/g);

        // Execute.
        const results = PacketParser.parseCompleteButtonStatus(buffer, data);

        // Results.
        const outputFilePath = './tests/data/parseCompleteButtonStatus.1.out.json';
        // fs.writeFileSync(outputFilePath, stringify(results), { encoding: 'utf8' });
        const expected = fs.readFileSync(outputFilePath, { encoding: 'utf8' });
        expect(stringify(results)).toBe(expected);
    });

    it('parseAccelerometers', async () => {
        const data = buffer.toString('hex').match(/.{2}/g);

        // Execute.
        const results = PacketParser.parseAccelerometers(buffer, data);

        // Results.
        const outputFilePath = './tests/data/parseAccelerometers.1.out.json';
        // fs.writeFileSync(outputFilePath, stringify(results), { encoding: 'utf8' });
        const expected = fs.readFileSync(outputFilePath, { encoding: 'utf8' });
        expect(stringify(results)).toBe(expected);
    });

    it('parseGyroscopes', async () => {
        const data = buffer.toString('hex').match(/.{2}/g);

        // Execute.
        const results = PacketParser.parseGyroscopes(buffer, data);

        // Results.
        const outputFilePath = './tests/data/parseGyroscopes.1.out.json';
        // fs.writeFileSync(outputFilePath, stringify(results), { encoding: 'utf8' });
        const expected = fs.readFileSync(outputFilePath, { encoding: 'utf8' });
        expect(stringify(results)).toBe(expected);
    });
});
