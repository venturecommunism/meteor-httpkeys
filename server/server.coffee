if Posts.find().count() == 0

        posts = [
                title: "Meteor Source Maps have arrived!"
                body: "You can now map to your CoffeScript source files from the browser."
        ,
                title: "Bootstrap 3 Goes Mobile First!"
                body: "With Bootstrap 3, mobile devices will load only necessary Styles and Content."

        ]

        timeStamp = (new Date()).getTime()

        _.each posts, (postData)->
                post = Posts.insert
                        title: postData.title
                        body: postData.body
                        submitted: timeStamp

                timeStamp +=1

Meteor.publish "allPosts", ->
        Posts.find {},
                sort:
                        submitted: -1

Meteor.publish "Users", ->
       Meteor.users.find {},
                sort:
                        submitted: -1
                fields:
                        username: 1
                        public_key: 1
                        

Meteor.startup ->
  collectionApi = new CollectionLD(apiPath: "api")
  collectionApi.addCollection Keys, "users",
    
    # open: true means do NOT check the Http Key before allowing the request
    open: true
    methods: ["GET"]

  collectionApi.addCollection Posts, "posts",
    
    # open: false should be: check the Http Key before allowing the request
    open: false
    methods: ["GET"]

  collectionApi.start()
        
