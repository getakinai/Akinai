# Security Policy

Thank you for helping keep Akinai and the stores built on it safe. If you find a security vulnerability, please report it privately as described below. **Do not open a public issue, pull request or discussion about it.**

## Reporting a vulnerability

Report it through GitHub's **private vulnerability reporting** (the "Report a vulnerability" button on this repository's Security tab), or email **hello@jsdecena.me**, with:

- A description of the issue and the impact you believe it has.
- Steps to reproduce it, or a proof of concept (URLs, requests, screenshots).
- The account type involved, if any (guest, customer or staff), and the date and time you tested.
- How you would like to be credited, or whether you prefer to stay anonymous.

Please don't include real customer data in your report. If you came across any, tell us what you saw rather than sending it.

## Supported versions

Akinai is open-source software without versioned releases yet. We fix security issues in:

| Version | Supported |
|---|---|
| The `main` branch of this repository | Yes |
| https://getakinai.com | Yes |
| Older commits and forks | No |

If you run your own copy, keep it up to date with `main` to get security fixes.

## What to expect

| Step | Timeline |
|---|---|
| We acknowledge your report | Within 3 business days |
| We confirm whether it's a vulnerability and how severe it is | Within 10 business days |
| We fix critical and high severity issues | Within 30 days |
| We fix medium and low severity issues | Within 90 days |

We'll keep you updated as we work on it and tell you when the fix is live. If we decide it isn't a vulnerability, we'll explain why.

## Disclosure policy

We follow coordinated disclosure:

- Please give us time to fix the issue before you share details publicly. We ask for 90 days from your report, or until the fix is live, whichever comes first.
- If we need more time for a complex fix, we'll tell you why and agree on a new date with you.
- Once it's fixed, we're happy to credit you by name or handle in our release notes, unless you'd rather stay anonymous.

We don't run a paid bug bounty program at this time.

## Scope

**In scope**

- The code in this repository.
- https://getakinai.com and its subdomains.

Stores that other people run with this code are not ours to test. If you find an issue on one, report the underlying bug here, but test it against your own local copy.

Examples: getting into another customer's account or orders, reaching the back office without the right permissions, injection (SQL, script, template), CSRF on actions that change data, getting around payment or checkout rules, and exposure of secrets or personal data.

**Out of scope**

- Services we use but don't run, such as Stripe, POLi, Google and Microsoft sign-in, and email delivery. Please report those to the provider.
- Denial of service, load testing, or sending large volumes of traffic.
- Social engineering, phishing, or physical attacks on our staff or customers.
- Spam or brute-force attempts that our rate limits already stop, unless you've found a way around the limit.
- Reports from automated scanners with no proof that the issue can actually be used.
- Missing best-practice headers or settings with no demonstrated impact.
- Self-XSS, or issues that only affect your own account or need physical access to a victim's unlocked device.
- Reading product or price information that the store shows publicly to every visitor.

## Testing guidelines

Our safe harbor below applies if you:

- Only use accounts you created yourself, or that the owner has allowed you to use.
- Don't view, change or delete other people's data beyond the minimum needed to show the issue, and stop once you've shown it.
- Don't place real orders you won't pay for, and don't make payments with cards or accounts that aren't yours.
- Don't disrupt the site for other shoppers.

## Safe harbor

If you act in good faith and follow this policy, we won't take legal action against you and won't ask anyone else to. If someone else takes legal action over research done within this policy, we'll make it known that you were authorized.
