"""Move inline DB credentials out of api/contact.php into the gitignored
api/contact.local.php.

The credentials are read out of the tracked file and written to the local
one; nothing is printed. Run once. Safe to re-run: it exits early if
contact.php no longer holds credentials.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACKED = os.path.join(ROOT, "api", "contact.php")
LOCAL = os.path.join(ROOT, "api", "contact.local.php")

src = io.open(TRACKED, encoding="utf-8").read()

found = dict(
    re.findall(r"const (DB_NAME|DB_USER|DB_PASS)\s*=\s*'([^']*)'", src)
)
if not any(found.values()):
    print("contact.php holds no inline credentials -- nothing to move.")
    raise SystemExit(0)

body = "\n".join(
    [
        "<?php",
        "/**",
        " * Local database credentials for api/contact.php.",
        " *",
        " * This file is gitignored on purpose: it must never be committed.",
        " * Upload it to the server manually, or set the values in the",
        " * InfinityFree control panel instead. See README.md.",
        " */",
        "",
    ]
)
for const in ("DB_NAME", "DB_USER", "DB_PASS"):
    if found.get(const):
        body += f"define('BFX_{const}', '{found[const]}');\n"

if "SITE_ORIGIN" in src:
    origin = re.search(r"const SITE_ORIGIN\s*=\s*'([^']*)'", src)
    if origin:
        body += f"\ndefine('BFX_SITE_ORIGIN', '{origin.group(1)}');\n"

io.open(LOCAL, "w", encoding="utf-8", newline="\n").write(body)

# blank the credentials in the tracked file, keeping the explanatory comments
cleaned = re.sub(
    r"const (DB_NAME|DB_USER|DB_PASS)\s*=\s*'[^']*';",
    lambda m: f"define('DB_{m.group(1).split('_')[1]}', defined('BFX_{m.group(1)}') ? BFX_{m.group(1)} : '');",
    src,
)
cleaned = re.sub(
    r"const SITE_ORIGIN\s*=\s*'([^']*)';",
    lambda m: "define('SITE_ORIGIN', defined('BFX_SITE_ORIGIN') ? BFX_SITE_ORIGIN : '"
    + m.group(1)
    + "');",
    cleaned,
)

io.open(TRACKED, "w", encoding="utf-8", newline="\n").write(cleaned)

print("Credentials moved to api/contact.local.php (gitignored).")
print("api/contact.php now reads them at runtime via BFX_* constants.")
print("Nothing printed or transmitted.")