import time
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.compose_page import ComposePage
from pages.contacts_page import ContactsPage

def test_page_load_and_redirect(driver, base_url):
    print("Running Test: Page Load and Redirect")
    login_page = LoginPage(driver, base_url)
    login_page.open_url("")  # Root path
    time.sleep(2)
    current_url = driver.current_url
    assert "login.html" in current_url, f"Expected redirect to login.html but got {current_url}"

def test_login_flow(driver, base_url):
    print("Running Test: Login Flow")
    login_page = LoginPage(driver, base_url)
    login_page.navigate()
    login_page.login("john@example.com", "password123")
    time.sleep(2)
    current_url = driver.current_url
    assert "dashboard.html" in current_url, f"Expected redirect to dashboard.html but got {current_url}"

def test_dashboard_stats(driver, base_url):
    print("Running Test: Dashboard Stats Check")
    dashboard_page = DashboardPage(driver, base_url)
    dashboard_page.navigate()
    stats = dashboard_page.get_stats_values()
    print(f"Stats found: {stats}")
    assert len(stats) >= 3, f"Expected at least 3 stats card values, found: {len(stats)}"

def test_compose_email_navigation(driver, base_url):
    print("Running Test: Compose Email Navigation")
    dashboard_page = DashboardPage(driver, base_url)
    dashboard_page.navigate()
    dashboard_page.click_compose()
    time.sleep(1)
    current_url = driver.current_url
    assert "compose_email.html" in current_url, f"Expected URL to be compose_email.html but got {current_url}"

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
    dashboard_page.logout()
    time.sleep(2)
    current_url = driver.current_url
    assert "login.html" in current_url, f"Expected redirect to login.html on logout, but got {current_url}"
