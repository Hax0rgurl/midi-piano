const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

describe('generateFullSong', () => {
  let originalRandom;
  let dom;
  let window;

  beforeEach(() => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      beforeParse(window) {
        window.AudioContext = class {
          createGain() {
              return {
                  connect: () => {},
                  gain: { setValueAtTime: () => {} }
              };
          }
        };
        window.webkitAudioContext = window.AudioContext;
      }
    });
    window = dom.window;
    originalRandom = window.Math.random;
  });

  afterEach(() => {
    if (window && window.Math) {
        window.Math.random = originalRandom;
    }
  });

  it('should return a valid CSV string with random input', () => {
    const song = window.generateFullSong();

    expect(typeof song).toBe('string');

    const lines = song.split('\n');
    expect(lines.length).toBeGreaterThan(0);

    lines.forEach(line => {
      const parts = line.split(',');
      expect(parts.length).toBe(5);

      const [note, time, duration, volume, type] = parts;
      expect(parseFloat(time)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(duration)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(volume)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(volume)).toBeLessThanOrEqual(1);
      expect(['main', 'harmony', 'bass']).toContain(type);
    });
  });

  it('should return deterministic output when Math.random is mocked', () => {
    let callCount = 0;
    window.Math.random = jest.fn(() => {
      callCount++;
      return (callCount * 0.1) % 1.0;
    });

    const song = window.generateFullSong();

    expect(typeof song).toBe('string');

    const lines = song.split('\n');
    expect(lines.length).toBeGreaterThan(0);

    expect(lines[0]).toContain('main');
  });
});
