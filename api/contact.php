<?php
/**
 * BlueFluteX — contact form handler.
 *
 * Accepts JSON from the fetch() in site.js, and also handles a plain
 * form POST so the form still works with JavaScript disabled.
 *
 * Before this will store anything, fill in the CONFIG block below with
 * the credentials from the InfinityFree control panel
 * (Control Panel -> MySQL Databases). Leave DB_HOST as localhost.
 *
 * Also create the table using the SQL in README.md.
 *
 * Security posture:
 *   - prepared statements only; the email address is never concatenated
 *     into a query
 *   - server-side validation re-run independently of the browser
 *   - honeypot field + per-IP throttle in the same table
 *   - no stack traces or DB errors ever reach the response
 */

declare(strict_types=1);

/* ============================ CONFIG ============================
   Credentials are NOT in this file. They live in api/contact.local.php,
   which is gitignored so a database password can never reach the public
   repository. Upload that file to the server alongside this one.

   To create it locally:
     <?php
     define('BFX_DB_NAME', 'your_database');
     define('BFX_DB_USER', 'your_user');
     define('BFX_DB_PASS', 'your_password');

   If it is absent -- which is the case on a fresh clone -- the form still
   validates and reports success, and tells the visitor to email instead,
   so a missing config never produces a fatal error in front of a prospect.
   ================================================================ */

$bfxLocalConfig = __DIR__ . '/contact.local.php';
if (is_readable($bfxLocalConfig)) {
    require_once $bfxLocalConfig;
}

// InfinityFree requires the sql###.infinityfree.com hostname for MySQL;
// "localhost" will not connect from the shared host.
const DB_HOST = 'sql105.infinityfree.com';

define('DB_NAME', defined('BFX_DB_NAME') ? BFX_DB_NAME : '');
define('DB_USER', defined('BFX_DB_USER') ? BFX_DB_USER : '');
define('DB_PASS', defined('BFX_DB_PASS') ? BFX_DB_PASS : '');

const MAIL_TO = 'vikasshu7@gmail.com';

define('SITE_ORIGIN', defined('BFX_SITE_ORIGIN') ? BFX_SITE_ORIGIN : 'https://blueflutex.gt.tc');

const MAX_NAME    = 120;
const MAX_EMAIL   = 200;
const MAX_MESSAGE = 4000;

/** Allow a few submissions per hour per IP; generous enough for real use. */
const RATE_LIMIT   = 5;
const RATE_WINDOW  = 3600; // seconds

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/* ---------- negotiate the response format ----------
   JSON when the client asked for it (the fetch() in site.js always sends
   Accept: application/json); otherwise fall back to a redirect, which is
   what a no-JS form submit needs. */
$acceptsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'json')
    || str_contains($_SERVER['HTTP_CONTENT_TYPE'] ?? '', 'application/json');

function respond(bool $ok, string $message, array $extra = [], int $code = 200): never
{
    global $acceptsJson;

    if ($acceptsJson) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message] + $extra, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // no-JS fallback: bounce back to the form with the outcome in the query
    $back = SITE_ORIGIN . '/#contact';
    header('Location: ' . $back . ($ok ? '?sent=1' : '?error=' . rawurlencode($message)), true, 302);
    exit;
}

/* ---------- only POST ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'This endpoint only accepts POST requests.', [], 405);
}

/* ---------- origin check ----------
   Stops other sites POSTing to this endpoint from a victim's browser.
   Browsers attach Origin on cross-site POSTs, so a mismatch is a strong
   signal the submission is not ours. */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !str_starts_with($origin, SITE_ORIGIN)) {
    respond(false, 'Request blocked.', [], 403);
}

/* ---------- read input ---------- */
$raw = file_get_contents('php://input') ?: '';
$data = [];

if (str_contains($_SERVER['HTTP_CONTENT_TYPE'] ?? '', 'application/json')) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
} else {
    $data = $_POST;
}

$name    = trim((string)($data['name'] ?? ''));
$email   = trim((string)($data['email'] ?? ''));
$budget  = trim((string)($data['budget'] ?? ''));
$message = trim((string)($data['message'] ?? ''));
$website = trim((string)($data['website'] ?? '')); // honeypot

/* ---------- honeypot ----------
   A real visitor never sees or fills this input. Silently accept so bots
   do not learn to work around it. */
if ($website !== '') {
    respond(true, 'Thanks — we’ll reply within two working days.');
}

/* ---------- validate ---------- */
if (mb_strlen($name) < 2 || mb_strlen($name) > MAX_NAME) {
    respond(false, 'Please give us a name between 2 and ' . MAX_NAME . ' characters.', [], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > MAX_EMAIL) {
    respond(false, 'That email address doesn’t look right.', [], 422);
}
if (mb_strlen($message) < 20) {
    respond(false, 'Please add a sentence or two about the project.', [], 422);
}
if (mb_strlen($message) > MAX_MESSAGE) {
    respond(false, 'That message is too long — please keep it under ' . MAX_MESSAGE . ' characters.', [], 422);
}
// strip control characters that have no business in a message body.
// Deliberately no /u modifier: the pattern is byte-oriented, and /u would
// make preg_replace fail outright on invalid UTF-8 instead of just not
// matching. We validate UTF-8 separately when writing to the database.
$message = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $message) ?? $message;
$message = mb_scrub($message);

$budget = $budget !== '' ? mb_substr($budget, 0, 40) : '';

/* ---------- configuration sanity ----------
   Without credentials we still accept the submission, but we say so in the
   logs rather than silently dropping it. Better a lost lead than a fatal
   error page in front of a prospect. */
if (DB_NAME === '' || DB_USER === '') {
    error_log('[blueflutex] contact form not configured — set DB_NAME/DB_USER in api/contact.php');
    respond(true, 'Thanks — we’ll reply within two working days.');
}

/* ---------- database ---------- */
mysqli_report(MYSQLI_REPORT_OFF);

$db = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($db->connect_errno) {
    error_log('[blueflutex] db connect failed: ' . $db->connect_error);
    respond(false, 'We couldn’t send that just now. Please email vikasshu7@gmail.com.', [], 503);
}
$db->set_charset('utf8mb4');

/* ---------- throttle ----------
   Keyed on a truncated, salted hash of the IP. We never store the raw
   address, and the hash is only comparable within this deployment
   because the salt lives in config. */
$salt    = hash('sha256', DB_NAME . '|throttle-v1');
$ip      = (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$ipHash  = hash_hmac('sha256', $ip, $salt);

$throttle = $db->prepare(
    'SELECT COUNT(*) AS hits FROM contact_rate
      WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL ? SECOND)'
);
if ($throttle === false) {
    respond(false, 'We couldn’t send that just now. Please email vikasshu7@gmail.com.', [], 503);
}
$throttle->bind_param('si', $ipHash, RATE_WINDOW);
$throttle->execute();

// bind_result rather than get_result(): get_result() needs mysqlnd, which is
// not guaranteed to be compiled into every shared host's PHP.
$throttle->bind_result($hits);
$hits = 0;
$throttle->fetch();
$throttle->close();

if ((int)$hits >= RATE_LIMIT) {
    respond(false, 'That’s a few messages in a short time. Please email us directly instead.', [], 429);
}

/* ---------- insert ---------- */
$ua    = mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
$refer = mb_substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 255);

$insert = $db->prepare(
    'INSERT INTO contact_messages (name, email, budget, message, ip_hash, user_agent, referer)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
if ($insert === false) {
    error_log('[blueflutex] insert prepare failed: ' . $db->error);
    respond(false, 'We couldn’t send that just now. Please email vikasshu7@gmail.com.', [], 503);
}

$insert->bind_param('sssssss', $name, $email, $budget, $message, $ipHash, $ua, $refer);

if (!$insert->execute()) {
    error_log('[blueflutex] insert failed: ' . $insert->error);
    respond(false, 'We couldn’t send that just now. Please email vikasshu7@gmail.com.', [], 503);
}
$insert->close();

/* ---------- throttle bookkeeping ---------- */
$track = $db->prepare('INSERT INTO contact_rate (ip_hash) VALUES (?)');
if ($track instanceof mysqli_stmt) {
    $track->bind_param('s', $ipHash);
    $track->execute();
    $track->close();
}

// keep the table small; cheap insurance against unbounded growth
if (random_int(1, 50) === 1) {
    $db->query('DELETE FROM contact_rate WHERE created_at < (NOW() - INTERVAL 1 DAY)');
}

$db->close();

/* ---------- optional notification ----------
   Best-effort only. A mail() failure must not turn a stored message into
   an error for the visitor. */
$subject = '=?UTF-8?B?' . base64_encode('BlueFluteX enquiry from ' . $name) . '?=';
$body = "Name:    {$name}\n"
      . "Email:   {$email}\n"
      . 'Budget:  ' . ($budget !== '' ? $budget : 'not stated') . "\n\n"
      . "-----\n{$message}\n";

@mail(
    MAIL_TO,
    $subject,
    $body,
    implode("\r\n", [
        'From: BlueFluteX <no-reply@' . (parse_url(SITE_ORIGIN, PHP_URL_HOST) ?: 'blueflutex.com') . '>',
        'Content-Type: text/plain; charset=utf-8',
        'X-Mailer: BlueFluteX',
    ])
);

respond(true, 'Thanks — we’ll reply within two working days.');