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


// Google Ads Script: Check for Broken Links in Ads and Sitelinks
function main() {
  const HTTP_TIMEOUT = 5000; // Timeout for HTTP requests in milliseconds
  const EMAIL_RECIPIENT = 'test@test.com'; // Replace with your email address

  const results = [];
  checkAdLinks(results, HTTP_TIMEOUT);
  checkSitelinkLinks(results, HTTP_TIMEOUT);

  if (results.length > 0) {
    sendEmail(EMAIL_RECIPIENT, results);
  } else {
    Logger.log('No broken links found.');
  }
}

function checkAdLinks(results, timeout) {
  const campaignsIterator = AdsApp.campaigns().withCondition("Status = ENABLED").get();

  while (campaignsIterator.hasNext()) {
    const campaign = campaignsIterator.next();
    const adsIterator = campaign.ads().withCondition('Status = ENABLED').get();

    while (adsIterator.hasNext()) {
      const ad = adsIterator.next();
      const urls = ad.urls();
      const finalUrl = urls ? urls.getFinalUrl() : null;

      if (finalUrl) {
        const httpStatus = checkUrl(finalUrl, timeout);
        if (httpStatus !== 200) {
          results.push({
            type: 'Ad',
            campaign: campaign.getName(),
            adGroup: ad.getAdGroup().getName(),
            text: ad.getHeadline() || ad.getDescription(),
            url: finalUrl,
            status: httpStatus
          });
        }
      }
    }
  }
}

function checkSitelinkLinks(results, timeout) {
  const campaignsIterator = AdsApp.campaigns().withCondition("Status = ENABLED").get();

  while (campaignsIterator.hasNext()) {
    const campaign = campaignsIterator.next();
    const extensionsIterator = campaign.extensions().sitelinks().get();

    while (extensionsIterator.hasNext()) {
      const sitelink = extensionsIterator.next();
      const urls = sitelink.urls();
      const finalUrl = urls ? urls.getFinalUrl() : null;

      if (finalUrl) {
        const httpStatus = checkUrl(finalUrl, timeout);
        if (httpStatus !== 200) {
          results.push({
            type: 'Sitelink',
            campaign: campaign.getName(),
            adGroup: '',
            text: sitelink.getLinkText(),
            url: finalUrl,
            status: httpStatus
          });
        }
      }
    }
  }
}

function checkUrl(url, timeout) {
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, timeout: timeout });
    return response.getResponseCode();
  } catch (e) {
    return 'Error';
  }
}

function sendEmail(recipient, results) {
  let emailBody = 'Broken Links Report:\n\n';
  results.forEach(result => {
    emailBody += `Type: ${result.type}\n`;
    emailBody += `Campaign: ${result.campaign}\n`;
    emailBody += `Ad Group: ${result.adGroup}\n`;
    emailBody += `Text: ${result.text}\n`;
    emailBody += `URL: ${result.url}\n`;
    emailBody += `HTTP Status: ${result.status}\n`;
    emailBody += '\n';
  });

  MailApp.sendEmail(recipient, 'Google Ads Broken Links Report', emailBody);
}
