import os
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    def __init__(self, driver, base_url):
        self.driver = driver
        self.base_url = base_url.rstrip('/')

    def open_url(self, path=""):
        url = f"{self.base_url}/{path.lstrip('/')}"
        self.driver.get(url)
        return url

    def wait_for_element(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )

    def wait_for_element_visible(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )

    def click(self, locator, timeout=10):
        element = self.wait_for_element_visible(locator, timeout)
        self.driver.execute_script("arguments[0].click();", element)

    def type(self, locator, text, timeout=10):
        element = self.wait_for_element_visible(locator, timeout)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator, timeout=10):
        element = self.wait_for_element_visible(locator, timeout)
        return element.text

    def get_title(self):
        return self.driver.title

    def get_current_url(self):
        return self.driver.current_url

    def take_screenshot(self, name):
        screenshot_dir = os.path.join("Test Results", "Screenshots")
        if not os.path.exists(screenshot_dir):
            os.makedirs(screenshot_dir)
        filepath = os.path.join(screenshot_dir, f"{name}_{int(time.time())}.png")
        self.driver.save_screenshot(filepath)
        return filepath
