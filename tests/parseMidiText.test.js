const fs = require('fs');
const assert = require('assert').strict;

// Extract function from index.html
const html = fs.readFileSync('index.html', 'utf8');
const funcMatch = html.match(/function parseMidiText\([^)]*\)\s*{[\s\S]*?\n\}/);
if (!funcMatch) {
  console.error("Could not find function parseMidiText in index.html");
  process.exit(1);
}

// Create a callable function in the current context
const parseMidiText = new Function('midiText', `
  ${funcMatch[0]}
  return parseMidiText(midiText);
`);

console.log("Running parseMidiText tests...");
let passed = 0;
let failed = 0;

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
    failed++;
  }
}

// Test 1: Happy path
runTest('Parses valid MIDI text correctly', () => {
  const input = "C4,0.00,0.50,1.0,main\nD4,0.50,0.50,0.8,harmony";
  const result = parseMidiText(input);
  assert.deepStrictEqual(result, [
    { note: 'C4', time: 0, duration: 0.5, volume: 1.0, type: 'main' },
    { note: 'D4', time: 0.5, duration: 0.5, volume: 0.8, type: 'harmony' }
  ]);
});

// Test 2: Handles extra whitespace
runTest('Handles extra whitespace correctly', () => {
  const input = "  E4  , 1.00 , 0.25 , 0.5 , bass  \n";
  const result = parseMidiText(input);
  assert.deepStrictEqual(result, [
    { note: 'E4', time: 1.0, duration: 0.25, volume: 0.5, type: 'bass' }
  ]);
});

// Test 3: Filters out empty lines
runTest('Ignores empty lines', () => {
  const input = "C4,0.00,0.50,1.0,main\n\n  \nD4,0.50,0.50,0.8,harmony\n";
  const result = parseMidiText(input);
  assert.strictEqual(result.length, 2);
});

// Test 4: Throws error on missing fields
runTest('Throws error when line has less than 5 fields', () => {
  const input = "C4,0.00,0.50,1.0\n";
  assert.throws(() => parseMidiText(input), /Invalid MIDI line/);
});

// Test 5: Throws error on extra fields
runTest('Throws error when line has more than 5 fields', () => {
  const input = "C4,0.00,0.50,1.0,main,extra\n";
  assert.throws(() => parseMidiText(input), /Invalid MIDI line/);
});

// Test 6: Throws error on invalid numeric values
runTest('Throws error when numeric fields are invalid', () => {
  const input = "C4,invalid,0.50,1.0,main\n";
  assert.throws(() => parseMidiText(input), /Invalid numeric values/);
});

console.log(`\nTests complete. ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
