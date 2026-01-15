//change the following
var ALERT_RECIPIENT_EMAIL = "this@email.com";
//to
var ALERT_RECIPIENT_EMAILS = [
  "this@email.com",
  "second@email.com",
  "third@email.com"
];

//then change the following
MailApp.sendEmail(ALERT_RECIPIENT_EMAIL, subject, bodyLines.join("\n"));
//to
MailApp.sendEmail(
  ALERT_RECIPIENT_EMAILS.join(","),
  subject,
  bodyLines.join("\n")
);
