import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        file_path = f"file://{os.path.abspath('index.html')}"
        print(f"Navigating to {file_path}")

        await page.goto(file_path)

        # Enable audio context
        print("Clicking body to enable audio context...")
        await page.locator('body').click()
        await asyncio.sleep(0.5)

        # Generate MIDI sequence
        print("Inputting mock MIDI text...")
        await page.evaluate("""() => {
            const midiText = 'C4,0.00,0.50,0.80,main\\nD4,0.50,0.50,0.80,main';
            const el = document.getElementById('midi-text');
            if (el.tagName === 'DIV') {
                el.textContent = midiText;
            } else {
                el.value = midiText;
            }
        }""")

        # Click the play button to trigger playNextNote
        play_button = page.locator('#play')
        if await play_button.count() > 0:
             print("Clicking play button...")
             await play_button.click()
             await asyncio.sleep(2) # Wait a bit to let notes play
        else:
             print("Could not find play button.")

        if errors:
            print("Errors found:")
            for e in errors:
                print(e)
            exit(1)
        else:
            print("No console errors found. Verification successful.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
