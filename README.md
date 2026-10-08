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
  css/site.css           design system
  css/fonts.css          generated @font-face sheet
  js/site.js             DOM motion layer
  js/hero3d.js           WebGL hero (ES module)
  js/shaders.js          GLSL for the hero surface
  fonts/*.woff2          self-hosted typefaces
  img/*                  logo, favicons, OG card, case study

tools/                   asset pipeline (Python, run manually)
```

## Run locally

```powershell
python -m http.server 8811
# http://127.0.0.1:8811
```

A server is needed rather than opening `index.html` directly, because the hero
is an ES module and module scripts do not load over `file://`.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` pushes to InfinityFree over FTP.

Set one repository secret:

| Secret | Value |
| --- | --- |
| `FTP_PASSWORD` | password for the InfinityFree account |

Username is the account handle (`if0_41314745`) and the server is
`ftp.infinityfree.com`. Both are defaulted in the workflow, so
`FTP_SERVER` / `FTP_USERNAME` only need setting if that ever changes.

InfinityFree deletes anything uploaded outside `htdocs`, so the workflow stages
an explicit file list rather than uploading the repository root. It also fails
the build if any HTML/JS/PHP file would exceed the 1 MB limit or if `.htaccess`
would exceed 10 kB, because the host deletes those silently.

## Enabling the contact form

The form works without a database — it validates and reports success, and tells
the visitor to email instead. To actually store enquiries:

**1. Create the tables.** In the InfinityFree control panel, open phpMyAdmin for
your database and run:

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

**2. Add credentials** to the `CONFIG` block at the top of `api/contact.php`
(`DB_NAME`, `DB_USER`, `DB_PASS`). Values come from
*Control Panel → MySQL Databases*.

> Credentials live in a tracked file, which is not great. If you would rather
> not commit them, move the four constants into `api/config.local.php`,
> add that path to `.gitignore`, and `require` it from `contact.php`.

**3. Set `SITE_ORIGIN`** to the real domain once you have it — it is used for
the same-origin check on submissions.

## Before launch

- [ ] Replace the real domain in `index.html` (`<link rel="canonical">` and the
      `og:*` URLs) and in `api/contact.php` (`SITE_ORIGIN`)
- [ ] Add 2–3 real case studies — the `#work` section ships with one on purpose
      rather than filling the page with invented metrics
- [ ] Replace the placeholder social links in the contact section (they carry
      `data-todo-link` and render visibly inert)
- [ ] **Rotate the Supabase anon key** from the previous version of this site.
      It is no longer referenced anywhere, but it remains in git history and the
      old `increment_page_view` RPC was an unauthenticated write endpoint.
- [ ] Add `robots.txt` and `sitemap.xml` once the domain is final

## Regenerating assets

```powershell
python tools\fetch-fonts.py        # re-download the woff2 subsets + fonts.css
python tools\optimize-assets.py    # knock out the logo's white bg, rebuild favicons
python tools\prep-case-images.py   # downscale + webp the case-study screenshots
python tools\make-og-card.py       # rebuild assets/img/og-card.png
```

`optimize-assets.py` expects the original `logo_clean.png` and
`logo_nav_icon.png` at the repo root. They are the only binary sources; every
variant the site actually loads is derived from them.

## Design notes

**Palette.** Warm off-white ground (`#faf8f4`), ink type (`#14110f`), one deep
teal accent (`#0f5c56`). Structure is done with hairline rules rather than
shadows, which is what keeps it reading as print rather than as a dashboard.

**Type.** Instrument Serif for display only (18 px and up — below that its
quirks become friction). Inter for everything else, at zero letter-spacing
because it is optically sized for it, with 1.65 line-height. JetBrains Mono for
micro-labels. All OFL, all self-hosted: using Google's font API would transmit
every visitor's IP address to Google, which a German court ruled unlawful in
2022.

**The hero.** A subdivided plane displaced in the vertex shader, with the
fragment pass drawing anti-aliased iso-height contours. That is the logo's own
visual language — topographic line work — rendered in 3D. Lines are derived from
`fwidth()` of the height field, so they hold a constant pixel width instead of
aliasing into moiré at grazing angles.

Guards, all of which matter more than the effect itself:

- DPR capped at 2, dropped to 1.25 if the frame rate sits under 45 fps for 2.5 s
- delta-time driven, so motion is identical at 60 Hz and 120 Hz
- `IntersectionObserver` stops the render loop once the hero leaves the viewport
- `prefers-reduced-motion` renders exactly one static frame
- no WebGL, a failed CDN request, or a lost context falls back to a CSS gradient
- full `dispose()` on `pagehide`

**Deliberately absent.** No scroll hijacking, no custom cursor, no cookie
banner, no analytics, no framework.

### Why three.js comes from a CDN

InfinityFree deletes any JS file over 1 MB, and a local three.js bundle is
around 700 KB — one edit away from being silently removed from the server. The
import map in `index.html` is the install path the three.js manual documents
for exactly this case.

If you would rather have no third-party dependency at all, download
`three.module.js` into `assets/js/vendor/`, repoint the import map at it, and
delete the CDN disclosure from the privacy policy. It will be ~700 KB, which
fits under the 1 MB cap.

Keep the version and the CDN host in lockstep — mixing sources can pull in two
copies of the library.

## Accessibility

- Skip link, one `<main>` landmark, labelled form fields with `aria-describedby`
  error slots, `role="status"` live region on the submission result
- Full keyboard support, visible focus rings, `Escape` closes the drawer
- `prefers-reduced-motion` disables every animation and the 3D loop
- Decorative layers (canvas, aurora, ticker) are `aria-hidden`
- Placeholder links are `aria-disabled` and visibly dashed rather than silently
  broken

## Known gaps

- The `#work` section has one case study, not a portfolio. That is deliberate —
  see the checklist above.
- Social links are placeholders.
- No `robots.txt` / `sitemap.xml` until the domain is settled.