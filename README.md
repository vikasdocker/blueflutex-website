# BlueFluteX — website

Static marketing site for BlueFluteX. No build step, no framework, no
runtime dependencies.

```
index.html               the whole site
privacy-policy.html      what data we hold
licenses.html            third-party component licences
404.html
site.webmanifest
.htaccess                headers, HTTPS, caching, hardening
api/contact.php          contact form -> MySQL

assets/
  css/site.css           base layout and components
  css/theme.css          dark theme and responsive layouts
  css/flight.css         fixed stage, gallery controls and motion layouts
  css/fonts.css          generated @font-face sheet
  js/site.js             DOM motion layer
  js/scene.js            scroll/touch/keyboard controller, clock and overlays
  js/flight-math.js      camera path and perspective projection
  js/portrait-points.js  reference portrait coordinates and tonal weights
  js/flight-renderer.js  instanced WebGL image field and Canvas 2D fallback
  js/hero3d.js           retained earlier hero source (not loaded)
  js/shaders.js          retained earlier shaders (not loaded)
  fonts/*.woff2          self-hosted typefaces
  img/*                  logo, favicons, OG card, case study

tools/                   asset pipeline (Python, run manually)
```

## Run locally

```powershell
python -m http.server 8811
# http://127.0.0.1:8811
```

Use a local server so root-relative assets, navigation and the form action
resolve correctly. Contact delivery requires a PHP host; the static preview
can verify layout and client-side validation.

## Analytics

Google Tag Manager container **`GTM-NSTRQKNK`**, loading Google Analytics 4.

The snippet is inline in the head of all four pages, with the standard
`noscript` iframe after each `<body>`. There is no build step and no PHP
includes, so the container ID is duplicated in four files and nothing keeps
them in sync:

```
index.html  privacy-policy.html  licenses.html  404.html
```

To change it, use the tool rather than a find-and-replace — it refuses to
double-insert and keeps the encoding work in one place:

```powershell
python tools\install-gtm.py            # install or re-sync
python tools\install-gtm.py --remove   # strip it back out, cleanly
```

### Events pushed to the dataLayer

`assets/js/site.js` pushes three events. `dataLayer` is a plain array, so
these are harmless under an ad blocker, with JS off, or if GTM never loads.

| Event | Fired when | Notes |
| --- | --- | --- |
| `generate_lead` | contact form returns success | GA4 **recommended** event — mark it as a key event in GA4 and it needs no extra GTM config |
| `email_click` | any `a[href^="mailto:"]` | captures the contact route that skips the form |
| `outbound_click` | any off-site link | shows which visits become repo visits |

Each carries `link_url`, `link_domain` and `page_location`, so you can segment
in GA4 without defining custom dimensions.

`generate_lead` is a **client-side** signal. The honeypot is evaluated
server-side and still answers `ok`, so bot submissions can inflate it — cross-
check against the `contact_messages` table before quoting the numbers.

### What you must do in the GTM UI

Needs your login, so it is not scripted here:

1. **Variables** → create a GA4 Measurement ID (`G-XXXXXXXXXX`)
2. **Tags** → *Configuration*, type **Google Analytics: GA4 Configuration**, paste the ID
3. **Triggers** → **All Pages**
4. **Tags** → *Event* tags for `email_click` and `outbound_click` if you want
   them as separate GA4 events
5. In GA4: **Admin → Data display → Data retention** — confirm 14 months
6. In GA4: mark `generate_lead` as a **key event**

### Verifying it

```powershell
python -m http.server 8811
python tools\verify-gtm.py
```

Drives a real headless browser over the DevTools protocol and asserts, per
page, that `dataLayer` exists, `window.google_tag_manager` is defined, and the
container's own `gtm.js` bootstrap event is present.

### Removing tracking

`python tools\install-gtm.py --remove` plus deleting the `track()` block and
its call site in `site.js`. Nothing else on the site depends on it. You would
then want to trim the Analytics section from `privacy-policy.html` too.

---

## Deploy

Push to `main`. `.github/workflows/deploy.yml` pushes to InfinityFree over FTP.

Repository secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `FTP_PASSWORD` | **yes** | InfinityFree account password |
| `DB_NAME` / `DB_USER` / `DB_PASS` | no | database credentials; enables the contact form |
| `FTP_SERVER` | no | defaults to `ftp.infinityfree.com` |
| `FTP_USERNAME` | no | defaults to the account handle |

The workflow copies `api/` wholesale, so the gitignored
`api/contact.local.php` is uploaded to the server along with the code — that is
how the credentials reach it without ever entering git. In CI that file is
rebuilt from the `DB_*` secrets first. If the secrets are unset the run logs a
`::notice::` and the form falls back to directing visitors to email.

Set them with:

```powershell
gh secret set DB_NAME
gh secret set DB_USER
gh secret set DB_PASS
```

`dangerous-clean-slate: true` is enabled so files removed from the repo are
also removed from `htdocs`. That is what deleted the previous generation —
including `admin.html`, whose plaintext `localStorage` login was publicly
reachable and survived an earlier deploy because `sync-all` is not a valid
input for this action. **It deletes anything in `htdocs` that this workflow
does not ship**, so avoid putting files there by hand.

InfinityFree deletes anything uploaded outside `htdocs`, so the workflow stages
an explicit file list rather than uploading the repository root. It also fails
the build if any HTML/JS/PHP file would exceed the 1 MB limit or if `.htaccess`
would exceed 10 kB, because the host deletes those silently.

## Enabling the contact form

**This is already done on your machine.** The credentials live in
`api/contact.local.php`, which is gitignored — the tracked
`api/contact.php` contains no secrets.

`api/contact.php` requires that file if it exists. On a fresh clone it does
not, so the form falls back to telling visitors to email instead of storing
anything.

To make the form work on the server, run the deploy from a checkout where
`api/contact.local.php` exists — the workflow copies `api/` wholesale and
uploads it, and logs a `::warning::` when it does. That is how the password
reaches the server without ever entering git. On a clean CI clone the file
is absent and you will see a `::notice::` saying so.

What it still needs:

1. **Tables** — in the InfinityFree panel, open phpMyAdmin for your database
   and run:

```sql
CREATE TABLE contact_messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(200) NOT NULL,
  budget      VARCHAR(40)  NULL,
  message     TEXT         NOT NULL,
  ip_hash     CHAR(64)     NOT NULL,
  user_agent  VARCHAR(255) NULL,
  referer     VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX created_at (created_at),
  INDEX ip_hash_created (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_rate (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_hash    CHAR(64)     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ip_hash_created (ip_hash, created_at),
  INDEX created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

2. **`api/contact.local.php` on the server** — copy the file up over FTP. The
   database host is already set to `sql105.infinityfree.com` in `contact.php`;
   InfinityFree will not accept `localhost` for MySQL.

`python tools\check-php.py` will refuse to pass if a password ever reappears in
the tracked file, if the local override stops being gitignored, or if
`contact.php` stops requiring it.

## Before launch

- [x] Domain — `https://blueflutex.in` is set as canonical, `og:url` and
      `SITE_ORIGIN`
- [ ] Create the two tables in phpMyAdmin
- [ ] Add the `DB_NAME` / `DB_USER` / `DB_PASS` secrets, then push — the
      workflow rebuilds `api/contact.local.php` from them and uploads it
- [ ] Add 2–3 real case studies — the `#work` section ships with one on purpose
      rather than filling the page with invented metrics
- [ ] **Rotate the Supabase anon key** from the previous version of this site.
      It is no longer referenced anywhere, but it remains in git history and the
      old `increment_page_view` RPC was an unauthenticated write endpoint.
- [ ] Configure the GA4 tag in the GTM UI (see Analytics above)
- [ ] Add `robots.txt` and `sitemap.xml` for `blueflutex.in`

## Regenerating assets

```powershell
python tools\fetch-fonts.py          # re-download the woff2 subsets + fonts.css
python tools\optimize-assets.py      # knock out the logo's white bg, rebuild favicons
python tools\prep-case-images.py     # downscale + webp the case-study screenshots
python tools\make-og-card.py         # rebuild assets/img/og-card.png
python tools\install-gtm.py          # install / re-sync the Tag Manager snippet
python tools\install-gtm.py --remove # strip Tag Manager back out
python tools\fold-ascii.py           # force source files back to ASCII escapes
python tools\check-php.py            # structural sanity check on contact.php
python tools\verify-gtm.py           # drive a headless browser, assert GTM boots
```

Every source file is deliberately **pure ASCII**. HTML uses entities
(`&mdash;`, `&rsquo;`), and JS/CSS use `\uXXXX` escapes. A literal curly quote
in source is one cp1252 shell or careless editor away from becoming mojibake,
and the resulting damage is far harder to spot than the time spent preventing
it. Run `fold-ascii.py` after any bulk edit to put it back.

`check-php.py` is not a substitute for `php -l`, which needs a PHP install.
Run that on the server.

`optimize-assets.py` expects the original `logo_clean.png` and
`logo_nav_icon.png` at the repo root. They are the only binary sources; every
variant the site actually loads is derived from them.

## Design notes

The Night Studio theme uses a near-black ground (`#080909`), off-white type and a soft teal accent. Instrument Serif italic sets the oversized wordmark and display headings. All typefaces and visual assets remain self-hosted.

The homepage is a fixed scene. Scrolling moves an eased camera through a dense image field; it does not move a long page. The introduction fades away as the gallery opens. Main images enlarge, leave the camera to either side, and give way to the next view. A live caption, numbered counter and Back to home control follow the current view. Mouse movement adds perspective response and a fading white trail.

The opening follows the supplied recording: a small centered studio logo holds briefly, the header and large wordmark fade in, then scattered image tiles gather into the reference portrait. The oversized flute-shaped mosaic has been removed. The reveal starts at about 0.85 seconds, and the portrait resolves over about 1.05-3.95 seconds. Loading waits for visual assets, with bounded image requests and a startup failsafe. Reduced-motion preferences show the completed composition immediately.

The portrait coordinates and tonal weights are adapted from the supplied Vadim Carazan reference and attributed in the licence notices. Its tiles use BlueFluteX's own collection. The renderer uses one instanced WebGL 2 draw for 8,532 billboards on desktop and 4,266 on phones, with a Canvas 2D fallback when WebGL is unavailable or its context is lost. No graphics CDN or package dependency is required. Camera damping uses elapsed time so slow frames do not stretch transitions. The stage follows the visible viewport height, including compact preview windows.

The eight gallery views include the actual CleanBoost screenshot and original artwork for the studio's disciplines. The UI calls these views, not eight completed client projects. CleanBoost remains the single public case study.

Controls:

- Scroll, swipe, or use arrow keys to travel forward and backward.
- Page Up/Down and Space move farther; End reaches the final view.
- Back to home, Home, or Escape returns to the introduction.
- Pause/Resume stops ambient motion and makes navigation immediate.
- Reduced-motion preferences use static, immediate transitions.

Selected Work, Services, Process, Studio and Contact use one native modal dialog. The actual section content moves into it and returns on close, preserving unique IDs, case-study tab state and contact form state. Panels retain their own scroll region, focus containment, Escape handling and links to legal pages. Without JavaScript, the original sections remain available as normal page content. Unsupported dialogs fall back to page navigation.

The renderer caps device pixel ratio at 1.5, suspends frames in hidden documents and open dialogs, stops rendering settled gallery views, and cleans up resources on page exit. The Pune clock always uses `Asia/Kolkata`.

Deployment stays on the existing InfinityFree workflow. Merge the reviewed commit to `main` to deploy. No new packages, database migrations or secrets are required.

## Accessibility

- Skip link, one `<main>` landmark, labelled form fields with `aria-describedby`
  error slots, `role="status"` live region on the submission result
- Full keyboard support, visible focus rings, `Escape` closes the drawer
- `prefers-reduced-motion` disables animations and pauses the canvas
- Decorative layers (canvas, background artwork, ticker copies) are `aria-hidden`
- Native modal overlays contain focus, close with `Escape`, and restore content

## Known gaps

- The `#work` section has one case study, not a portfolio. That is deliberate —
  see the checklist above.
- The verified GitHub profile is linked; no unverified social profiles are shown.
- No `robots.txt` / `sitemap.xml` until the domain is settled.
