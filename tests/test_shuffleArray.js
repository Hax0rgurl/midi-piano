const fs = require('fs');
const path = require('path');

// Extract shuffleArray from index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const shuffleArrayMatch = indexHtml.match(/function shuffleArray\(array\) \{[\s\S]*?return array;\s*\}/);

if (!shuffleArrayMatch) {
  console.error('Could not find shuffleArray function in index.html');
  process.exit(1);
}

const shuffleArrayStr = shuffleArrayMatch[0];
// Use eval to define the function in this script's scope
eval(shuffleArrayStr);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function testShuffleArray() {
  console.log('Running shuffleArray tests...');

  // Test 1: Contains same elements
  const original = [1, 2, 3, 4, 5];
  const input = [...original];
  const result = shuffleArray(input);
  assert(result.length === original.length, 'Length should be the same');
  original.forEach(item => {
    assert(result.includes(item), `Result should include ${item}`);
  });
  // Sort both to verify they have identical elements
  assert(JSON.stringify([...result].sort()) === JSON.stringify([...original].sort()), 'Result should contain all original elements');
  console.log('Test 1 passed: Contains same elements and same length');

  // Test 2: Empty array
  const empty = [];
  const resultEmpty = shuffleArray([...empty]);
  assert(resultEmpty.length === 0, 'Empty array should remain empty');
  console.log('Test 2 passed: Empty array handled');

  // Test 3: Single element
  const single = [42];
  const resultSingle = shuffleArray([...single]);
  assert(resultSingle.length === 1 && resultSingle[0] === 42, 'Single element array should remain same');
  console.log('Test 3 passed: Single element handled');

  // Test 4: Deterministic shuffle with mocked Math.random
  const originalMathRandom = Math.random;
  try {
    // Mock Math.random to always return 0.5
    // Array: [1, 2, 3, 4, 5]
    // i=4: j = floor(0.5 * 5) = 2. Swap arr[4](5) and arr[2](3) -> [1, 2, 5, 4, 3]
    // i=3: j = floor(0.5 * 4) = 2. Swap arr[3](4) and arr[2](5) -> [1, 2, 4, 5, 3]
    // i=2: j = floor(0.5 * 3) = 1. Swap arr[2](4) and arr[1](2) -> [1, 4, 2, 5, 3]
    // i=1: j = floor(0.5 * 2) = 1. Swap arr[1](4) and arr[1](4) -> [1, 4, 2, 5, 3]
    Math.random = () => 0.5;
    const inputMock = [1, 2, 3, 4, 5];
    const resultMock = shuffleArray(inputMock);
    const expected = [1, 4, 2, 5, 3];
    assert(JSON.stringify(resultMock) === JSON.stringify(expected), `Mocked shuffle failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(resultMock)}`);
    console.log('Test 4 passed: Deterministic shuffling with mocked Math.random');
  } finally {
    Math.random = originalMathRandom;
  }

  // Test 5: Verify it modifies the array in-place (as per implementation)
  const inPlaceArray = [1, 2, 3];
  const returnedArray = shuffleArray(inPlaceArray);
  assert(inPlaceArray === returnedArray, 'Should shuffle array in-place');
  console.log('Test 5 passed: In-place modification verified');

  console.log('All tests passed!');
}

try {
  testShuffleArray();
} catch (error) {
  console.error('Tests failed!');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
