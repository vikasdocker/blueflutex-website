"""Insert the Google Tag Manager snippets into every page.

Kept as a tool rather than four hand edits because the container ID has to
stay identical across the site, and there is no build step to enforce that.
Re-running is idempotent: it refuses to double-insert.

Also swaps the literal em dash in page titles for &mdash;, matching
index.html. That file is pure ASCII by design so an editor or shell that
mangles UTF-8 cannot corrupt it -- the other three get the same treatment.

Run:  python tools/install-gtm.py [--remove]
"""
import io
import os
import re
import sys

CONTAINER_ID = "GTM-NSTRQKNK"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "privacy-policy.html", "licenses.html", "404.html"]

# Kept byte-for-byte as Google publishes it, including the line breaks inside
# the function body. Reflowing it changes nothing functionally, but matching
# the vendor's snippet keeps future comparisons against their docs trivial.
HEAD_SNIPPET = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','{cid}');</script>
<!-- End Google Tag Manager -->"""

NOSCRIPT_SNIPPET = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={cid}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

# The anchor is identical in all four pages: the viewport meta, then a blank
# line. Anchoring on the meta rather than <head> keeps charset first.
ANCHOR = '<meta name="viewport" content="width=device-width, initial-scale=1" />'


# Every page is normalised to pure ASCII using HTML entities. A literal
# curly quote or middle dot in source is one shell round-trip away from
# becoming mojibake, and the fix for that is far harder to spot than the
# damage it prevents.
ASCII_FOLD = {
    "\u2014": "&mdash;",   # em dash
    "\u2013": "&ndash;",    # en dash
    "\u2019": "&rsquo;",   # right single quote
    "\u2018": "&lsquo;",   # left single quote
    "\u201c": "&ldquo;",   # left double quote
    "\u201d": "&rdquo;",   # right double quote
    "\u00b7": "&middot;", # middle dot
    "\u2190": "&larr;",    # left arrow
}


def fold_ascii(src: str) -> str:
    for char, entity in ASCII_FOLD.items():
        src = src.replace(char, entity)
    return src


def patch(path: str, remove: bool) -> str:
    full = os.path.join(ROOT, path)
    src = io.open(full, encoding="utf-8").read()
    original = src

    # normalise first: must happen even when the GTM step is a no-op
    src = fold_ascii(src)

    if remove:
        src = re.sub(
            r"[ \t]*<!-- Google Tag Manager[^>]*-->.*?<!-- End Google Tag Manager[^>]*-->\n?",
            "",
            src,
            flags=re.S,
        )
    elif "googletagmanager.com" not in src:
        head = HEAD_SNIPPET.format(cid=CONTAINER_ID)
        nose = NOSCRIPT_SNIPPET.format(cid=CONTAINER_ID)

        if ANCHOR not in src:
            raise SystemExit(f"{path}: anchor not found")

        src = src.replace(ANCHOR, f"{ANCHOR}\n{head}\n", 1)

        # noscript goes immediately after <body>
        src = re.sub(r"<body[^>]*>", lambda m: f"{m.group(0)}\n{nose}", src, count=1)
    else:
        print(f"  {path:22} GTM already present, left as-is")

    if src == original:
        return f"{path:22} unchanged"

    io.open(full, "w", encoding="utf-8", newline="\n").write(src)
    verb = "removed" if remove else "installed"
    return f"{path:22} {verb}"


def main() -> None:
    remove = "--remove" in sys.argv
    print(f"Google Tag Manager {'removal' if remove else 'install'} -- {CONTAINER_ID}\n")
    for page in PAGES:
        print("  " + patch(page, remove))
    print("\nContainer ID now present in: " + ", ".join(PAGES))


if __name__ == "__main__":
    main()