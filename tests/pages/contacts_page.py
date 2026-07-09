import time
from selenium.webdriver.common.by import By
from .base_page import BasePage

class ContactsPage(BasePage):
    CONTACT_ITEMS = (By.CSS_SELECTOR, ".glass-panel .glass-panel, .email-list .email-item")
    CONTACT_NAMES = (By.CSS_SELECTOR, ".glass-panel h4, .email-list .email-item strong, h4")

    def navigate(self):
        self.open_url("contacts.html")

    def get_contact_names(self):
        # Allow short sleep for elements to render
        time.sleep(1)
        elements = self.driver.find_elements(*self.CONTACT_NAMES)
        # Filter out header texts like "My Contacts" or similar if they are not names
        return [el.text.strip() for el in elements if el.text.strip() and el.text.strip() != "My Contacts"]
