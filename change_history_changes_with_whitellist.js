// ## Disclaimer & Usage Notice

// This repository and all included scripts are **100% free to use**.

// - Free for personal and commercial use  
// - Free to modify and adapt  
// - **Not allowed to resell or bundle as a paid product**  
// - **If you paid for this code, you were scammed**

// These scripts are published publicly on GitHub **by design**.  
// No one is authorized to sell access to them.

// All scripts are provided **“as is”**, without warranty of any kind.  
// Always review, test, and validate in a safe environment before running in production or MCC accounts.

// ## Connect

// If you find this useful, feel free to connect or reach out:
// - **LinkedIn:** https://linkedin.com/in/mark-asimomytis 
// - **Instagram:** https://instagram.com/mark_asimomytis

// Feedback, improvements, and pull requests are welcome.
// ⭐ If this helped you, consider starring the repository.

  
// ## Why Is This Free?

// These scripts were originally built for **personal use**.
// They solve small, recurring problems I encountered while working with Google Ads accounts, and they’re intentionally:

// - **Simple to implement**
// - **Easy to understand and modify**
// - **Practical for real-world use**, not over-engineered tools

// Publishing them publicly costs me nothing and helps:
// - Brands avoid common pitfalls
// - Agencies save time on repetitive checks
// - Practitioners learn from real, production-used scripts

// There’s no SaaS, no upsell, and no hidden catch — just utilities that might be useful to others facing the same problems.
// If they save you time or prevent a mistake, they’ve done their job.



/***** CONFIG *****/
var ALERT_RECIPIENT_EMAIL = "your@email.com";

// Whitelisted user emails (case-insensitive).
// Add any trusted Google Ads user / admin emails here.
var TRUSTED_USERS = [
  "yourtrusted@email.com",
  "your.other.trusted@email.com"
];

// Email throttle
var MAX_EMAILS_PER_DAY = 5;

// Lookback window (script runs hourly, but checks last 2 hours), if you wish to run daily, set hours to 26.
var LOOKBACK_HOURS = 2;

/***** END CONFIG *****/



function main() {
  var accountName = AdsApp.currentAccount().getName();
  var customerId = AdsApp.currentAccount().getCustomerId(); // e.g. 123-456-7890
  var tz = AdsApp.currentAccount().getTimeZone();

  // Daily throttle reset + read
  var props = PropertiesService.getScriptProperties();
  var todayKey = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  var storedDay = props.getProperty("daily_counter_day");
  if (storedDay !== todayKey) {
    props.setProperty("daily_counter_day", todayKey);
    props.setProperty("daily_email_count", "0");
    // Optional: also prune remembered events more aggressively at day change
  }

  var emailCount = parseInt(props.getProperty("daily_email_count") || "0", 10);
  if (emailCount >= MAX_EMAILS_PER_DAY) {
    Logger.log("Daily email cap reached (" + emailCount + "/" + MAX_EMAILS_PER_DAY + "). Exiting.");
    return;
  }

  // Build whitelist set (lowercase)
  var whitelist = {};
  for (var i = 0; i < TRUSTED_USERS.length; i++) {
    whitelist[String(TRUSTED_USERS[i]).toLowerCase()] = true;
  }

  // Lookback start time in account timezone
  var now = new Date();
  var start = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);

var startStr = formatDateTimeForGaql(start, tz);
var endStr   = formatDateTimeForGaql(now, tz);

var query =
  "SELECT " +
    "change_event.resource_name, " +
    "change_event.change_date_time, " +
    "change_event.user_email, " +
    "change_event.campaign " +
  "FROM change_event " +
  "WHERE change_event.change_date_time BETWEEN '" + startStr + "' AND '" + endStr + "' " +
    "AND change_event.user_email IS NOT NULL " +
    "AND change_event.campaign IS NOT NULL " +
  "ORDER BY change_event.change_date_time DESC " +
  "LIMIT 8000";


  Logger.log("Query: " + query);

  // Load already-alerted events (to avoid duplicates from overlapping windows)
  var alerted = loadAlertedEvents_(props, tz);

  // Aggregate: user_email -> { campaigns: set, events: [] }
  var offenders = {}; // keyed by lowercased email
  var anyNewFindings = false;

  var rows = AdsApp.search(query);
  while (rows.hasNext()) {
    var row = rows.next();
    var eventResourceName = row.changeEvent.resourceName;
    var eventTime = row.changeEvent.changeDateTime; // string
    var userEmail = row.changeEvent.userEmail;
    var campaignResource = row.changeEvent.campaign; // resource name like customers/xxx/campaigns/yyy

    if (!userEmail) continue;

    var userKey = String(userEmail).toLowerCase();

    // Skip whitelisted users
    if (whitelist[userKey]) continue;

    // Skip events already emailed
    if (alerted.seen[eventResourceName]) continue;

    // Mark as seen (with timestamp for pruning)
    alerted.seen[eventResourceName] = true;
    alerted.items.push({
      rn: eventResourceName,
      t: safeToMillis_(eventTime, tz) // used for pruning window
    });

    anyNewFindings = true;

    if (!offenders[userKey]) {
      offenders[userKey] = {
        userEmail: userEmail,
        campaigns: {}, // map as set
        times: []      // list of change times (strings)
      };
    }

    // Store campaign resource name; later we’ll resolve to campaign names.
    offenders[userKey].campaigns[campaignResource] = true;
    offenders[userKey].times.push(eventTime);
  }

  // Persist alerted events (with pruning)
  saveAlertedEvents_(props, alerted, tz);

  if (!anyNewFindings) {
    Logger.log("No new non-whitelisted campaign changes found in the last " + LOOKBACK_HOURS + " hours.");
    return;
  }

  // Resolve campaign resource names -> campaign names for nicer emails
  // If resolution fails, we still include the resource names.
  var campaignNameMap = resolveCampaignNames_(offenders);

  // Compose 1 email per run
  var subject = accountName + " (" + customerId + ")";

  var bodyLines = [];
  bodyLines.push("Non-whitelisted changes detected.");
  bodyLines.push("");
  bodyLines.push("Account: " + accountName);
  bodyLines.push("Customer ID: " + customerId);
  bodyLines.push("Lookback: last " + LOOKBACK_HOURS + " hours");
  bodyLines.push("Run time: " + Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss") + " (" + tz + ")");
  bodyLines.push("");

  var offenderKeys = Object.keys(offenders);
  for (var k = 0; k < offenderKeys.length; k++) {
    var key = offenderKeys[k];
    var off = offenders[key];

    bodyLines.push("User: " + off.userEmail);

    // Unique campaigns
    var campaignResources = Object.keys(off.campaigns);
    if (campaignResources.length === 0) {
      bodyLines.push("  Campaigns: (none captured)");
    } else {
      bodyLines.push("  Campaigns changed:");
      for (var c = 0; c < campaignResources.length; c++) {
        var cr = campaignResources[c];
        var cname = campaignNameMap[cr];
        if (cname) {
          bodyLines.push("   - " + cname);
        } else {
          bodyLines.push("   - " + cr);
        }
      }
    }

    // Optional: include times (limited)
    var times = off.times.slice(0, 10);
    if (times.length) {
      bodyLines.push("  Change times (latest up to 10):");
      for (var t = 0; t < times.length; t++) {
        bodyLines.push("   - " + times[t]);
      }
    }

    bodyLines.push(""); // spacer
  }

  // Throttle check again right before sending
  emailCount = parseInt(props.getProperty("daily_email_count") || "0", 10);
  if (emailCount >= MAX_EMAILS_PER_DAY) {
    Logger.log("Daily email cap reached right before send. Exiting without sending.");
    return;
  }

  MailApp.sendEmail(ALERT_RECIPIENT_EMAIL, subject, bodyLines.join("\n"));

  props.setProperty("daily_email_count", String(emailCount + 1));
  Logger.log("Alert email sent to " + ALERT_RECIPIENT_EMAIL + ". Count now " + (emailCount + 1) + "/" + MAX_EMAILS_PER_DAY);
}

/**
 * Formats a JS Date into a GAQL-friendly datetime string in account timezone.
 * Commonly accepted format in Google Ads queries: "yyyy-MM-dd HH:mm:ss"
 */
function formatDateTimeForGaql(d, tz) {
  return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Attempts to convert a change_event.change_date_time string into epoch millis for pruning.
 * If parsing fails, returns "now" millis (conservative).
 */
function safeToMillis_(changeDateTimeStr, tz) {
  try {
    // If not parseable, fall back.
    var parsed = new Date(changeDateTimeStr);
    if (!isNaN(parsed.getTime())) return parsed.getTime();
  } catch (e) {}

  // fallback: use current time
  return new Date().getTime();
}

/**
 * Loads stored alerted events from Script Properties and prunes old ones.
 * We keep ~30 hours to safely cover overlaps + late runs.
 */
function loadAlertedEvents_(props, tz) {
  var raw = props.getProperty("alerted_events_json");
  var data = { items: [], seen: {} };

  if (raw) {
    try {
      data.items = JSON.parse(raw) || [];
    } catch (e) {
      data.items = [];
    }
  }

  // prune old
  var keepHours = 30;
  var cutoff = new Date().getTime() - keepHours * 60 * 60 * 1000;

  var pruned = [];
  for (var i = 0; i < data.items.length; i++) {
    var it = data.items[i];
    if (it && it.rn && it.t && it.t >= cutoff) {
      pruned.push(it);
      data.seen[it.rn] = true;
    }
  }
  data.items = pruned;

  return data;
}

function saveAlertedEvents_(props, alerted, tz) {
  // Keep payload bounded
  // If somehow huge, keep last 2000 entries
  if (alerted.items.length > 2000) {
    alerted.items = alerted.items.slice(alerted.items.length - 2000);
  }
  props.setProperty("alerted_events_json", JSON.stringify(alerted.items));
}

/**
 * Resolves campaign resource names to campaign names using a second GAQL query.
 */
function resolveCampaignNames_(offenders) {
  var resourcesSet = {};
  Object.keys(offenders).forEach(function(userKey) {
    Object.keys(offenders[userKey].campaigns).forEach(function(cr) {
      resourcesSet[cr] = true;
    });
  });

  var resources = Object.keys(resourcesSet);
  if (resources.length === 0) return {};

  var ids = [];
  for (var i = 0; i < resources.length; i++) {
    var parts = resources[i].split("/campaigns/");
    if (parts.length === 2) {
      ids.push(parts[1]);
    }
  }

  if (ids.length === 0) return {};

  // Chunk IN clauses to avoid overly long queries
  var map = {};
  var chunkSize = 500;
  for (var start = 0; start < ids.length; start += chunkSize) {
    var chunk = ids.slice(start, start + chunkSize);
    var q =
      "SELECT campaign.id, campaign.name " +
      "FROM campaign " +
      "WHERE campaign.id IN (" + chunk.join(",") + ")";

    var rows = AdsApp.search(q);
    while (rows.hasNext()) {
      var r = rows.next();
      var id = r.campaign.id;
      var name = r.campaign.name;

      // Rebuild resource name key format to match what change_event gave us
      // We don’t know exact customerId string format here, 
      //so map by ID first, then fill by scanning resources
      map[String(id)] = name;
    }
  }

  // Convert back to full resource name mapping
  var fullMap = {};
  for (var j = 0; j < resources.length; j++) {
    var res = resources[j];
    var p = res.split("/campaigns/");
    if (p.length === 2) {
      var cid = p[1];
      if (map[cid]) fullMap[res] = map[cid];
    }
  }

  return fullMap;
}

