const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const wavLogic = `
document.getElementById('download-wav').addEventListener('click', async () => {
  const midiText = document.getElementById('midi-text').value;
  if (!midiText || midiText.trim() === '' || midiText.trim() === 'MIDI File Content:') {
    alert('No valid MIDI content to download.');
    return;
  }

  const sequence = parseMidiText(midiText).filter(n => !isNaN(n.time) && !isNaN(n.duration));
  if (!sequence || sequence.length === 0) {
    alert('No valid MIDI content to download.');
    return;
  }

  const statusElement = document.getElementById('status');
  const prevStatus = statusElement.textContent;
  statusElement.textContent = 'Rendering WAV...';

  let maxTime = 0;
  sequence.forEach(note => {
    const noteEndTime = note.time + note.duration + instruments[currentInstrument].release;
    if (noteEndTime > maxTime) maxTime = noteEndTime;
  });

  maxTime += 0.5;

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(maxTime * sampleRate), sampleRate);

  const masterGain = offlineCtx.createGain();
  const volumeSlider = document.getElementById('volume-slider');
  masterGain.gain.value = volumeSlider ? volumeSlider.value / 100 : 0.5;
  masterGain.connect(offlineCtx.destination);

  sequence.forEach(noteObj => {
    const { note, time, duration, volume, type } = noteObj;

    // Attempt to match the existing logic which chops off the last character and uses currentOctave
    // for compatibility with playNote() behavior
    const noteName = note ? note.slice(0, -1) : '';
    const fullNote = \`\${noteName}\${currentOctave}\`;
    const freq = baseNoteFrequencies[fullNote] || baseNoteFrequencies[note];

    if (!freq) return;

    const oscillator = offlineCtx.createOscillator();
    const gainNode = offlineCtx.createGain();

    oscillator.type = instruments[currentInstrument].type;
    oscillator.frequency.setValueAtTime(freq, time);

    const attack = instruments[currentInstrument].attack;
    const decay = instruments[currentInstrument].decay;
    const sustain = instruments[currentInstrument].sustain;
    const release = instruments[currentInstrument].release;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + attack);
    gainNode.gain.linearRampToValueAtTime(sustain * volume, time + attack + decay);

    const stopTime = time + duration;
    gainNode.gain.setValueAtTime(sustain * volume, stopTime);
    gainNode.gain.linearRampToValueAtTime(0, stopTime + release);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(time);
    oscillator.stop(stopTime + release);
  });

  try {
    const renderedBuffer = await offlineCtx.startRendering();
    const wavData = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'generated_audio.wav';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      statusElement.textContent = 'WAV downloaded successfully!';
      setTimeout(() => {
        if (statusElement.textContent === 'WAV downloaded successfully!') {
          statusElement.textContent = prevStatus;
        }
      }, 3000);
    }, 100);
  } catch (err) {
    console.error('Error rendering WAV:', err);
    statusElement.textContent = 'Error rendering WAV.';
  }
});

function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferOutput = new ArrayBuffer(length);
  const view = new DataView(bufferOutput);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);

  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return bufferOutput;
}
`;

content = content.replace("document.getElementById('generate-midi').addEventListener('click', () => {", wavLogic + "\n\ndocument.getElementById('generate-midi').addEventListener('click', () => {");
fs.writeFileSync('index.html', content);
