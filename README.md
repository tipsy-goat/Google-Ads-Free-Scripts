# Google Ads Free Scripts

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-free%20to%20use-blue)
![Google%20Ads](https://img.shields.io/badge/platform-Google%20Ads-orange)
![No%20Resale](https://img.shields.io/badge/resale-not%20allowed-red)
![Scam%20Warning](https://img.shields.io/badge/paid%20access-scam-red)

# Disclaimer & Usage Notice

This repository and all included scripts are **100% free to use**.

- Free for personal and commercial use  
- Free to modify and adapt  
- **Not allowed to resell or bundle as a paid product**  
- **If you paid for this code, you were scammed**

These scripts are published publicly on GitHub **by design**.  
No one is authorized to sell access to them.

All scripts are provided **“as is”**, without warranty of any kind.  
Always review, test, and validate in a safe environment before running in production or MCC accounts.

# Connect

If you find this useful, feel free to connect or reach out:

- **LinkedIn:** https://linkedin.com/in/mark-asimomytis  
- **Instagram:** https://instagram.com/mark_asimomytis  

Feedback, improvements, and pull requests are welcome.  
⭐ If this helped you, consider starring the repository.

# Why Is This Free?

These scripts were originally built for **personal use**.  
They solve small, recurring problems I encountered while working with Google Ads accounts, and they’re intentionally:

- **Simple to implement**
- **Easy to understand and modify**
- **Practical for real-world use**, not over-engineered tools

Publishing them publicly costs me nothing and helps:
- Brands avoid common pitfalls
- Agencies save time on repetitive checks
- Practitioners learn from real, production-used scripts

There’s no SaaS, no upsell, and no hidden catch — just utilities that might be useful to others facing the same problems.  
If they save you time or prevent a mistake, they’ve done their job.

---

# Getting Started (How to Install Google Ads Scripts)

Google Ads Scripts run directly inside Google Ads. You copy/paste the code, authorize it once, preview it, and then schedule it.

## Option A — Single Account Script Installation

1. Open **Google Ads** (the account you want to install the script in)
2. Go to **Tools & Settings → Bulk actions → Scripts**
3. Click **+** (New script)
4. Name the script (e.g. `Broken Link Checker`)
5. Paste the script code from this repository
6. Click **Authorize** and grant permissions
7. Click **Preview** first (recommended)
8. Click **Run** if preview looks good
9. Set a schedule:
   - From the script page, click **Create schedule**
   - Choose frequency (hourly/daily/weekly) depending on the script

## Option B — MCC (Manager Account) Script Installation

For MCC scripts (that iterate child accounts):

1. Open your **Manager Account (MCC)**
2. Go to **Tools & Settings → Bulk actions → Scripts**
3. Create a new script and paste the MCC script code
4. **Authorize** (the manager account authorization applies to its accessible accounts)
5. **Preview** to validate logic
6. **Run**
7. **Schedule** it (usually daily)

> Tip: Start with a limited scope (e.g. a label, a short account list, or a single CID) until you’re confident everything behaves as expected.

---

# Scripts Included
## 📁 Files
- [`mcc_0_impressions.js`](./mcc_0_impressions.js) — MCC alert for accounts with 0 impressions yesterday
- [`broken_link_checker.js`](./broken_link_checker.js) — Detect broken Final URLs in active ads
- [`change_history_changes_with_whitelist.js`](./change_history_changes_with_whitelist.js) — Alerts for non-whitelisted user changes


## 1) MCC — “0 Impressions Yesterday” Monitor (Daily Email)
**File:** [`mcc_0_impressions.js`](./mcc_0_impressions.js)

**What it does**  
Runs at **MCC level**. Checks **yesterday’s impressions** across managed accounts. If any accounts had **0 impressions**, it sends a simple email report listing them.

**Why it’s useful**
- Catch accidental pauses, budget caps, disapprovals, billing issues, tracking/account outages
- Great as a “smoke detector” for agencies managing many accounts

**Recommended schedule**
- **Daily**, early morning (account timezone), e.g. 08:00–10:00

**Output**
- Email report listing accounts with **0 impressions yesterday** (name + CID, depending on your script output)

---

## 2) Broken Link Checker — Active Ad Final URLs (Email Alerts)
**File:** [`broken_link_checker.js`](./broken_link_checker.js)

**What it does**  
Scans **active ads** and checks whether the **Final URL** is broken (e.g. 404/500/timeouts). If broken URLs are found, it sends an email alert.

**Why it’s useful**
- Clients with unstable websites, frequent deployments, or slow dev response
- Prevents spending to dead pages and catches issues before performance tanks

**Recommended schedule**
- **Daily** (or more often for high-spend accounts)

**Output**
- Email with broken URLs and where they appear (campaign/ad group/ad), depending on your implementation

---

## 3) Account Change Monitor — Non-Whitelisted User Alerts (Hourly)
**File:** [`change_history_changes_with_whitelist.js`](./change_history_changes_with_whitelist.js)

**What it does**  
Monitors account change history and sends an email when changes are made by users **not included in a whitelist**.

**Why it’s useful**
- “Too many cooks” accounts (multiple agencies, freelancers, internal teams)
- Dodgy clients / unauthorized edits
- Prevents silent damage to structure, budgets, bidding, tracking, or ads

**Recommended schedule**
- **Hourly**

**Output**
- Email summary including who made the change + what/when (as supported by change history)


---

# Common Configuration

Most scripts share a few configuration patterns:

- **EMAIL_RECIPIENTS**: comma-separated list of emails
- **WHITELIST**: allowed user emails (for the change monitor)
- **DRY_RUN / PREVIEW_MODE**: if included, enable while testing
- **LABEL_FILTERS / CAMPAIGN_FILTERS**: if included, use to reduce noise

---

# Testing Checklist (Recommended)

Before scheduling any script:

1. **Preview** first (don’t skip this)
2. Confirm the email recipient(s)
3. Confirm date range logic (especially “yesterday”)
4. Run in a low-risk account first
5. Verify alerts are not too noisy → add exclusions / filters
6. Only then enable scheduling

---

# Contributing

PRs are welcome, especially for:
- Better filtering options
- Cleaner email formatting
- Performance improvements (large accounts)
- Additional safeguards against false positives
