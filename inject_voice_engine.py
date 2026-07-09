"""
inject_voice_engine.py
Adds <script src="js/voice-engine.js"> before </body> in every dashboard HTML file.
Safe to run multiple times (idempotent).
"""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SCRIPT_TAG = '<script src="js/voice-engine.js"></script>'

# Pages that should NOT get the engine (pure auth pages with no sidebar)
SKIP = {'splash.html', 'onboarding1.html', 'onboarding2.html'}

injected = []
already  = []
skipped  = []

for fname in os.listdir(ROOT):
    if not fname.endswith('.html'):
        continue
    if fname in SKIP:
        skipped.append(fname)
        continue

    path = os.path.join(ROOT, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Already injected?
    if 'voice-engine.js' in content:
        already.append(fname)
        continue

    # Insert before </body>
    if '</body>' in content:
        content = content.replace('</body>', f'    {SCRIPT_TAG}\n</body>', 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        injected.append(fname)
    else:
        skipped.append(fname)

print(f"[OK] Injected voice-engine.js into {len(injected)} pages:")
for f in injected:
    print(f"   + {f}")

if already:
    print(f"\n[SKIP] Already had voice-engine.js ({len(already)} pages):")
    for f in already:
        print(f"   ~ {f}")

if skipped:
    print(f"\n[SKIP] Skipped ({len(skipped)}):")
    for f in skipped:
        print(f"   - {f}")
