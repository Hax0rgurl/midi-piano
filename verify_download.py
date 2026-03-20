import os
from playwright.sync_api import sync_playwright, expect

def verify_download(page):
    # Get absolute path to index.html
    file_path = "file://" + os.path.abspath("index.html")
    page.goto(file_path)
    page.wait_for_timeout(500)

    # Set some text in the midi-text area
    page.evaluate("document.getElementById('midi-text').value = 'C4,0.00,1.00,1.0,main'")
    page.wait_for_timeout(500)

    # Setup download listener
    with page.expect_download() as download_info:
        # Click the download button
        page.click("#download-midi")
        page.wait_for_timeout(500)

    download = download_info.value
    print(f"Downloaded file: {download.suggested_filename}")

    # Verify the filename
    assert download.suggested_filename == "generated_midi.mid"

    # Take a screenshot
    page.screenshot(path="/home/jules/verification/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Record video
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_download(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            context.close()
            browser.close()
