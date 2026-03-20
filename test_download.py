import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_url = f"file://{os.path.abspath('index.html')}"
        await page.goto(file_url)

        # Click the download button
        async with page.expect_popup() as popup_info:
            await page.click('#download-midi')

        popup = await popup_info.value

        # Verify the popup content
        await popup.wait_for_load_state()

        # Check if the <pre> tag exists and has the correct content
        pre_text = await popup.evaluate('document.querySelector("pre").textContent')
        print(f"pre_text snippet: {pre_text[:50]}")

        assert "MIDI File Content:" in pre_text

        # Check if the download link exists
        link_text = await popup.evaluate('document.querySelector("a").textContent')
        print(f"link text: {link_text}")
        assert link_text == 'Download MIDI File'

        await browser.close()
        print("Tests passed successfully!")

asyncio.run(run())
