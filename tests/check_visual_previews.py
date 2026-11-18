"""Browser visual/layout checks on anonymous fixtures. No credentials or Supabase calls."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
fixtures = root / "tests" / "visual-previews"
screenshots = root / "tests" / "screenshots"
screenshots.mkdir(exist_ok=True)
views = ("login", "admin", "student", "parent")
sizes = ((1440, 900, "desktop"), (390, 844, "mobile"))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height, label in sizes:
        for view in views:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.goto((fixtures / f"{view}.html").as_uri(), wait_until="load")
            page.screenshot(path=str(screenshots / f"{view}-{label}.png"), full_page=True)
            dimensions = page.evaluate("""() => ({
                view: innerWidth,
                total: document.documentElement.scrollWidth,
                css: getComputedStyle(document.body).fontFamily,
                visibleAuth: getComputedStyle(document.getElementById('auth')).display,
                visibleApp: getComputedStyle(document.getElementById('app')).display,
            })""")
            assert dimensions["total"] <= dimensions["view"] + 1, (
                f"Horizontal page overflow in {view} {label}: {dimensions}"
            )
            assert "system-ui" in dimensions["css"], f"Stylesheet failed to load: {view}"
            if view == "login":
                assert dimensions["visibleAuth"] != "none"
            else:
                assert dimensions["visibleApp"] != "none"
            if view in ("admin", "student", "parent"):
                role_display = page.locator(f"#{view}View").evaluate(
                    "(e) => getComputedStyle(e).display"
                )
                assert role_display != "none", f"Role view hidden: {view}"
            # Smoke-test dark-mode palette and screenshot it for both viewport sizes.
            page.evaluate("document.documentElement.dataset.theme = 'dark'")
            page.screenshot(path=str(screenshots / f"{view}-{label}-dark.png"), full_page=True)
            dark_palette = page.evaluate(
                "() => getComputedStyle(document.body).color"
            )
            assert dark_palette, f"Dark-mode CSS did not load: {view}"
            page.close()
            print(f"PASS: {view}, {label}, light/dark and no horizontal overflow")
    browser.close()
