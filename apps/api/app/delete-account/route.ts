import { NextResponse } from "next/server";

const SUPPORT_EMAIL = "support@asianspices.online";
const PRIVACY_URL = "https://www.asianspices.online/privacy-policy";
const CONTACT_URL = "https://www.asianspices.online/contact-us";

export async function GET() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Delete Account | Asian Spices</title>
    <meta
      name="description"
      content="Request deletion of your Asian Spices Online account and associated personal data."
    />
    <style>
      :root {
        --ink: #1b0d07;
        --muted: #57534e;
        --line: #e7e5e4;
        --bg: #faf7f2;
        --card: #ffffff;
        --accent: #ea580c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(234, 88, 12, 0.08), transparent 40%),
          linear-gradient(180deg, #fff8f1 0%, var(--bg) 45%, #f5f0ea 100%);
        line-height: 1.6;
      }
      main {
        max-width: 720px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      .brand {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 12px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(1.8rem, 4vw, 2.4rem);
        line-height: 1.15;
      }
      .lead {
        margin: 0 0 28px;
        color: var(--muted);
        font-size: 1.05rem;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 18px;
      }
      h2 {
        margin: 0 0 12px;
        font-size: 1.15rem;
      }
      ol, ul { margin: 0; padding-left: 1.2rem; }
      li { margin-bottom: 8px; }
      a { color: var(--accent); }
      .cta {
        display: inline-block;
        margin-top: 8px;
        background: var(--accent);
        color: #fff !important;
        text-decoration: none;
        font-weight: 600;
        padding: 12px 18px;
        border-radius: 12px;
      }
      .note {
        font-size: 0.95rem;
        color: var(--muted);
      }
      footer {
        margin-top: 28px;
        font-size: 0.9rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">Asian Spices Online</div>
      <h1>Account Deletion</h1>
      <p class="lead">
        This page explains how to request deletion of your Asian Spices account
        and related personal data from our website and mobile app
        (Android package / iOS bundle ID: online.asianspices.app).
      </p>

      <section class="card">
        <h2>How to request account deletion</h2>
        <ol>
          <li>
            Send an email to
            <a href="mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request">${SUPPORT_EMAIL}</a>
            with the subject line <strong>Account Deletion Request</strong>.
          </li>
          <li>
            Include the email address registered to your Asian Spices account
            and, if available, your full name and phone number so we can verify ownership.
          </li>
          <li>
            You may also submit a request via our
            <a href="${CONTACT_URL}">Contact Us</a> form, stating that you want your account deleted.
          </li>
        </ol>
        <p>
          <a class="cta" href="mailto:${SUPPORT_EMAIL}?subject=Account%20Deletion%20Request">
            Email deletion request
          </a>
        </p>
      </section>

      <section class="card">
        <h2>What happens after you request deletion</h2>
        <ul>
          <li>We verify that the request comes from the account holder.</li>
          <li>We aim to process verified deletion requests within <strong>30 days</strong>.</li>
          <li>
            Your account login, profile details, saved addresses, wishlists, and app preferences
            are deleted or anonymized.
          </li>
          <li>
            Order, payment, invoice, and tax records that we must keep under Dutch / EU law
            may be retained in a restricted form for the legally required period, then deleted
            or anonymized.
          </li>
          <li>
            After deletion, you will no longer be able to sign in to the Asian Spices app or website
            with that account.
          </li>
        </ul>
      </section>

      <section class="card">
        <h2>Data that may be retained</h2>
        <p class="note">
          Some information may be retained where required for legal compliance, fraud prevention,
          dispute resolution, or accounting (for example completed orders and invoices).
          Retained data is limited to what is necessary and is not used for marketing.
        </p>
        <p class="note">
          Full details are described in our
          <a href="${PRIVACY_URL}">Privacy Policy</a>.
        </p>
      </section>

      <footer>
        Asian Spices Online B.V. · Slakkenveen 341, 3205 GK Spijkenisse · KvK 42041922<br />
        Privacy &amp; deletion requests:
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </footer>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
