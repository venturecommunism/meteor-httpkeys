Meteor.subscribe('remote_data')

Template.posts_list.posts = function () {
  return Posts.find({}, {sort: {name: 1}})
}

mainServer = DDP.connect("http://localhost") // change this to whatever remote server you want to bring data in from
LocalPosts = new Meteor.Collection("posts", mainServer)
mainServer.subscribe('remote_data')

Template.remote_posts_list.posts = function () {
  return LocalPosts.find({}, {sort: {name: 1}})
}

