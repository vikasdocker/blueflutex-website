"""Check live URLs through a real browser, because InfinityFree answers
plain HTTP clients with an anti-bot JS challenge rather than the site.

Reports the final status code and page title for each path, which is how we
confirm the clean-slate deploy actually removed the previous generation.
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://blueflutex.gt.tc"
PORT = 9334

PATHS = [
    ("/", "expected 200"),
    ("/privacy-policy.html", "expected 200"),
    ("/licenses.html", "expected 200"),
    ("/nonexistent-page-check", "expected custom 404"),
    ("/admin.html", "expected 404 - must be gone"),
    ("/test-connection.html", "expected 404 - must be gone"),
    ("/script.js", "expected 404 - old static root must be gone"),
    ("/style.css", "expected 404 - old static root must be gone"),
    ("/api/contact.php", "expected 405 on GET"),
]

BROWSER = next(
    (p for p in [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ] if os.path.exists(p)),
    None,
)
if not BROWSER:
    raise SystemExit("No Chromium-family browser found.")


def main():
    proc = subprocess.Popen(
        [
            BROWSER,
            f"--remote-debugging-port={PORT}",
            "--remote-allow-origins=*",
            "--headless=new",
            "--no-first-run",
            "--user-data-dir=" + os.path.join(os.environ.get("TEMP", "."), "cdp-live"),
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=1)
                break
            except Exception:
                time.sleep(0.2)

        targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list"))
        page = next(t for t in targets if t.get("type") == "page")
        ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=40)
        mid = [0]

        def send(method, params=None):
            mid[0] += 1
            ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
            while True:
                m = json.loads(ws.recv())
                if m.get("id") == mid[0]:
                    return m

        send("Page.enable")
        send("Runtime.enable")

        print(f"{'path':28} {'status':>7}  {'note':32} title")
        print("-" * 96)
        for path, note in PATHS:
            send("Page.navigate", {"url": BASE + path})
            time.sleep(4)

            status = send("Runtime.evaluate", {
                "expression": "String(document.title)", "returnByValue": True
            })
            title = status.get("result", {}).get("result", {}).get("value", "")

            # pull the network status for the main document
            code = send("Runtime.evaluate", {
                "expression": "(performance.getEntriesByType('navigation')[0]||{}).responseStatus || 0",
                "returnByValue": True,
            })
            sc = code.get("result", {}).get("result", {}).get("value")

            print(f"{path:28} {str(sc):>7}  {note:32} {title[:26]}")
    finally:
        proc.kill()


if __name__ == "__main__":
    main()