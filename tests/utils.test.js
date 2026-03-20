const { parseMidiText, generateFullSong, shuffleArray } = require('../utils');

describe('utils.js', () => {
  describe('parseMidiText', () => {
    it('should correctly parse valid MIDI text', () => {
      const text = `C4,0.00,0.50,1.0,main\nD4,0.50,0.50,0.8,harmony`;
      const result = parseMidiText(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ note: 'C4', time: 0, duration: 0.5, volume: 1.0, type: 'main' });
      expect(result[1]).toEqual({ note: 'D4', time: 0.5, duration: 0.5, volume: 0.8, type: 'harmony' });
    });

    it('should handle empty or whitespace-only input gracefully', () => {
      expect(parseMidiText('')).toEqual([]);
      expect(parseMidiText('   ')).toEqual([]);
      expect(parseMidiText(null)).toEqual([]);
      expect(parseMidiText(undefined)).toEqual([]);
    });

    it('should throw an error if the line does not have 5 columns', () => {
      const invalidText = `C4,0.00,0.50,1.0`; // Missing type
      expect(() => parseMidiText(invalidText)).toThrow('Invalid MIDI text format: expected 5 columns');
    });

    it('should throw an error if numeric fields are invalid', () => {
      const invalidText = `C4,invalid,0.50,1.0,main`;
      expect(() => parseMidiText(invalidText)).toThrow('Invalid MIDI text format: numeric fields must be valid numbers');
    });
  });

  describe('shuffleArray', () => {
    it('should retain all original elements of the array', () => {
      const original = [1, 2, 3, 4, 5];
      // Clone so we don't modify the reference before comparing
      const shuffled = shuffleArray([...original]);
      expect(shuffled).toHaveLength(original.length);
      original.forEach(el => expect(shuffled).toContain(el));
    });

    it('should handle empty arrays and single-element arrays', () => {
      expect(shuffleArray([])).toEqual([]);
      expect(shuffleArray([1])).toEqual([1]);
    });
  });

  describe('generateFullSong', () => {
    it('should return a valid, non-empty string representing a MIDI song', () => {
      const song = generateFullSong();
      expect(typeof song).toBe('string');
      expect(song.trim().length).toBeGreaterThan(0);
    });

    it('should generate a string that can be parsed by parseMidiText without errors', () => {
      const song = generateFullSong();
      const parsed = parseMidiText(song);
      expect(parsed.length).toBeGreaterThan(0);

      // Check the first parsed line has the correct structure
      const firstNote = parsed[0];
      expect(firstNote).toHaveProperty('note');
      expect(firstNote).toHaveProperty('time');
      expect(firstNote).toHaveProperty('duration');
      expect(firstNote).toHaveProperty('volume');
      expect(firstNote).toHaveProperty('type');
    });
  });
});
