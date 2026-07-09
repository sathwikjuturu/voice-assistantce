"""
Calendar Page — Appium Mobile POM
Covers: calendar events list, add event form, event tiles.
"""
import requests as _req
from selenium.webdriver.common.by import By
from .base_page import BasePage


class CalendarPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    EVENT_ITEMS    = (By.CSS_SELECTOR, ".event-item, .calendar-event, .event-card, .event-tile")
    EVENT_TITLES   = (By.CSS_SELECTOR, ".event-title, .event-name, h3.title")
    EVENT_DATES    = (By.CSS_SELECTOR, ".event-date, .date-text, .event-time")
    ADD_EVENT_BTN  = (By.CSS_SELECTOR, ".add-event-btn, #addEventBtn, .fab, button.add-btn")
    TITLE_INPUT    = (By.CSS_SELECTOR, "#eventTitle, input[name='title'], input[placeholder*='Title']")
    DATE_INPUT     = (By.CSS_SELECTOR, "#eventDate, input[type='date'], input[name='date']")
    TIME_INPUT     = (By.CSS_SELECTOR, "#eventTime, input[type='time'], input[name='time']")
    DESC_INPUT     = (By.CSS_SELECTOR, "#eventDesc, textarea[name='description'], input[name='description']")
    SAVE_EVENT_BTN = (By.CSS_SELECTOR, ".save-btn, #saveEventBtn, button[type='submit']")
    EMPTY_STATE    = (By.CSS_SELECTOR, ".empty-state, .no-events, .empty-calendar")
    PAGE_TITLE     = (By.CSS_SELECTOR, "h1, h2, .page-title")

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
        self.open_url("calendar.html")
        self.sleep(2)

    def navigate_authenticated(self, email: str, password: str):
        self._inject_token(self.base_url, email, password)
        self.open_url("calendar.html")
        self.sleep(2)

    # ── Actions ───────────────────────────────────────────────────────────────
    def get_event_items(self) -> list:
        return self.find_elements(self.EVENT_ITEMS, timeout=10)

    def get_event_count(self) -> int:
        return len(self.get_event_items())

    def get_event_titles(self) -> list:
        elements = self.find_elements(self.EVENT_TITLES, timeout=10)
        return [el.text.strip() for el in elements if el.text.strip()]

    def tap_add_event(self):
        if self.is_element_visible(self.ADD_EVENT_BTN, timeout=5):
            self.js_click(self.ADD_EVENT_BTN)
            self.sleep(0.5)

    def fill_add_event_form(self, title: str, date: str, time_val: str = "", desc: str = ""):
        if self.is_element_visible(self.TITLE_INPUT, timeout=5):
            self.type(self.TITLE_INPUT, title)
        if self.is_element_visible(self.DATE_INPUT, timeout=5):
            self.type(self.DATE_INPUT, date)
        if time_val and self.is_element_visible(self.TIME_INPUT, timeout=3):
            self.type(self.TIME_INPUT, time_val)
        if desc and self.is_element_visible(self.DESC_INPUT, timeout=3):
            self.type(self.DESC_INPUT, desc)

    def save_event(self):
        if self.is_element_visible(self.SAVE_EVENT_BTN, timeout=5):
            self.js_click(self.SAVE_EVENT_BTN)
            self.sleep(1)

    def is_calendar_page_loaded(self) -> bool:
        return (self.get_event_count() > 0 or
                self.is_element_visible(self.EMPTY_STATE, timeout=5))

    def get_page_title(self) -> str:
        if self.is_element_visible(self.PAGE_TITLE, timeout=5):
            return self.get_text(self.PAGE_TITLE)
        return ""
