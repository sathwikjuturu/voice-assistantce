import os
import re

directory = os.path.dirname(os.path.abspath(__file__))
script_tag = '<script src="js/app.js"></script>'

count = 0

for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if the script tag is already injected
        if script_tag in content:
            continue
            
        # Inject script tag right before </body>
        if "</body>" in content:
            new_content = content.replace("</body>", f"{script_tag}\n</body>")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count += 1
            print(f"Injected app.js into {filename}")
        else:
            print(f"Warning: </body> not found in {filename}, skipping.")

print(f"Done. Injected script tag into {count} HTML file(s).")
