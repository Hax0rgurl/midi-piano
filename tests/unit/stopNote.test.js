const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('stopNote', () => {
  let dom;
  let window;
  let document;
  let mockAudioContext;

  beforeEach((done) => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

    // Mock GainNode
    const mockGainNode = {
      connect: jest.fn(),
      gain: {
        value: 0.5,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      }
    };

    // Mock AudioContext
    mockAudioContext = {
      currentTime: 100,
      createGain: jest.fn().mockImplementation(() => mockGainNode),
      createOscillator: jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
      }))
    };

    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      beforeParse(window) {
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
        window.webkitAudioContext = jest.fn().mockImplementation(() => mockAudioContext);
      }
    });

    window = dom.window;
    document = window.document;

    // Wait for DOMContentLoaded
    dom.window.addEventListener('DOMContentLoaded', () => {
      // Simulate user click to initialize audioContext
      document.body.click();
      done();
    });
  });

  it('should fade out and stop the oscillator properly', () => {
    const mockOscillator = {
      stop: jest.fn()
    };
    const mockGainNode = {
      gain: {
        value: 0.75, // Testing arbitrary initial value
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      }
    };
    const noteObj = {
      oscillator: mockOscillator,
      gainNode: mockGainNode
    };

    // Retrieve variables from JSDOM evaluated context
    const instruments = window.eval('instruments');
    const currentInstrument = window.eval('currentInstrument');

    window.stopNote(noteObj);

    const release = instruments[currentInstrument].release;
    const expectedTime = mockAudioContext.currentTime + release;

    // Verify it locks current value before fading
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.75, mockAudioContext.currentTime);

    // Verify it fades out to 0 over the instrument's release time
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expectedTime);

    // Verify the oscillator is scheduled to stop exactly when the fade out completes
    expect(mockOscillator.stop).toHaveBeenCalledWith(expectedTime);
  });

  it('should handle different instrument release times', () => {
    const mockOscillator = { stop: jest.fn() };
    const mockGainNode = {
      gain: {
        value: 0.5,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      }
    };
    const noteObj = { oscillator: mockOscillator, gainNode: mockGainNode };

    // Change instrument to strings which has a longer release time (0.2 vs 0.1)
    window.eval('currentInstrument = "strings";');

    const instruments = window.eval('instruments');

    window.stopNote(noteObj);

    const release = instruments['strings'].release;
    const expectedTime = mockAudioContext.currentTime + release;

    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expectedTime);
    expect(mockOscillator.stop).toHaveBeenCalledWith(expectedTime);
  });
});
