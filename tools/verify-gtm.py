"""Verify the GTM container actually initialises on every page.

Not just "the snippet is in the source" -- that is what a text search proves.
This drives a real headless browser over CDP, waits for the container to
push its own gtm.js bootstrap event onto dataLayer, and reports what the
page ended up with.

Usage:  python tools/verify-gtm.py [base-url]
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
import webbrowser

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8811"
PORT = 9333
CONTAINER = "GTM-NSTRQKNK"
PAGES = ["index.html", "privacy-policy.html", "licenses.html", "404.html"]

# Locate a Chromium-family browser to drive.
CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]
BROWSER = next((p for p in CANDIDATES if os.path.exists(p)), None)
if not BROWSER:
    raise SystemExit("No Chromium-family browser found to drive.")


def start_browser():
    proc = subprocess.Popen(
        [
            BROWSER,
            f"--remote-debugging-port={PORT}",
            # current Chrome rejects the CDP websocket unless the origin is
            # explicitly allowed; without this the handshake 403s
            "--remote-allow-origins=*",
            "--headless=new",
            "--no-first-run",
            "--no-default-browser-check",
            "--user-data-dir=" + os.path.join(os.environ.get("TEMP", "."), "cdp-gtm"),
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(50):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=1):
                return proc
        except Exception:
            time.sleep(0.2)
    proc.kill()
    raise SystemExit("Browser did not expose a debugging port.")


def new_tab(ws_url_of_blank):
    """Reuse the about:blank target the browser already opened.

    /json/new needs a PUT in current Chrome and a GET in older builds, which
    is not worth branching on -- there is always a page target available.
    """
    return ws_url_of_blank


def main():
    proc = start_browser()
    try:
        import websocket  # noqa

        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list") as r:
            targets = json.load(r)

        pages = [t for t in targets if t.get("type") == "page" and t.get("webSocketDebuggerUrl")]
        if not pages:
            raise SystemExit("No page target to attach to.")
        ws_url = pages[0]["webSocketDebuggerUrl"]

        failures = []
        for page in PAGES:
            url = f"{BASE}/{page}"
            ws = websocket.create_connection(ws_url, timeout=30)
            mid = [0]

            def send(method, params=None):
                mid[0] += 1
                ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
                while True:
                    msg = json.loads(ws.recv())
                    if msg.get("id") == mid[0]:
                        return msg

            send("Page.enable")
            send("Runtime.enable")
            send("Page.navigate", {"url": url})
            time.sleep(6)  # container is async; give it room to boot

            expr = (
                "(function(){"
                "  var dl = window.dataLayer || [];"
                "  var gtm = window.google_tag_manager;"
                "  var cfg = null;"
                "  try { if (gtm) { var k = Object.keys(gtm)[0];"
                "        if (k) { var c = Object.keys(gtm[k])[0]; if (c) cfg = gtm[k][c].get('G-XXXX'); } } } catch (e) {}"
                "  return JSON.stringify({"
                "    dl: Array.isArray(window.dataLayer),"
                "    n: dl.length,"
                "    gtm: !!gtm,"
                "    ga4: cfg,"
                "    noscript: document.documentElement.innerHTML.indexOf('googletagmanager.com/ns.html') !== -1,"
                "    events: dl.map(function (e) { return e && e.event; }).filter(Boolean)"
                "  });"
                "})()"
            )
            res = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})

            detail = res.get("result", {})
            if "exceptionDetails" in detail:
                print(f"  {page:22} EVAL ERROR "
                      f"{detail['exceptionDetails'].get('text')} "
                      f"{detail['exceptionDetails'].get('exception', {}).get('description', '')[:120]}")
                failures.append(page)
                ws.close()
                continue

            raw = detail.get("result", {}).get("value")
            if not raw:
                print(f"  {page:22} no value returned "
                      f"({json.dumps(detail)[:140]})")
                failures.append(page)
                ws.close()
                continue

            data = json.loads(raw)

            has_boot = "gtm.js" in (data.get("events") or [])
            ok = data.get("dl") and data.get("gtm") and has_boot

            print(f"  {page:22} dataLayer={data.get('dl')} gtm={data.get('gtm')} "
                  f"events={len(data.get('events') or [])} boot={'gtm.js' if has_boot else 'MISSING'} "
                  f"noscript={data.get('noscript')}  {'OK' if ok else 'CHECK'}")

            if not ok:
                failures.append(page)
            ws.close()

        print()
        if failures:
            print("container did not initialise on: " + ", ".join(failures))
            sys.exit(1)
        print(f"All {len(PAGES)} pages initialised the {CONTAINER} container.")
    finally:
        proc.kill()


if __name__ == "__main__":
    main()