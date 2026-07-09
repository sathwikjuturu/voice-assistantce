from selenium.webdriver.common.by import By
from .base_page import BasePage

class ComposePage(BasePage):
    TO_INPUT = (By.CSS_SELECTOR, "input[placeholder='To:']")
    SUBJECT_INPUT = (By.CSS_SELECTOR, "input[placeholder='Subject:']")
    BODY_INPUT = (By.CSS_SELECTOR, "textarea")
    SEND_BUTTON = (By.XPATH, "//button[contains(., 'Send')]")

    def navigate(self):
        self.open_url("compose_email.html")

    def compose_email(self, to, subject, body):
        self.type(self.TO_INPUT, to)
        self.type(self.SUBJECT_INPUT, subject)
        self.type(self.BODY_INPUT, body)
        self.click(self.SEND_BUTTON)
