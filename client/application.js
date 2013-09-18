// subscriptions, basic Meteor.startup code.

Meteor.startup(function() {
  return Hooks.init();
});

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});
