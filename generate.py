import os
import re

html_head = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VoiceMail AI - Smart Assistant</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* Smooth transitions between pages */
        body {
            animation: fadeIn 0.3s ease-in-out forwards;
        }
    </style>
</head>
<body>
"""

html_foot = """
    <!-- Toast Notifications -->
    <div id="toast-container"></div>
</body>
</html>
"""

mic_btn = """
    <!-- Global Floating Mic Button for Voice Commands -->
    <div id="voice-assistant-btn" onclick="window.location.href='voice_overlay.html'">
        <div class="mic-ripple"></div>
        <i class="fa-solid fa-microphone"></i>
    </div>
"""

auth_screens = ['splash', 'onboarding1', 'onboarding2', 'login', 'signup', 'forgot_password', 'otp', 'reset_success', 'voice_overlay']

def get_layout(content, current_route):
    nav_items = [
        ("Main", None, None),
        ("Dashboard", "dashboard.html", "fa-house"),
        ("Inbox", "inbox_primary.html", "fa-inbox"),
        ("Sent", "sent_items.html", "fa-paper-plane"),
        ("Drafts", "drafts.html", "fa-file-lines"),
        ("Organize", None, None),
        ("Folders", "custom_folders.html", "fa-folder"),
        ("Contacts", "contacts.html", "fa-users"),
        ("Calendar", "calendar.html", "fa-calendar"),
        ("Preferences", None, None),
        ("Settings", "settings_general.html", "fa-gear"),
        ("Help", "help.html", "fa-circle-question"),
    ]
    
    nav_html = ""
    for name, link, icon in nav_items:
        if link is None:
            nav_html += f'<li style="font-size: 0.8rem; color: var(--text-muted); margin: 1.5rem 0 0.5rem 0.5rem; text-transform: uppercase; letter-spacing: 1px;">{name}</li>\n'
        else:
            active_class = ""
            if name == "Dashboard" and current_route == 'dashboard': active_class = "active"
            elif name == "Inbox" and current_route in ['inbox_primary', 'inbox_promotions', 'inbox_social', 'read_email', 'compose_email', 'reply_email', 'forward_email']: active_class = "active"
            elif name == "Sent" and current_route == 'sent_items': active_class = "active"
            elif name == "Drafts" and current_route == 'drafts': active_class = "active"
            elif name == "Folders" and current_route == 'custom_folders': active_class = "active"
            elif name == "Contacts" and current_route in ['contacts', 'contact_details']: active_class = "active"
            elif name == "Calendar" and current_route in ['calendar', 'event_details']: active_class = "active"
            elif name == "Settings" and current_route in ['settings_general', 'settings_voice', 'account_details', 'security', 'theme', 'settings_notifications', 'signature', 'storage']: active_class = "active"
            elif name == "Help" and current_route in ['help', 'voice_cheatsheet']: active_class = "active"
            
            nav_html += f'<a href="{link}"><li class="nav-item {active_class}"><i class="fa-solid {icon}"></i> {name}</li></a>\n'

    return f"""
    <div class="dashboard-layout">
        <nav class="sidebar">
            <div class="sidebar-logo gradient-text">
                <i class="fa-solid fa-microphone-lines"></i> VoiceMail
            </div>
            <ul style="flex: 1;">
                {nav_html}
            </ul>
            <a href="login.html"><li class="nav-item" style="color: var(--error);"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</li></a>
        </nav>
        
        <main class="main-content">
            <header class="topbar">
                <div class="search-bar" onclick="window.location.href='search.html'" style="cursor: pointer;">
                    <i class="fa-solid fa-magnifying-glass text-muted"></i>
                    <input type="text" placeholder="Search emails, contacts..." style="pointer-events: none;">
                </div>
                <div class="user-profile">
                    <a href="notifications.html" style="color: var(--text-muted); font-size: 1.2rem; margin-right: 1rem;"><i class="fa-solid fa-bell"></i></a>
                    <a href="profile.html" style="display: flex; align-items: center; gap: 0.8rem; color: white;">
                        <div class="avatar">JD</div>
                        <span style="font-weight: 500;">John Doe</span>
                    </a>
                </div>
            </header>
            <div class="page-content">
                {content}
            </div>
        </main>
    </div>
    """

# Read views.js
with open("js/views.js", "r", encoding="utf-8") as f:
    views_content = f.read()

pattern = re.compile(r'([a-zA-Z0-9_]+):\s*`([^`]*)`', re.MULTILINE)
matches = pattern.findall(views_content)

for key, content in matches:
    content = re.sub(r"window\.location\.hash='#([a-zA-Z0-9_]+)'", r"window.location.href='\g<1>.html'", content)
    content = re.sub(r'href="#([a-zA-Z0-9_]+)"', r'href="\g<1>.html"', content)
    
    if key in auth_screens:
        if key == 'splash':
            splash_head = html_head.replace('</head>', '    <script>\n        window.onload = function() {\n            setTimeout(function() {\n                window.location.href = "login.html";\n            }, 2500);\n        };\n    </script>\n</head>')
            final_html = splash_head + '<div id="app">\n' + content + '\n</div>'
        else:
            final_html = html_head + '<div id="app">\n' + content + '\n</div>'
        if key == 'voice_overlay':
            final_html += mic_btn
        final_html += html_foot
    else:
        layout = get_layout(content, key)
        final_html = html_head + '<div id="app">\n' + layout + '\n</div>\n' + mic_btn + html_foot
        
    with open(f"{key}.html", "w", encoding="utf-8") as f:
        f.write(final_html)

# Create an index.html that redirects to login.html and clears session keys
with open("index.html", "w", encoding="utf-8") as f:
    f.write('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>VoiceMail AI - Smart Assistant</title><script>localStorage.removeItem("voicemail_jwt"); localStorage.removeItem("voicemail_user"); localStorage.removeItem("ls_current_user"); window.location.href = "login.html";</script></head><body></body></html>')

print("Generated HTML files successfully.")
