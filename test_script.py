from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        filepath = os.path.abspath("index.html")
        page.goto(f"file://{filepath}")

        # Add a short delay to allow JS to run
        page.wait_for_timeout(1000)

        if errors:
            print("JavaScript errors found:")
            for err in errors:
                print(f"- {err}")
            exit(1)
        else:
            print("No JavaScript errors found.")

        browser.close()

if __name__ == "__main__":
    run()
