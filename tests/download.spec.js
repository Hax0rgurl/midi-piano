const { test, expect } = require('@playwright/test');
const path = require('path');

test('download button should trigger download and not open new tab', async ({ page }) => {
  const filePath = `file://${path.resolve('index.html')}`;
  await page.goto(filePath);

  // Set some text in the midi-text area
  await page.evaluate(() => {
    document.getElementById('midi-text').value = 'C4,0.00,1.00,1.0,main';
  });

  // Listen for the download event
  const downloadPromise = page.waitForEvent('download');

  // Also check if a new page (tab) is opened
  let newPageOpened = false;
  page.context().on('page', () => {
    newPageOpened = true;
  });

  await page.click('#download-midi');

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('generated_midi.mid');
  expect(newPageOpened).toBe(false);
});
