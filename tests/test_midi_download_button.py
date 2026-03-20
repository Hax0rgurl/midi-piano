import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_url = f"file://{os.path.abspath('index.html')}"
        await page.goto(file_url)

        midi_text = "note,time,duration,volume,type\\nC4,0,100,64,0"
        await page.evaluate(f"""
            document.getElementById('midi-text').value = '{midi_text}';
        """)

        async with page.expect_event("popup") as popup_info:
            await page.click('#download-midi')

        new_page = await popup_info.value
        await new_page.wait_for_load_state()

        pre_content = await new_page.evaluate("document.querySelector('pre').textContent")
        if pre_content == "note,time,duration,volume,type\nC4,0,100,64,0":
            print("SUCCESS: Content matches expected midiText.")
        else:
            print(f"FAILED: Content mismatch. Expected '{midi_text}', got '{pre_content}'")

        download_link = await new_page.evaluate("document.querySelector('a').textContent")
        if download_link == "Download MIDI File":
            print("SUCCESS: Download link text is correct.")
        else:
            print(f"FAILED: Download link mismatch. Expected 'Download MIDI File', got '{download_link}'")

        title = await new_page.evaluate("document.title")
        if title == "Generated MIDI":
            print("SUCCESS: Title is Generated MIDI.")
        else:
            print(f"FAILED: Title mismatch. Expected 'Generated MIDI', got '{title}'")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
