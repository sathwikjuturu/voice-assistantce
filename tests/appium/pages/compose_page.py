"""
Compose Email Page — Appium Mobile POM
Covers: To/Subject/Body inputs, send button, voice dictation trigger check.
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ComposePage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────────
    TO_INPUT       = (By.CSS_SELECTOR, "#to, input[name='to'], input[placeholder*='To'], .to-input")
    SUBJECT_INPUT  = (By.CSS_SELECTOR, "#subject, input[name='subject'], input[placeholder*='Subject'], .subject-input")
    BODY_INPUT     = (By.CSS_SELECTOR, "#body, textarea[name='body'], .body-input, .email-body, #emailBody")
    SEND_BTN       = (By.CSS_SELECTOR, ".send-btn, #sendBtn, button[onclick*='send'], button.btn-primary")
    SAVE_DRAFT_BTN = (By.CSS_SELECTOR, ".draft-btn, #saveDraftBtn, button[onclick*='draft']")
    DISCARD_BTN    = (By.CSS_SELECTOR, ".discard-btn, #discardBtn, .cancel-btn")
    VOICE_BTN      = (By.CSS_SELECTOR, ".voice-btn, .mic-btn, #voiceBtn, [data-action='voice']")
    PAGE_TITLE     = (By.CSS_SELECTOR, "h1, h2, .page-title, .compose-title")

    # ── Navigation ────────────────────────────────────────────────────────────
    def navigate(self):
        self.open_url("compose_email.html")
        self.sleep(1)

    # ── Actions ───────────────────────────────────────────────────────────────
    def enter_recipient(self, email: str):
        if self.is_element_visible(self.TO_INPUT, timeout=8):
            self.type(self.TO_INPUT, email)

    def enter_subject(self, subject: str):
        if self.is_element_visible(self.SUBJECT_INPUT, timeout=8):
            self.type(self.SUBJECT_INPUT, subject)

    def enter_body(self, body: str):
        if self.is_element_visible(self.BODY_INPUT, timeout=8):
            self.type(self.BODY_INPUT, body)

    def fill_compose_form(self, recipient: str, subject: str, body: str):
        self.enter_recipient(recipient)
        self.enter_subject(subject)
        self.enter_body(body)

    def tap_send(self):
        self.js_click(self.SEND_BTN)
        self.sleep(2)

    def tap_save_draft(self):
        if self.is_element_visible(self.SAVE_DRAFT_BTN, timeout=5):
            self.js_click(self.SAVE_DRAFT_BTN)
            self.sleep(1)

    def get_recipient_value(self) -> str:
        return self.get_attribute(self.TO_INPUT, "value")

    def get_subject_value(self) -> str:
        return self.get_attribute(self.SUBJECT_INPUT, "value")

    def get_body_value(self) -> str:
        el = self.wait_for_element(self.BODY_INPUT, timeout=5)
        return el.get_attribute("value") or el.text or ""

    def is_voice_button_visible(self) -> bool:
        return self.is_element_visible(self.VOICE_BTN, timeout=5)

    def is_on_compose_page(self) -> bool:
        return "compose" in self.get_current_url()
