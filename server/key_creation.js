var keypair = Meteor.require('keypair')

Hooks.onCreateUser = function(userId) {
  var pair = keypair()
  username = Meteor.users.findOne({_id: userId}).username
  Meteor.users.update({_id: userId}, {$set: {'public_key': pair.public, 'private_key': pair.private}});
  Keys.insert({'public_key': pair.public, 'username': username});
}

Meteor.startup(function() {
  var options;
  if (Meteor.users.find().count() === 0) {
    options = {
      username: 'tomjoad',
      email: 'email@example.com',
      password: '2983u9f29f2j93jf2'
    };
    return Accounts.createUser(options);
  }
});
