Router.configure
        layout: "layout"
        notFoundTemplate: "notFound"
        loadingTemplate: "loading"

Subscriptions =
        posts: Meteor.subscribe "allPosts"
        users: Meteor.subscribe "Users"

class @PostsController extends RouteController

        template: "posts"

        # wait for the posts subscribtion to be ready.
        # In the meantime, the loading template will display
        waitOn: Subscriptions["posts"]

        data: ->
                posts: Posts.find()

class @UsersController extends RouteController

       template: "users"

       waitOn: Subscriptions["users"]
 
       data: ->
                users: Meteor.users.find()

class @DashController extends RouteController
        template: "dashboard"

        waitOn: Subscriptions["posts"]

        data: ->
                posts: Posts.find()

        customAction: ->

                @render "posts"
                @render
                        dashHeader:
                                to: "dashHeader"
                                waitOn: false
                                data: false

class @RemoteRegisterController extends RouteController
        template: "remoteboard"

        someAction: ->

                console.log "the form is: " + @params.form
                console.log "the public key is: " + @params.publickey
                console.log "the nonce is: " + @params.responsenonce
                console.log "the callback is: " + @params.registrationcallback
                callback = @params.registrationcallback

                @render
                        remoteRegister:
                                to: "remoteRegister"
                                waitOn: false
                                data: false

