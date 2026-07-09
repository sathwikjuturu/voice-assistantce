"""
Signup Page — Appium Mobile POM
Covers: signup form interactions, registration flow.
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class SignupPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    NAME_INPUT     = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='Name'], #name, #fullName")
    EMAIL_INPUT    = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
    CONFIRM_PASS   = (By.CSS_SELECTOR, "input[name='confirmPassword'], #confirmPassword, input[placeholder*='Confirm']")
    SIGNUP_BUTTON  = (By.CSS_SELECTOR, "button[type='submit'], .signup-btn, button.btn, #signupBtn")
    ERROR_MESSAGE  = (By.CSS_SELECTOR, ".error-message, .alert-danger, #errorMsg, .error")
    LOGIN_LINK     = (By.CSS_SELECTOR, "a[href*='login'], .login-link")
    PAGE_HEADING   = (By.CSS_SELECTOR, "h1, h2, .signup-title, .card-title")

    # ── Navigation ────────────────────────────────────────────────────────────
    def navigate(self):
        self.open_url("signup.html")
        self.sleep(1)

    # ── Actions ───────────────────────────────────────────────────────────────
    def enter_name(self, name: str):
        if self.is_element_visible(self.NAME_INPUT, timeout=5):
            self.type(self.NAME_INPUT, name)

    def enter_email(self, email: str):
        self.type(self.EMAIL_INPUT, email)

    def enter_password(self, password: str):
        self.type(self.PASSWORD_INPUT, password)

    def enter_confirm_password(self, password: str):
        if self.is_element_visible(self.CONFIRM_PASS, timeout=3):
            self.type(self.CONFIRM_PASS, password)

    def tap_signup(self):
        self.js_click(self.SIGNUP_BUTTON)

    def signup(self, name: str, email: str, password: str):
        self.enter_name(name)
        self.enter_email(email)
        self.enter_password(password)
        self.enter_confirm_password(password)
        self.tap_signup()

    def get_error_message(self) -> str:
        if self.is_element_visible(self.ERROR_MESSAGE, timeout=5):
            return self.get_text(self.ERROR_MESSAGE)
        return ""

    def navigate_to_login(self):
        self.js_click(self.LOGIN_LINK)

    def is_on_signup_page(self) -> bool:
        return "signup" in self.get_current_url()

    def get_heading_text(self) -> str:
        if self.is_element_visible(self.PAGE_HEADING, timeout=5):
            return self.get_text(self.PAGE_HEADING)
        return ""
