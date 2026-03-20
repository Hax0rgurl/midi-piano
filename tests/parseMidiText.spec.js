const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('parseMidiText', () => {
  let parseMidiText;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const filePath = `file://${path.join(__dirname, '../index.html')}`;
    await page.goto(filePath);

    // Extract the function to be evaluated in tests
    parseMidiText = async (text) => {
      return await page.evaluate((textToParse) => {
        return window.parseMidiText(textToParse);
      }, text);
    };
  });

  test('should parse valid MIDI text', async () => {
    const validText = 'C4,0.00,0.50,1.0,main\nD4,0.50,0.50,0.8,harmony';
    const result = await parseMidiText(validText);
    expect(result).toEqual([
      { note: 'C4', time: 0, duration: 0.5, volume: 1, type: 'main' },
      { note: 'D4', time: 0.5, duration: 0.5, volume: 0.8, type: 'harmony' }
    ]);
  });

  test('should throw error for lines with incorrect column count', async () => {
    const invalidText = 'C4,0.00,0.50,1.0'; // Missing type
    await expect(parseMidiText(invalidText)).rejects.toThrow(/Invalid MIDI text format: expected 5 columns/);
  });

  test('should throw error for non-numeric time', async () => {
    const invalidText = 'C4,invalid,0.50,1.0,main';
    await expect(parseMidiText(invalidText)).rejects.toThrow(/Invalid MIDI text format: time must be a number/);
  });

  test('should throw error for non-numeric duration', async () => {
    const invalidText = 'C4,0.00,invalid,1.0,main';
    await expect(parseMidiText(invalidText)).rejects.toThrow(/Invalid MIDI text format: duration must be a number/);
  });

  test('should throw error for non-numeric volume', async () => {
    const invalidText = 'C4,0.00,0.50,invalid,main';
    await expect(parseMidiText(invalidText)).rejects.toThrow(/Invalid MIDI text format: volume must be a number/);
  });

  test('should return empty array for empty input', async () => {
    const emptyText = '';
    const result = await parseMidiText(emptyText);
    expect(result).toEqual([]);
  });

  test('should return empty array for input with only whitespace', async () => {
    const whitespaceText = '   \n  ';
    const result = await parseMidiText(whitespaceText);
    expect(result).toEqual([]);
  });
});
