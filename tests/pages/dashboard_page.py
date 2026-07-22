from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from .base_page import BasePage

class DashboardPage(BasePage):
    COMPOSE_BUTTON = (By.CSS_SELECTOR, "button[onclick*='compose_email.html']")
    LOGOUT_LINK = (By.CSS_SELECTOR, "a[href='login.html']")
    CONTACTS_LINK = (By.CSS_SELECTOR, "a[href='contacts.html']")
    STAT_CARD_VALUES = (By.CSS_SELECTOR, ".stat-card h3")
    EMAIL_ITEMS = (By.CSS_SELECTOR, ".email-list .email-item")

    def navigate(self):
        self.open_url("dashboard.html")

    def wait_for_dashboard_load(self):
        def check_loaded(driver):
            elements = driver.find_elements(*self.STAT_CARD_VALUES)
            if len(elements) > 0:
                text = elements[0].text
                return text != "1,245" and text != ""
            return False
        WebDriverWait(self.driver, 10).until(check_loaded)

    def click_compose(self):
        self.click(self.COMPOSE_BUTTON)

    def click_contacts(self):
        self.click(self.CONTACTS_LINK)

    def logout(self):
        self.click(self.LOGOUT_LINK)

    def get_stats_values(self):
        elements = self.driver.find_elements(*self.STAT_CARD_VALUES)
        return [el.text for el in elements]

    def get_email_items_count(self):
        elements = self.driver.find_elements(*self.EMAIL_ITEMS)
        return len(elements)
