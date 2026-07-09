import os
import re

directory = r"c:\Users\sathw\Desktop\voice mail frontend"

for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        new_content = re.sub(r"window\.location\.hash='#([a-zA-Z0-9_]+)'", r"window.location.href='\g<1>.html'", content)
        
        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)

print("Links fixed successfully.")
