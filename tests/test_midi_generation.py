import pytest
from playwright.sync_api import sync_playwright
import os

@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        html_path = f"file://{os.path.abspath('index.html')}"
        page.goto(html_path)
        yield page
        browser.close()

def test_generate_full_song(browser_page):
    # Test the generateFullSong function directly
    result = browser_page.evaluate("() => generateFullSong()")

    # The result should be a non-empty string
    assert isinstance(result, str)
    assert len(result) > 0

    # Split into lines and verify CSV structure
    lines = result.strip().split('\n')
    assert len(lines) > 0

    # Verify format of first few lines
    for line in lines[:5]:
        parts = line.split(',')
        # Format: note,time,duration,volume,type
        assert len(parts) == 5

        # Check note format (e.g., C4, D#3)
        assert len(parts[0]) >= 2
        assert parts[0][0] in 'CDEFGAB'

        # Check time and duration are numbers
        assert float(parts[1]) >= 0
        assert float(parts[2]) > 0

        # Check volume is a number
        assert 0 <= float(parts[3]) <= 1.0

        # Check type is one of expected values
        assert parts[4] in ['main', 'harmony', 'bass']

def test_generate_full_song_multiple_runs(browser_page):
    # Test the generateFullSong function multiple times to check randomness
    result1 = browser_page.evaluate("() => generateFullSong()")
    result2 = browser_page.evaluate("() => generateFullSong()")

    # Output should likely be different due to randomness (extremely unlikely to be identical)
    assert result1 != result2

def test_generate_full_song_button(browser_page):
    # Initial state: midi-text should be empty or have default text, not a full generated song
    initial_text = browser_page.locator('#midi-text').input_value()

    # Click the generate button
    browser_page.click('#generate-midi')

    # Wait for the status element to indicate completion
    browser_page.wait_for_function("""
        () => document.getElementById('status').textContent === 'Full song generated successfully!'
    """, timeout=5000)

    # Check that the text area now contains the generated song
    new_text = browser_page.locator('#midi-text').input_value()

    assert new_text != initial_text
    assert "main" in new_text
    assert "harmony" in new_text
    assert "bass" in new_text
