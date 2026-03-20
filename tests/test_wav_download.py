import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_path = f"file://{os.path.abspath('index.html')}"
        print(f"Navigating to {file_path}")
        await page.goto(file_path)

        # Click Generate Midi button
        print("Clicking Generate Complex MIDI Song button...")
        await page.click("text=Generate Complex MIDI Song")

        # Wait for the status text to be "Full song generated successfully!"
        print("Waiting for generation to complete...")
        await page.wait_for_function("document.getElementById('status').textContent === 'Full song generated successfully!'", timeout=5000)

        # Click Download WAV File button and expect a download
        print("Clicking Download WAV File button...")

        async with page.expect_download() as download_info:
            await page.click("text=Download WAV File")

        download = await download_info.value
        print(f"Downloaded file name: {download.suggested_filename}")

        if download.suggested_filename == "generated_audio.wav":
            print("WAV download test passed!")
        else:
            print("WAV download test failed, unexpected filename.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
