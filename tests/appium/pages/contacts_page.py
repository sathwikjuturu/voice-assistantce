"""
Contacts Page — Appium Mobile POM
Covers: contacts list, search, add contact form, delete contact.
"""
import requests as _req
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ContactsPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    CONTACT_ITEMS   = (By.CSS_SELECTOR, ".contact-item, .contact-card, .contact-row, .person-card")
    CONTACT_NAMES   = (By.CSS_SELECTOR, ".contact-name, .name, h3.contact-title, .card-name")
    CONTACT_EMAILS  = (By.CSS_SELECTOR, ".contact-email, .email-text, .contact-info")
    SEARCH_INPUT    = (By.CSS_SELECTOR, "input[type='search'], #searchContacts, .search-input, input[placeholder*='Search']")
    ADD_BTN         = (By.CSS_SELECTOR, ".add-contact-btn, #addContactBtn, .fab, button.add-btn")
    NAME_INPUT      = (By.CSS_SELECTOR, "#contactName, input[name='name'], input[placeholder*='Name']")
    EMAIL_INPUT     = (By.CSS_SELECTOR, "#contactEmail, input[name='email'], input[placeholder*='Email']")
    PHONE_INPUT     = (By.CSS_SELECTOR, "#contactPhone, input[name='phone'], input[placeholder*='Phone']")
    SAVE_CONTACT_BTN= (By.CSS_SELECTOR, ".save-btn, #saveContactBtn, button[type='submit']")
    DELETE_BTNS     = (By.CSS_SELECTOR, ".delete-btn, .remove-btn, button[data-action='delete']")
    EMPTY_STATE     = (By.CSS_SELECTOR, ".empty-state, .no-contacts")
    PAGE_TITLE      = (By.CSS_SELECTOR, "h1, h2, .page-title")

    # ── Navigation ────────────────────────────────────────────────────────────
    def _inject_token(self, base_url, email, password):
        try:
            r = _req.post(f"{base_url}/api/auth/login", json={"email": email, "password": password}, timeout=8)
            token = r.json().get("token", "")
            if token:
                self.driver.get(base_url)
                self.sleep(1)
                self.driver.execute_script(f"localStorage.setItem('voicemail_jwt', '{token}');")
                return True
        except Exception:
            pass
        return False

    def navigate(self):
        self.open_url("contacts.html")
        self.sleep(2)

    def navigate_authenticated(self, email: str, password: str):
        self._inject_token(self.base_url, email, password)
        self.open_url("contacts.html")
        self.sleep(2)

    # ── Actions ───────────────────────────────────────────────────────────────
    def get_contact_items(self) -> list:
        return self.find_elements(self.CONTACT_ITEMS, timeout=10)

    def get_contact_count(self) -> int:
        return len(self.get_contact_items())

    def get_contact_names(self) -> list:
        elements = self.find_elements(self.CONTACT_NAMES, timeout=10)
        return [el.text.strip() for el in elements if el.text.strip()]

    def search_contacts(self, query: str):
        if self.is_element_visible(self.SEARCH_INPUT, timeout=5):
            self.type(self.SEARCH_INPUT, query)
            self.sleep(1)

    def tap_add_contact(self):
        if self.is_element_visible(self.ADD_BTN, timeout=5):
            self.js_click(self.ADD_BTN)
            self.sleep(0.5)

    def fill_add_contact_form(self, name: str, email: str, phone: str = ""):
        if self.is_element_visible(self.NAME_INPUT, timeout=5):
            self.type(self.NAME_INPUT, name)
        if self.is_element_visible(self.EMAIL_INPUT, timeout=5):
            self.type(self.EMAIL_INPUT, email)
        if phone and self.is_element_visible(self.PHONE_INPUT, timeout=3):
            self.type(self.PHONE_INPUT, phone)

    def save_contact(self):
        if self.is_element_visible(self.SAVE_CONTACT_BTN, timeout=5):
            self.js_click(self.SAVE_CONTACT_BTN)
            self.sleep(1)

    def is_contacts_page_loaded(self) -> bool:
        return (self.get_contact_count() > 0 or
                self.is_element_visible(self.EMPTY_STATE, timeout=5))

    def get_page_title(self) -> str:
        if self.is_element_visible(self.PAGE_TITLE, timeout=5):
            return self.get_text(self.PAGE_TITLE)
        return ""
