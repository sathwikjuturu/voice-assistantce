"""
Base Page — Core Appium/Selenium driver abstraction.

All Page Object Model classes inherit from this.
Works with both Appium WebDriver (Android/Chrome) and
plain Selenium WebDriver (desktop Chrome fallback).
"""
import os
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, WebDriverException
)

SCREENSHOT_DIR = os.path.join("Appium Test Results", "Screenshots")


class BasePage:
    def __init__(self, driver, base_url: str):
        self.driver = driver
        self.base_url = base_url.rstrip("/")

    # ── Navigation ────────────────────────────────────────────────────────────
    def open_url(self, path: str = "") -> str:
        url = f"{self.base_url}/{path.lstrip('/')}" if path else self.base_url
        self.driver.get(url)
        return url

    def get_current_url(self) -> str:
        return self.driver.current_url

    def get_title(self) -> str:
        return self.driver.title

    # ── Waits ─────────────────────────────────────────────────────────────────
    def wait_for_element(self, locator, timeout: int = 15):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )

    def wait_for_element_visible(self, locator, timeout: int = 15):
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )

    def wait_for_url_contains(self, keyword: str, timeout: int = 15) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.url_contains(keyword)
            )
            return True
        except TimeoutException:
            return False

    def wait_for_element_clickable(self, locator, timeout: int = 15):
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )

    # ── Interactions ──────────────────────────────────────────────────────────
    def click(self, locator, timeout: int = 15):
        el = self.wait_for_element_clickable(locator, timeout)
        el.click()

    def type(self, locator, text: str, timeout: int = 15):
        el = self.wait_for_element_visible(locator, timeout)
        el.clear()
        el.send_keys(text)

    def get_text(self, locator, timeout: int = 15) -> str:
        el = self.wait_for_element_visible(locator, timeout)
        return el.text

    def is_element_visible(self, locator, timeout: int = 5) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(locator)
            )
            return True
        except TimeoutException:
            return False

    def find_elements(self, locator, timeout: int = 10):
        try:
            self.wait_for_element(locator, timeout)
            return self.driver.find_elements(*locator)
        except TimeoutException:
            return []

    def scroll_into_view(self, locator, timeout: int = 10):
        el = self.wait_for_element(locator, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", el)
        return el

    def js_click(self, locator, timeout: int = 10):
        """JavaScript click — works when native click is intercepted on mobile."""
        el = self.wait_for_element(locator, timeout)
        self.driver.execute_script("arguments[0].click();", el)

    def get_attribute(self, locator, attr: str, timeout: int = 10) -> str:
        el = self.wait_for_element(locator, timeout)
        return el.get_attribute(attr) or ""

    # ── Screenshots ───────────────────────────────────────────────────────────
    def take_screenshot(self, name: str) -> str:
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        ts = int(time.time())
        filepath = os.path.join(SCREENSHOT_DIR, f"{name}_{ts}.png")
        try:
            self.driver.save_screenshot(filepath)
        except WebDriverException:
            pass
        return filepath

    # ── Helpers ───────────────────────────────────────────────────────────────
    def sleep(self, seconds: float):
        time.sleep(seconds)
