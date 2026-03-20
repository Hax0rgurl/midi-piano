import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Open index.html
        file_url = f"file://{os.path.abspath('index.html')}"
        await page.goto(file_url)

        # Inject XSS payload into midi-text
        xss_payload = "<script>window.xss_executed = true;</script>XSS"
        await page.evaluate(f"""
            document.getElementById('midi-text').value = '{xss_payload}';
        """)

        # Listen for new page
        async with page.expect_event("popup") as popup_info:
            await page.click('#download-midi')

        new_page = await popup_info.value
        await new_page.wait_for_load_state()

        # Check if XSS was executed
        xss_executed = await new_page.evaluate("window.xss_executed === true")
        if xss_executed:
            print("FAILED: XSS vulnerability is still present.")
            await browser.close()
            return

        # Check if textContent is correct
        pre_content = await new_page.evaluate("document.querySelector('pre').textContent")
        if pre_content == xss_payload:
            print("SUCCESS: XSS blocked and text content is preserved.")
        else:
            print(f"FAILED: Content mismatch. Expected '{xss_payload}', got '{pre_content}'")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
