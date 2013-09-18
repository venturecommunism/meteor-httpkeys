Template.servertest.events({
  'click input' : function () {
    // template data, if any, is available in 'this'
    servertest = Meteor.call('servertest')
    console.log(servertest)
  }
});

