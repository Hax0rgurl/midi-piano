import os
import sys
from playwright.sync_api import sync_playwright

def test_generate_song():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get absolute path to index.html
        html_path = f"file://{os.path.abspath('index.html')}"
        page.goto(html_path)

        # Generate the first song
        song1 = page.evaluate("generateFullSong()")

        # Verify it's a non-empty string
        assert isinstance(song1, str), "Generated song should be a string"
        assert len(song1) > 0, "Generated song should not be empty"

        lines1 = song1.split('\n')
        assert len(lines1) > 0, "Generated song should have at least one line"

        # Verify CSV structure
        for i, line in enumerate(lines1):
            columns = line.split(',')
            assert len(columns) == 5, f"Line {i} does not have 5 columns: {line}"

            note, time, duration, volume, note_type = columns

            # Check column 1: Note (String)
            assert isinstance(note, str) and len(note) >= 2, f"Invalid note format: {note}"

            # Check column 2, 3, 4: Numbers (float parseable)
            try:
                float(time)
                float(duration)
                float(volume)
            except ValueError:
                assert False, f"Time, duration, or volume is not a valid number in line {i}: {line}"

            # Check column 5: Type
            assert note_type in ['main', 'harmony', 'bass'], f"Invalid note type: {note_type}"

        # Generate a second song to test randomness
        song2 = page.evaluate("generateFullSong()")

        # Verify it's a non-empty string
        assert isinstance(song2, str), "Generated song 2 should be a string"
        assert len(song2) > 0, "Generated song 2 should not be empty"

        # Since lengths and BPM are random, it's extremely unlikely they'll be exactly the same
        assert song1 != song2, "Successive calls to generateFullSong() should produce different results"

        print("All tests passed successfully.")

        browser.close()

if __name__ == "__main__":
    try:
        test_generate_song()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
