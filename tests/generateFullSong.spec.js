const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('generateFullSong Function', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const filePath = `file://${path.resolve(__dirname, '../index.html')}`;
    await page.goto(filePath);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should generate a valid CSV formatted string with the correct structure', async () => {
    const generatedSong = await page.evaluate(() => {
      // The generateFullSong function is in the global scope
      return window.generateFullSong();
    });

    expect(typeof generatedSong).toBe('string');
    expect(generatedSong.length).toBeGreaterThan(0);

    const lines = generatedSong.split('\n');
    expect(lines.length).toBeGreaterThan(0);

    lines.forEach(line => {
      const parts = line.split(',');
      expect(parts.length).toBe(5); // note, time, duration, volume, type

      const [note, timeStr, durationStr, volumeStr, type] = parts;

      // Note validation (e.g., C4, D#3)
      expect(note).toMatch(/^[A-G]#?[0-9]$/);

      // Time validation
      const time = parseFloat(timeStr);
      expect(isNaN(time)).toBe(false);
      expect(time).toBeGreaterThanOrEqual(0);

      // Duration validation
      const duration = parseFloat(durationStr);
      expect(isNaN(duration)).toBe(false);
      expect(duration).toBeGreaterThan(0);

      // Volume validation
      const volume = parseFloat(volumeStr);
      expect(isNaN(volume)).toBe(false);
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);

      // Type validation
      expect(['main', 'harmony', 'bass']).toContain(type);
    });
  });

  test('should generate a song between 90 and 120 seconds length roughly', async () => {
      const generatedSong = await page.evaluate(() => {
        return window.generateFullSong();
      });

      const lines = generatedSong.split('\n');
      const lastLine = lines[lines.length - 1];
      const lastLineParts = lastLine.split(',');
      const lastNoteTime = parseFloat(lastLineParts[1]);

      // The song length target is between 90 and 120, but it finishes the last chord progression
      // so the actual time could be slightly more than 120 or slightly less than 90 depending on
      // exactly when the while loop terminates
      expect(lastNoteTime).toBeGreaterThanOrEqual(90);
      expect(lastNoteTime).toBeLessThanOrEqual(130);
  });

  test('should parse correctly with parseMidiText', async () => {
    const isValid = await page.evaluate(() => {
        const song = window.generateFullSong();
        const parsed = window.parseMidiText(song);
        return Array.isArray(parsed) && parsed.length > 0 && parsed[0].hasOwnProperty('note');
    });

    expect(isValid).toBe(true);
  });
});
