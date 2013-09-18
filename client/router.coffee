Router.map ->
        @route "home", path: "/"
        @route "posts"
        @route "showPost",
                path: "/posts/:_id"
                data: -> post: Posts.findOne @params._id
        @route "dashboard",
                controller: "DashController"
                action: "customAction"
        @route "remoteboard",
                path: "/register"
                controller: "RemoteRegisterController"
                action: "someAction"
#        , ->
#                console.log "the form is: " + @params.form
#                console.log "the public key is: " + @params.publickey
#                console.log "the nonce is: " + @params.responsenonce
#                console.log "the callback is: " + @params.registrationcallback
        @route "user",
                path: "/i/:username"
                data: -> user: Meteor.users.findOne @params.username
        @route "showKey",
                path: "/users/:_id/keys"
                data: -> user: Meteor.users.findOne @this.params.username
