const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

let dom;

beforeAll(() => {
  dom = new JSDOM(html, { runScripts: 'dangerously', beforeParse(window) {
    // Mock AudioContext to prevent errors
    window.AudioContext = class {
      createGain() {
        return {
          connect: jest.fn(),
          gain: {
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            value: 1
          }
        };
      }
      createOscillator() { return {}; }
      resume() { return Promise.resolve(); }
      get currentTime() { return 0; }
    };
    window.webkitAudioContext = window.AudioContext;
  } });
});

test('parseMidiText parses single line input correctly', () => {
  const parseMidiText = dom.window.parseMidiText;
  const input = 'C4,0.00,0.50,1.0,main';
  const expected = [{
    note: 'C4',
    time: 0,
    duration: 0.5,
    volume: 1,
    type: 'main'
  }];
  expect(parseMidiText(input)).toEqual(expected);
});

test('parseMidiText parses multiple lines correctly', () => {
  const parseMidiText = dom.window.parseMidiText;
  const input = `C4,0.00,0.50,1.0,main\nD4,0.50,0.50,0.8,main\nE4,1.00,1.00,0.6,harmony`;
  const expected = [
    { note: 'C4', time: 0, duration: 0.5, volume: 1, type: 'main' },
    { note: 'D4', time: 0.5, duration: 0.5, volume: 0.8, type: 'main' },
    { note: 'E4', time: 1.0, duration: 1.0, volume: 0.6, type: 'harmony' }
  ];
  expect(parseMidiText(input)).toEqual(expected);
});

test('parseMidiText trims whitespace around input', () => {
  const parseMidiText = dom.window.parseMidiText;
  const input = '  \n  C4,0.00,0.50,1.0,main  \n  ';
  const expected = [{
    note: 'C4',
    time: 0,
    duration: 0.5,
    volume: 1,
    type: 'main'
  }];
  expect(parseMidiText(input)).toEqual(expected);
});

test('parseMidiText handles empty string', () => {
  const parseMidiText = dom.window.parseMidiText;
  const input = '';
  // The current implementation returns [{note: "", time: NaN, duration: NaN, volume: NaN, type: undefined}]
  const result = parseMidiText(input);
  expect(result.length).toBe(1);
  expect(result[0].note).toBe('');
  expect(Number.isNaN(result[0].time)).toBe(true);
});

test('parseMidiText parses negative values and different number formats', () => {
  const parseMidiText = dom.window.parseMidiText;
  const input = 'C4,-1.5,.5,0.0,bass';
  const expected = [{
    note: 'C4',
    time: -1.5,
    duration: 0.5,
    volume: 0,
    type: 'bass'
  }];
  expect(parseMidiText(input)).toEqual(expected);
});
