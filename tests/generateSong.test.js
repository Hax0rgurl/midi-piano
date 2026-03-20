const fs = require('fs');
const path = require('path');

// Read the index.html file
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Extract the script content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

// Create mock objects that the script needs on initialization
global.window = {
    AudioContext: class {
        createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {} } }; }
    },
    webkitAudioContext: class {
        createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {} } }; }
    }
};

global.document = {
    querySelectorAll: () => [],
    getElementById: () => ({ addEventListener: () => {} }),
    addEventListener: () => {},
    body: { addEventListener: () => {} }
};

// Evaluate the script content
eval(scriptContent);

describe('generateFullSong', () => {
    let originalRandom;

    beforeEach(() => {
        originalRandom = Math.random;
    });

    afterEach(() => {
        Math.random = originalRandom;
    });

    test('should return a non-empty string in CSV format', () => {
        const song = generateFullSong();
        expect(typeof song).toBe('string');
        expect(song.length).toBeGreaterThan(0);

        const lines = song.split('\n');
        expect(lines.length).toBeGreaterThan(0);

        lines.forEach((line, index) => {
            const parts = line.split(',');
            expect(parts.length).toBe(5, `Line ${index} does not have 5 columns: ${line}`);

            const [note, time, duration, volume, type] = parts;

            // Note format check
            expect(note).toMatch(/^[A-G]#?\d$/);

            // Numeric checks
            const t = parseFloat(time);
            const d = parseFloat(duration);
            const v = parseFloat(volume);

            expect(t).toBeGreaterThanOrEqual(0);
            expect(d).toBeGreaterThan(0);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1.0);

            // Type check
            expect(['main', 'harmony', 'bass']).toContain(type);
        });
    });

    test('should be deterministic when Math.random is mocked', () => {
        let val = 0.0;
        Math.random = () => {
            val += 0.1;
            if (val >= 1.0) val = 0.0;
            return val;
        };

        const song1 = generateFullSong();

        // Reset our mock state to produce the same sequence
        val = 0.0;
        Math.random = () => {
            val += 0.1;
            if (val >= 1.0) val = 0.0;
            return val;
        };

        const song2 = generateFullSong();

        expect(song1).toBe(song2);
        expect(song1.split('\n').length).toBeGreaterThan(0);
    });
});
