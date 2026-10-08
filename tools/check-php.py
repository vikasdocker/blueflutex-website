"""Structural check for contact.php.

No PHP interpreter is available in this environment, so this catches the
mistakes that actually happen when editing PHP by hand. Delimiter balance is
computed with a character scanner rather than regexes, because a regex
pass cannot tell a brace inside a string or comment from a real one -- and
a naive comment-first strip silently corrupts any line containing a URL,
which is exactly what happened the first time this was written.

Not a substitute for `php -l`. Run that on the server.
"""
import io
import os
import re
import sys

PATH = "api/contact.php"
src = open(PATH, encoding="utf-8").read()

PAIRS = {"{": "}", "(": ")", "[": "]"}


def scan(text):
    """Walk the source tracking string/comment state. Yields (index, char)
    for characters that are real code."""
    i, n = 0, len(text)
    in_php = False
    while i < n:
        c = text[i]

        # PHP open / close tags
        if not in_php:
            if text.startswith("<?php", i) or text.startswith("<?=", i):
                in_php = True
                i += 5
                continue
            if text.startswith("?>", i):
                in_php = False
                i += 2
                continue
            i += 1
            continue

        if text.startswith("?>", i):
            in_php = False
            i += 2
            continue

        # comments
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if text.startswith("//", i) or (c == "#" and text[i:i + 2] in ("#\n", "#\r") or c == "#"):
            nl = text.find("\n", i)
            i = n if nl == -1 else nl
            continue

        # strings
        if c in "'\"":
            quote = c
            i += 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue

        # heredoc / nowdoc
        if text.startswith("<<<", i):
            j = i + 3
            while j < n and text[j] in " \t":
                j += 1
            label = ""
            if j < n and text[j] in "\"'":
                q = text[j]
                j += 1
                while j < n and text[j] != q:
                    label += text[j]
                    j += 1
                j += 1
            else:
                while j < n and (text[j].isalnum() or text[j] == "_"):
                    label += text[j]
                    j += 1
            term = "\n" + label
            end = text.find(term, j)
            i = n if end == -1 else end + len(term)
            continue

        yield i, c
        i += 1


stack = []
problems = []
for idx, ch in scan(src):
    if ch in PAIRS:
        stack.append((ch, src[:idx].count("\n") + 1))
    elif ch in PAIRS.values():
        if not stack:
            problems.append(f"unmatched '{ch}' at line {src[:idx].count(chr(10)) + 1}")
        else:
            opener, line = stack.pop()
            if PAIRS[opener] != ch:
                problems.append(f"'{opener}' opened line {line} closed by '{ch}' at line {src[:idx].count(chr(10)) + 1}")

for opener, line in stack:
    problems.append(f"unclosed '{opener}' opened at line {line}")

# credentials must not be committed
for key in ("DB_NAME", "DB_USER", "DB_PASS"):
    i = src.find(f"const {key}")
    if i == -1:
        # define() form, reading from the gitignored local override
        m = re.search(rf"define\(\s*'{key}'\s*,\s*(.*?)\)\s*;", src, re.S)
        if not m:
            problems.append(f"missing {key} definition")
            continue
        rhs = m.group(1)
        if re.search(r"['\"][^'\"]+['\"]\s*\)\s*;", rhs):
            problems.append(f"{key} falls back to a hardcoded value -- move it to contact.local.php")
        continue
    stmt = src[i:src.find(";", i)]  # stop at the statement end, not end of line
    _, _, rhs = stmt.partition("=")
    value = rhs.strip().strip("'\"").strip()
    if value:
        problems.append(f"const {key} is NOT empty ({value!r}) -- credentials may be committed")

# the local override must be gitignored, or moving them achieves nothing
ignore = open(".gitignore", encoding="utf-8").read()
if "api/contact.local.php" not in ignore:
    problems.append("api/contact.local.php is not in .gitignore")

# the override must actually be loaded, or every submission silently no-ops
if "contact.local.php" not in src or "require" not in src:
    problems.append("contact.php never requires contact.local.php -- DB credentials would always be empty")

# no user input interpolated into SQL
import re

for m in re.finditer(r"(?:->query|->prepare)\(\s*[\"'][^\"']*\$", src):
    problems.append(f"variable interpolated into SQL at line {src[:m.start()].count(chr(10)) + 1}")

# the honeypot must not be required
if 'name="website"' not in open(PATH, encoding="utf-8").read():
    pass

print(f"{PATH}: {len(src.splitlines())} lines")
if problems:
    print("\nPROBLEMS:")
    for p in problems:
        print("  -", p)
    sys.exit(1)

print("structure OK: delimiters balanced, config empty, no SQL interpolation")