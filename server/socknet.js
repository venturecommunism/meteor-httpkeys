Meteor.publish('remote_data', function () {
// Your auth code here, verifying "key", which is the connecting server's key
// Then return the appropriate collection data, just like normal. E.g.:
  return Posts.find({})
});
