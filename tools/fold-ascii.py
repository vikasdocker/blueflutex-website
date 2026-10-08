"""Fold non-ASCII characters in source files down to ASCII escapes.

Applies to JS/CSS rather than HTML, because those have no entity mechanism.
In a JS string literal a curly quote survives; in a bash heredoc, a cp1252
console or a careless editor it does not, and the result is mojibake that
shows up as garbage in the UI. \\uXXXX escapes are byte-identical and immune
to that whole class of problem.

Run:  python tools/fold-ascii.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = ["assets/js/site.js", "assets/js/hero3d.js", "assets/css/site.css"]

# Only characters that appear inside user-visible strings or comments.
FOLD = {
    "\u2014": "\\u2014",  # em dash
    "\u2013": "\\u2013",  # en dash
    "\u2019": "\\u2019",  # right single quote
    "\u2018": "\\u2018",  # left single quote
    "\u201c": "\\u201c",  # left double quote
    "\u201d": "\\u201d",  # right double quote
    "\u2026": "\\u2026",  # ellipsis
    "\u00b7": "\\u00b7",  # middle dot
}


def fold(path: str) -> str:
    full = os.path.join(ROOT, path)
    src = io.open(full, encoding="utf-8").read()
    original = src

    for char, escape in FOLD.items():
        # negative lookbehind so an already-escaped char is left alone, and a
        # lambda replacement because re.sub would otherwise try to interpret
        # the \u in the replacement as its own escape
        src = re.sub(rf"(?<!\\){re.escape(char)}", lambda _m, e=escape: e, src)

    if src == original:
        return f"{path:24} already ASCII"

    io.open(full, "w", encoding="utf-8", newline="\n").write(src)
    n = sum(1 for a, b in zip(original, src) if a != b)
    return f"{path:24} folded {n} chars to escapes"


for t in TARGETS:
    print("  " + fold(t))