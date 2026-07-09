"""
Login Page — Appium Mobile POM
Covers: login screen selectors, login action, signup navigation.
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LoginPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    EMAIL_INPUT    = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
    LOGIN_BUTTON   = (By.CSS_SELECTOR, "button.btn, button[type='submit'], .login-btn, #loginBtn")
    ERROR_MESSAGE  = (By.CSS_SELECTOR, ".error-message, .alert-danger, #errorMsg, .error")
    SIGNUP_LINK    = (By.CSS_SELECTOR, "a[href*='signup'], .signup-link, a.link")
    PAGE_HEADING   = (By.CSS_SELECTOR, "h1, h2, .login-title, .card-title")

    # ── Navigation ────────────────────────────────────────────────────────────
    def navigate(self):
        self.open_url("login.html")
        self.sleep(1)

    # ── Actions ───────────────────────────────────────────────────────────────
    def enter_email(self, email: str):
        self.type(self.EMAIL_INPUT, email)

    def enter_password(self, password: str):
        self.type(self.PASSWORD_INPUT, password)

    def tap_login(self):
        self.js_click(self.LOGIN_BUTTON)

    def login(self, email: str, password: str):
        self.enter_email(email)
        self.enter_password(password)
        self.tap_login()

    def get_error_message(self) -> str:
        if self.is_element_visible(self.ERROR_MESSAGE, timeout=5):
            return self.get_text(self.ERROR_MESSAGE)
        return ""

    def navigate_to_signup(self):
        self.js_click(self.SIGNUP_LINK)

    def is_on_login_page(self) -> bool:
        return "login" in self.get_current_url()

    def get_heading_text(self) -> str:
        if self.is_element_visible(self.PAGE_HEADING, timeout=5):
            return self.get_text(self.PAGE_HEADING)
        return ""
