Template.signup.events = {
  'click input[type=submit]': function(e) {
    var width = 700;
    var height = 600;
    var public_key = Meteor.users.findOne({_id: 'xxxxxxxxxxxxxxxxxxxx'}).public_key // should be some user
    var callback = 'http://localhost/callback' // replace localhost with the server you want to point at
    var nonce = 'TODOthenonce'
    window.open('http://localhost/register?form=register&publickey=' + public_key + '&registrationcallback=' + callback + '&responsenonce=' + nonce, 'payswarm', // replace localhost with the server you want to point at
      'left=' + ((screen.width-width)/2) +
      ',top=' + ((screen.height-height)/2) +
      ',width=' + width +
      ',height=' + height +
      ',resizeable,scrollbars');

  }
}

Template.remoteRegister.callback = window.location

Template.remoteRegister.LoggedIn = function () {
  if (Meteor.user()) {
    return true;
  }
}

  Template.remoteRegister.events({

    'submit #login-form' : function(e, t){
      e.preventDefault();
      // retrieve the input field values
      var email = t.find('#login-email').value
        , password = t.find('#login-password').value;

        // Trim and validate your fields here.... 

        // If validation passes, supply the appropriate fields to the
        // Meteor.loginWithPassword() function.
        Meteor.loginWithPassword(email, password, function(err){
        if (err) {
          // The user might not have been found, or their passwword
          // could be incorrect. Inform the user that their
          // login attempt has failed.
        } 
        else {
          // The user has been logged in.
        }
      });
         return false; 
      }
  });
