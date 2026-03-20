function parseMidiText(midiText) {
  if (!midiText || !midiText.trim()) return [];
  return midiText.trim().split('\n').map(line => {
    const parts = line.split(',');
    if (parts.length !== 5) {
      throw new Error("Invalid MIDI text format: expected 5 columns");
    }
    const [note, time, duration, volume, type] = parts;
    const pTime = parseFloat(time);
    const pDuration = parseFloat(duration);
    const pVolume = parseFloat(volume);

    if (isNaN(pTime) || isNaN(pDuration) || isNaN(pVolume)) {
      throw new Error("Invalid MIDI text format: numeric fields must be valid numbers");
    }

    return { note, time: pTime, duration: pDuration, volume: pVolume, type };
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateFullSong() {
  const songLength = Math.random() * 30 + 90; // 90-120 seconds
  const bpm = Math.floor(Math.random() * 40 + 80); // 80-120 BPM
  const beatDuration = 60 / bpm;
  const isMinor = Math.random() < 0.5;

  const scale = isMinor ? ['C', 'D', 'D#', 'F', 'G', 'G#', 'A#'] : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const chords = [
    [0, 2, 4], // I
    [5, 0, 2], // VI
    [3, 5, 0], // IV
    [4, 6, 1]  // V
  ];

  let song = '';
  let currentTime = 0;

  while (currentTime < songLength) {
    const chordProgression = shuffleArray([0, 1, 2, 3]);

    for (const chordIndex of chordProgression) {
      const chord = chords[chordIndex];

      // Main melody
      const melodyNote = scale[Math.floor(Math.random() * scale.length)] + '4';
      song += `${melodyNote},${currentTime.toFixed(2)},${beatDuration.toFixed(2)},1.0,main\n`;

      // Chord
      for (const note of chord) {
        const chordNote = scale[note] + '3';
        song += `${chordNote},${currentTime.toFixed(2)},${(beatDuration * 4).toFixed(2)},0.6,harmony\n`;
      }

      // Bass
      const bassNote = scale[chord[0]] + '2';
      song += `${bassNote},${currentTime.toFixed(2)},${(beatDuration * 4).toFixed(2)},0.8,bass\n`;

      currentTime += beatDuration * 4;
    }
  }

  return song.trim();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseMidiText, generateFullSong, shuffleArray };
}
