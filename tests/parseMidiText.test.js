
function parseMidiText(midiText) {
  if (!midiText.trim()) return [];
  return midiText.trim().split('\n').map(line => {
    const parts = line.split(',').map(part => part.trim());
    if (parts.length !== 5) return null;
    const [note, timeStr, durationStr, volumeStr, type] = parts;
    const time = parseFloat(timeStr);
    const duration = parseFloat(durationStr);
    const volume = parseFloat(volumeStr);
    if (isNaN(time) || isNaN(duration) || isNaN(volume)) return null;
    return { note, time, duration, volume, type };
  }).filter(note => note !== null);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function testParseMidiText() {
  console.log("Running tests for parseMidiText...");

  // Happy path
  const validMidi = "C4,0.00,0.50,1.0,main\nD4,0.50,0.50,0.8,harmony";
  const result1 = parseMidiText(validMidi);
  assert(result1.length === 2, "Should parse two notes");
  assert(result1[0].note === "C4", "First note should be C4");
  assert(result1[0].time === 0.0, "First note time should be 0.0");
  assert(result1[1].volume === 0.8, "Second note volume should be 0.8");
  console.log("✅ Happy path passed");

  // Edge case: Empty string
  try {
    const result2 = parseMidiText("");
    assert(Array.isArray(result2), "Empty string should return an array");
    assert(result2.length === 0, "Empty string should return empty array");
    console.log("✅ Empty string passed");
  } catch (e) {
    console.log("❌ Empty string failed:", e.message);
    throw e;
  }

  // Edge case: Malformed line (missing commas)
  try {
    const malformedMidi = "C4 0.00 0.50 1.0 main";
    const result3 = parseMidiText(malformedMidi);
    assert(result3.length === 0, "Malformed line should be filtered out");
    console.log("✅ Malformed line passed");
  } catch (e) {
    console.log("❌ Malformed line failed:", e.message);
    throw e;
  }

  // Edge case: Non-numeric values
  try {
    const nonNumericMidi = "C4,start,long,loud,main";
    const result4 = parseMidiText(nonNumericMidi);
    assert(result4.length === 0, "Non-numeric values should be filtered out");
    console.log("✅ Non-numeric values passed");
  } catch (e) {
    console.log("❌ Non-numeric values failed:", e.message);
    throw e;
  }

  // Edge case: Leading/trailing whitespace
  try {
    const whitespaceMidi = " C4 , 0.00 , 0.50 , 1.0 , main \n ";
    const result5 = parseMidiText(whitespaceMidi);
    assert(result5.length === 1, "Should parse note with whitespace");
    assert(result5[0].note === "C4", "Note name should be trimmed");
    assert(result5[0].time === 0.0, "Time should be parsed correctly after trim");
    console.log("✅ Whitespace trimming passed");
  } catch (e) {
    console.log("❌ Whitespace trimming failed:", e.message);
    throw e;
  }

  console.log("All tests passed successfully.");
}

testParseMidiText();
