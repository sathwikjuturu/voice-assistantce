"""
Dashboard Page — Appium Mobile POM
Covers: stats cards, navigation sidebar/menu, compose button, logout.
"""
import requests as _req
from selenium.webdriver.common.by import By
from .base_page import BasePage


class DashboardPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    STATS_VALUES    = (By.CSS_SELECTOR, ".stat-number, .stats-number, .count, .metric-value, [data-stat]")
    COMPOSE_BTN     = (By.CSS_SELECTOR, "button[onclick*='compose_email.html'], .compose-btn, #composeBtn")
    INBOX_LINK      = (By.CSS_SELECTOR, "a[href*='inbox'], .nav-inbox, [data-folder='inbox']")
    CONTACTS_LINK   = (By.CSS_SELECTOR, "a[href*='contacts'], .nav-contacts")
    CALENDAR_LINK   = (By.CSS_SELECTOR, "a[href*='calendar'], .nav-calendar")
    LOGOUT_BTN      = (By.CSS_SELECTOR, "a[href='login.html'], .logout-btn, #logoutBtn")
    HAMBURGER_MENU  = (By.CSS_SELECTOR, ".hamburger, .menu-toggle, .navbar-toggler, #menuToggle")
    PAGE_TITLE      = (By.CSS_SELECTOR, "h1, .page-title, .dashboard-title, .brand")
    WELCOME_TEXT    = (By.CSS_SELECTOR, ".welcome-text, .greeting, .user-name, #welcomeMsg")

    # ── Navigation ────────────────────────────────────────────────────────────
    def inject_auth_token(self, base_url: str, email: str, password: str) -> bool:
        """
        Obtain a JWT via the backend login API and inject it into
        the browser localStorage so protected pages do not redirect to login.
        """
        try:
            r = _req.post(
                f"{base_url}/api/auth/login",
                json={"email": email, "password": password},
                timeout=8
            )
            data = r.json()
            token = data.get("token", "")
            user  = data.get("user", {"email": email, "name": "Test User"})
            if token:
                # Navigate to the app root first so localStorage is accessible
                self.driver.get(base_url)
                self.sleep(1)
                self.driver.execute_script(
                    f"localStorage.setItem('voicemail_jwt', '{token}');"
                    f"localStorage.setItem('voicemail_user', '{str(user).replace(chr(39), chr(34))}');"
                )
                return True
        except Exception:
            pass
        return False

    def navigate(self):
        self.open_url("dashboard.html")
        self.sleep(2)

    def navigate_authenticated(self, email: str, password: str):
        """Inject token then navigate to dashboard."""
        self.inject_auth_token(self.base_url, email, password)
        self.open_url("dashboard.html")
        self.sleep(3)

    # ── Actions ───────────────────────────────────────────────────────────────
    def get_stats_values(self) -> list:
        elements = self.find_elements(self.STATS_VALUES, timeout=10)
        return [el.text.strip() for el in elements if el.text.strip()]

    def click_compose(self):
        self.js_click(self.COMPOSE_BTN)
        self.sleep(1)

    def click_contacts(self):
        self.js_click(self.CONTACTS_LINK)
        self.sleep(1)

    def click_calendar(self):
        self.js_click(self.CALENDAR_LINK)
        self.sleep(1)

    def click_inbox(self):
        self.js_click(self.INBOX_LINK)
        self.sleep(1)

    def open_hamburger_menu(self):
        """Open mobile hamburger/side navigation if present."""
        if self.is_element_visible(self.HAMBURGER_MENU, timeout=3):
            self.js_click(self.HAMBURGER_MENU)
            self.sleep(0.5)

    def logout(self):
        self.js_click(self.LOGOUT_BTN)
        self.sleep(2)

    def is_on_dashboard(self) -> bool:
        return "dashboard" in self.get_current_url()

    def get_welcome_text(self) -> str:
        if self.is_element_visible(self.WELCOME_TEXT, timeout=5):
            return self.get_text(self.WELCOME_TEXT)
        return ""
