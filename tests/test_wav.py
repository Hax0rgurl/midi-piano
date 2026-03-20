import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True)
        page = await context.new_page()

        # Navigate to index.html
        path = os.path.abspath('index.html')
        await page.goto(f'file://{path}')

        # Bypass readonly attribute
        await page.evaluate("document.getElementById('midi-text').removeAttribute('readonly')")

        # Generate some dummy midi text so we have something to download
        await page.locator('#midi-text').fill('C4,0.00,0.50,1.0,main')

        async with page.expect_download() as download_info:
            await page.locator('#download-wav').click()

        download = await download_info.value
        print("Download successful:", download.suggested_filename)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
