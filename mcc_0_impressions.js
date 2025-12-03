function main() {
  var accounts = [];
  var LabelName = 'Label1'; // The label name to filter accounts

  // Calculate yesterday
  var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
  var now = new Date();
  var yesterday = new Date(now.getTime() - MILLIS_PER_DAY);

  // You can add multiple emails, separated by commas.
  var mail = 'test@test.gr';

  var accountIterator = MccApp.accounts().withLimit(100).get();
  var mccAccount = AdWordsApp.currentAccount();

  while (accountIterator.hasNext()) {
    var account = accountIterator.next();

    // Check if the account has the specified label
    if (account.labels().withCondition("Name = '" + LabelName + "'").get().hasNext()) {
      MccApp.select(account);
      var impressions = account.getStatsFor('YESTERDAY').getImpressions();
      if (impressions == 0) {
        accounts.push(account.getName());
        accounts.push('   (ID ', account.getCustomerId(), ') \n ');
      }
    }
  }

  var acts = accounts.join(''); // Joins the array and removes the comma (,) delimiter

  if (accounts.length > 0) {
    MailApp.sendEmail(mail, 'Accounts with no impressions on ' + yesterday, 'Please check the following accounts, they are not recording Impressions. \n' + acts);
  }
}
