const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

describe('generateFullSong tests', () => {
  let window;
  let document;

  beforeAll(() => {
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      beforeParse(window) {
        // Mock AudioContext to prevent initialization errors
        window.AudioContext = class {
          constructor() {
            this.state = 'suspended';
          }
          createGain() {
            return {
              connect: jest.fn(),
              gain: {
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn()
              }
            };
          }
          createOscillator() {
            return {
              connect: jest.fn(),
              start: jest.fn(),
              stop: jest.fn(),
              frequency: {
                setValueAtTime: jest.fn()
              }
            };
          }
        };
        window.webkitAudioContext = window.AudioContext;
      }
    });

    window = dom.window;
    document = dom.window.document;
  });

  afterAll(() => {
    if (window) {
      window.close();
    }
  });

  test('JSDOM is initialized and function exists', () => {
    expect(typeof window.generateFullSong).toBe('function');
  });

  test('generateFullSong returns a string', () => {
    const result = window.generateFullSong();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('output has correct format (5 comma-separated values per line)', () => {
    const result = window.generateFullSong();
    const lines = result.trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);

    lines.forEach(line => {
      const parts = line.split(',');
      expect(parts.length).toBe(5);

      const [note, time, duration, volume, type] = parts;

      // Note should be string with letter and optional #, followed by number (octave)
      expect(note).toMatch(/^[A-G]#?\d$/);

      // Time and duration should be numbers
      expect(parseFloat(time)).not.toBeNaN();
      expect(parseFloat(duration)).not.toBeNaN();

      // Volume should be a number between 0 and 1
      const volNum = parseFloat(volume);
      expect(volNum).not.toBeNaN();
      expect(volNum).toBeGreaterThanOrEqual(0);
      expect(volNum).toBeLessThanOrEqual(1);

      // Type should be one of the expected types
      expect(['main', 'harmony', 'bass']).toContain(type);
    });
  });

  test('song length falls within expected bounds', () => {
    // We mock Math.random to test bounds deterministically
    const originalRandom = window.Math.random;

    try {
      // Test with random() returning 0
      window.Math.random = () => 0;
      let result = window.generateFullSong();
      let lines = result.trim().split('\n');
      let lastLine = lines[lines.length - 1];
      let [note, time, duration] = lastLine.split(',');
      let endTime = parseFloat(time) + parseFloat(duration);

      // Length test for shortest scenario
      expect(endTime).toBeGreaterThanOrEqual(90);
      expect(endTime).toBeLessThan(110);

      // Test with random() returning 0.9999
      window.Math.random = () => 0.9999;
      result = window.generateFullSong();
      lines = result.trim().split('\n');
      lastLine = lines[lines.length - 1];
      let parts = lastLine.split(',');
      time = parts[1];
      duration = parts[2];
      endTime = parseFloat(time) + parseFloat(duration);

      // Length test for longest scenario
      expect(endTime).toBeGreaterThanOrEqual(119);
      expect(endTime).toBeLessThan(135);
    } finally {
      window.Math.random = originalRandom;
    }
  });
});
