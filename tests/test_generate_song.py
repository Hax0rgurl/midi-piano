import os
import pytest
from playwright.sync_api import Page
import pathlib

def test_generate_song_output_structure(page: Page):
    html_path = pathlib.Path('index.html').absolute().as_uri()
    page.goto(html_path)

    # Generate a song
    song_text = page.evaluate("generateFullSong()")

    # Verify it's a non-empty string
    assert isinstance(song_text, str)
    assert len(song_text) > 0

    # Parse as CSV and check lines
    lines = song_text.strip().split('\n')
    assert len(lines) > 0, "Generated song should have at least one line"

    for i, line in enumerate(lines):
        columns = line.split(',')
        assert len(columns) == 5, f"Line {i} does not have exactly 5 columns: {line}"

        note, time_str, duration_str, volume_str, track_type = columns

        # note should be a string like 'C4', 'A#3'
        assert isinstance(note, str)
        assert len(note) >= 2

        # time, duration, volume should be floats
        try:
            time = float(time_str)
            duration = float(duration_str)
            volume = float(volume_str)
        except ValueError:
            pytest.fail(f"Invalid numeric value in line {i}: {line}")

        assert time >= 0
        assert duration > 0
        assert 0 <= volume <= 1.0

        # type should be one of main, harmony, bass
        assert track_type in ['main', 'harmony', 'bass'], f"Invalid track type {track_type} in line {i}"

def test_generate_song_deterministic(page: Page):
    html_path = pathlib.Path('index.html').absolute().as_uri()
    page.goto(html_path)

    mock_random_script = """
    (() => {
        window.mockCounter = 0;
        Math.random = () => {
            window.mockCounter++;
            return (window.mockCounter % 10) / 10;
        };
    })();
    """
    page.evaluate(mock_random_script)

    song_text_1 = page.evaluate("generateFullSong()")

    page.evaluate("window.mockCounter = 0;")

    song_text_2 = page.evaluate("generateFullSong()")

    assert song_text_1 == song_text_2, "Song generation should be deterministic when Math.random is mocked"
    assert len(song_text_1.split('\n')) > 10, "Generated deterministic song should have multiple lines"
