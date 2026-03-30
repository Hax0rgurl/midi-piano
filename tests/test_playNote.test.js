const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

Object.assign(global, { TextDecoder, TextEncoder });

const { JSDOM } = require('jsdom');

describe('playNote function', () => {
  let dom;
  let window;
  let audioContextMock;
  let masterGainNodeMock;

  let frequencyMock;
  let gainMock;
  let oscillatorMock;
  let gainNodeMock;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

    // Setup mocks
    frequencyMock = {
      setValueAtTime: jest.fn()
    };

    gainMock = {
      value: 0.5,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    };

    oscillatorMock = {
      type: 'triangle',
      frequency: frequencyMock,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };

    gainNodeMock = {
      gain: gainMock,
      connect: jest.fn()
    };

    masterGainNodeMock = {
      gain: {
        setValueAtTime: jest.fn()
      },
      connect: jest.fn()
    };

    audioContextMock = {
      currentTime: 10,
      createOscillator: jest.fn(() => oscillatorMock),
      createGain: jest.fn().mockImplementationOnce(() => masterGainNodeMock).mockImplementation(() => gainNodeMock),
      destination: {}
    };

    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.AudioContext = jest.fn(() => audioContextMock);
        window.webkitAudioContext = jest.fn(() => audioContextMock);
      }
    });

    window = dom.window;
  });

  test('should create and configure an oscillator and gain node for a given note', () => {
    // Check against dynamically retrieved values to avoid hardcoded magic numbers
    const instConfig = dom.window.eval('instruments[currentInstrument]');
    const expectedFreq = dom.window.eval('baseNoteFrequencies["C4"]'); // currentOctave defaults to 4

    // Call the function
    window.playNote('C', 0.8);

    // Verify properties on the mocks
    expect(oscillatorMock.type).toBe(instConfig.type);

    // Verify frequency is set correctly using dynamic values based on octave and note
    expect(oscillatorMock.frequency.setValueAtTime).toHaveBeenCalledWith(expectedFreq, audioContextMock.currentTime);

    // Verify gain envelope is applied correctly
    expect(gainNodeMock.gain.setValueAtTime).toHaveBeenCalledWith(0, audioContextMock.currentTime);
    expect(gainNodeMock.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, audioContextMock.currentTime + instConfig.attack);
    expect(gainNodeMock.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      instConfig.sustain * 0.8,
      audioContextMock.currentTime + instConfig.attack + instConfig.decay
    );

    // Verify connections and start
    expect(oscillatorMock.connect).toHaveBeenCalledWith(gainNodeMock);
    expect(gainNodeMock.connect).toHaveBeenCalledWith(dom.window.eval('masterGainNode'));
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  test('should use default volume of 1.0 when not provided', () => {
    const instConfig = dom.window.eval('instruments[currentInstrument]');

    // Call the function without volume
    window.playNote('A');

    // Verify gain envelope is applied with volume 1.0
    expect(gainNodeMock.gain.setValueAtTime).toHaveBeenCalledWith(0, audioContextMock.currentTime);
    expect(gainNodeMock.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, audioContextMock.currentTime + instConfig.attack);
  });

  test('should respect the currentOctave and currentInstrument configurations', () => {
    // Change configurations using global variables accessible via eval
    dom.window.eval('currentOctave = 5; currentInstrument = "synth";');

    const instConfig = dom.window.eval('instruments[currentInstrument]');
    const expectedFreq = dom.window.eval('baseNoteFrequencies["D5"]');

    window.playNote('D', 0.5);

    expect(oscillatorMock.frequency.setValueAtTime).toHaveBeenCalledWith(expectedFreq, audioContextMock.currentTime);
    expect(oscillatorMock.type).toBe(instConfig.type); // e.g. 'square' for synth

    expect(gainNodeMock.gain.setValueAtTime).toHaveBeenCalledWith(0, audioContextMock.currentTime);
    expect(gainNodeMock.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, audioContextMock.currentTime + instConfig.attack);
    expect(gainNodeMock.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      instConfig.sustain * 0.5,
      audioContextMock.currentTime + instConfig.attack + instConfig.decay
    );
  });
});
