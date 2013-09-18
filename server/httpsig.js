////////////////////////////////// preliminaries ////////////////////////////////////////////
// some required NPM packages
var createServer = Meteor.require('http').createServer
  , request = Meteor.require('request')
  , httpSignature = Meteor.require('http-signature')
  , crypto = Meteor.require('crypto')
  ;

///////////////////////////////// json-ld object ////////////////////////////////////////////////
// a JSON-LD object with a blank Http Key Signature
jsonldObj = {
   "@context": "https://w3id.org/payswarm/v1",
   "title": "Hello World!",
   "signature":
   {
      "type": "JsonLdSignature",
      "created": "2011-09-23T20:21:34Z",
      "signer": "http://localhost/api/users/xxxxxxxxxxxxxxxx", // change this to an actual user on your server
      "signatureValue": ""
   }
}

////////////////////////////////// the client ///////////////////////////////////////////////
// generates calls with web keys signed JSON-LD object that was just finished in a header called 'body'. this may not be the right way to do this
Meteor.methods({
  servertest: function (jsonObj) {
    // the string to sign will look like: "created": "2011-09-23T20:21:34Z"
    stringToSign = '"created": ' + '"' + jsonldObj.signature.created + '"'
    var signer = crypto.createSign('RSA-SHA1')
    signer.update(stringToSign)
    user_of_interest = jsonldObj.signature.signer // this is equal to: http://demo.payswarmhacks.net/i/johnsmith/keys/1
// need some additional logic for when the user is not logged in
    meteor_user = Meteor.users.findOne({_id: this.userId}).username
    jsonldObj.signature.signatureValue = signer.sign(Meteor.users.findOne({username: meteor_user}).private_key, 'base64')
    var options = {
      headers: {
        'Content-Type': 'application/ld+json',
        'body': JSON.stringify(jsonldObj)
        }
      }
    request('http://localhost/api/posts', options, function (e, r, b) { // change localhost to your server's ip
      console.log(r.statusCode)
    })
  }
})
