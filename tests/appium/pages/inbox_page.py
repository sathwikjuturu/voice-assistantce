"""
Inbox Page — Appium Mobile POM
Covers: email list, email item tap, read state check.
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class InboxPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    EMAIL_LIST      = (By.CSS_SELECTOR, ".email-list, .inbox-list, #emailList, .mail-list")
    EMAIL_ITEMS     = (By.CSS_SELECTOR, ".email-item, .mail-item, .message-row, .inbox-item")
    EMAIL_SUBJECT   = (By.CSS_SELECTOR, ".email-subject, .subject, .mail-subject")
    EMAIL_SENDER    = (By.CSS_SELECTOR, ".email-sender, .sender, .from-name")
    UNREAD_COUNT    = (By.CSS_SELECTOR, ".unread-count, .badge, .count-badge, #unreadCount")
    SEARCH_INPUT    = (By.CSS_SELECTOR, "input[type='search'], #searchInput, .search-input, input[placeholder*='Search']")
    FILTER_TABS     = (By.CSS_SELECTOR, ".tab, .filter-tab, .folder-tab")
    LOADING_SPINNER = (By.CSS_SELECTOR, ".spinner, .loading, .loader")
    EMPTY_STATE     = (By.CSS_SELECTOR, ".empty-state, .no-emails, .empty-inbox")
    PAGE_TITLE      = (By.CSS_SELECTOR, "h1, h2, .page-title")

    # ── Navigation ────────────────────────────────────────────────────────────
    def navigate(self):
        self.open_url("inbox.html")
        self.sleep(2)

    def navigate_to_dashboard_inbox(self):
        """Navigate to inbox via the dashboard link."""
        self.open_url("dashboard.html")
        self.sleep(1)

    # ── Actions ───────────────────────────────────────────────────────────────
    def get_email_items(self) -> list:
        return self.find_elements(self.EMAIL_ITEMS, timeout=10)

    def get_email_count(self) -> int:
        return len(self.get_email_items())

    def get_first_email_subject(self) -> str:
        items = self.find_elements(self.EMAIL_SUBJECT, timeout=10)
        return items[0].text.strip() if items else ""

    def tap_first_email(self):
        items = self.get_email_items()
        if items:
            self.driver.execute_script("arguments[0].click();", items[0])
            self.sleep(1)

    def search_emails(self, query: str):
        if self.is_element_visible(self.SEARCH_INPUT, timeout=5):
            self.type(self.SEARCH_INPUT, query)
            self.sleep(1)

    def is_inbox_loaded(self) -> bool:
        # Either email items exist, or empty state is shown - both mean page loaded
        return self.get_email_count() > 0 or self.is_element_visible(self.EMPTY_STATE, timeout=5)

    def get_page_title(self) -> str:
        if self.is_element_visible(self.PAGE_TITLE, timeout=5):
            return self.get_text(self.PAGE_TITLE)
        return ""
