import time
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.compose_page import ComposePage
from pages.contacts_page import ContactsPage

def test_page_load_and_redirect(driver, base_url):
    print("Running Test: Page Load, Splash, Onboarding and Redirect")
    login_page = LoginPage(driver, base_url)
    login_page.open_url("")  # Root path
    
    # 1. Wait for splash screen to redirect to onboarding1.html (2.5s redirect in splash.html)
    time.sleep(3.5)
    current_url = driver.current_url
    assert "onboarding1.html" in current_url, f"Expected redirect to onboarding1.html but got {current_url}"
    
    # 2. Click Continue button to go to onboarding2.html
    from selenium.webdriver.common.by import By
    continue_btn = driver.find_element(By.CSS_SELECTOR, "button.btn")
    continue_btn.click()
    time.sleep(1.5)
    
    current_url = driver.current_url
    assert "onboarding2.html" in current_url, f"Expected redirect to onboarding2.html but got {current_url}"
    
    # 3. Click Skip for now to go to login.html
    skip_link = driver.find_element(By.LINK_TEXT, "Skip for now")
    skip_link.click()
    time.sleep(1.5)
    
    current_url = driver.current_url
    assert "login.html" in current_url, f"Expected redirect to login.html but got {current_url}"


def test_login_flow(driver, base_url):
    print("Running Test: Login Flow")
    login_page = LoginPage(driver, base_url)
    login_page.navigate()
    login_page.login("john@example.com", "password123")
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 10).until(
        EC.url_contains("dashboard.html")
    )

def test_dashboard_stats(driver, base_url):
    print("Running Test: Dashboard Stats Check")
    dashboard_page = DashboardPage(driver, base_url)
    dashboard_page.navigate()
    dashboard_page.wait_for_dashboard_load()
    stats = dashboard_page.get_stats_values()
    print(f"Stats found: {stats}")
    assert len(stats) >= 3, f"Expected at least 3 stats card values, found: {len(stats)}"

def test_compose_email_navigation(driver, base_url):
    print("Running Test: Compose Email Navigation")
    dashboard_page = DashboardPage(driver, base_url)
    dashboard_page.navigate()
    dashboard_page.wait_for_dashboard_load()
    dashboard_page.click_compose()
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 10).until(
        EC.url_contains("compose_email.html")
    )

def test_contacts_list(driver, base_url):
    print("Running Test: Contacts List Check")
    contacts_page = ContactsPage(driver, base_url)
    contacts_page.navigate()
    names = contacts_page.get_contact_names()
    print(f"Contacts found: {names}")
    assert len(names) > 0, "Contacts list should contain contacts"
    assert "Sarah Jenkins" in names, "Sarah Jenkins should be present in contacts list"

def test_logout_flow(driver, base_url):
    print("Running Test: Logout Flow")
    dashboard_page = DashboardPage(driver, base_url)
    dashboard_page.navigate()
    dashboard_page.wait_for_dashboard_load()
    dashboard_page.logout()
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 10).until(
        EC.url_contains("login.html")
    )
