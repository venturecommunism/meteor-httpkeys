crypto = Meteor.require('crypto')

function httpKeyAuthenticate(obj) {
  console.log('obj.signature is ' + obj.signature)
  var httpKeyparsed = obj.signature
  console.log(httpKeyparsed)
  keyURI = URI(httpKeyparsed.signer).segment(3, "")
  keyURI = keyURI.hostname() + keyURI.path() 
  console.log('well we have this keyURI: ' + keyURI)
  var keyPageContent = HTTP.get('http://' + keyURI).content
console.log('keyPageContent is ' + keyPageContent)
  var httpKeyPublicKey = JSON.parse(keyPageContent)[0].public_key
console.log('the key is ' + httpKeyPublicKey)
  var verify = crypto.createVerify('RSA-SHA1')
  verify.update('"created": ' + '"' + httpKeyparsed.created + '"')
console.log("signatureValue is " + httpKeyparsed.signatureValue)
  var verifiedHttpKey = verify.verify(httpKeyPublicKey, httpKeyparsed.signatureValue, 'base64')
  return verifiedHttpKey
}

CollectionLD = function(options) {
  var self = this;

  self.version = '0.1.15';
  self._url = Npm.require('url');
  self._querystring = Npm.require('querystring');
  self._fiber = Npm.require('fibers');
  self._collections = {};
  self.options = {
    apiPath: 'collection',
    standAlone: false,
    sslEnabled: false,
    listenPort: 3005,
    listenHost: undefined,
    authToken: undefined,
    privateKeyFile: 'privatekey.pem',
    certificateFile: 'certificate.pem'
  };
  _.extend(self.options, options || {});
};

CollectionLD.prototype.addCollection = function(collection, path, options) {
  var self = this;

  var collectionOptions = {};
  collectionOptions[path] = {
    collection: collection,
    options: options || {}
  };
  _.extend(self._collections, collectionOptions);
};

// Starts the server
CollectionLD.prototype.start = function() {
  var self = this;
  var httpServer, httpOptions, scheme;

  var startupMessage = 'Collection JSON-LD API v' + self.version;

  if (self.options.standAlone === true) {
    if (self.options.sslEnabled === true) {
      scheme = 'https://';
      httpServer = Npm.require('https');
      var fs = Npm.require('fs');

      httpOptions = {
        key: fs.readFileSync(self.options.privateKeyFile),
        cert: fs.readFileSync(self.options.certificateFile)
      };
    } else {
      scheme = 'http://';
      httpServer = Npm.require('http');
    }

    self._httpServer = httpServer.createServer(httpOptions);
    self._httpServer.addListener('request', function(request, response) { new CollectionLD._requestListener(self, request, response); });
    self._httpServer.listen(self.options.listenPort, self.options.listenHost);
    console.log(startupMessage + ' running as a stand-alone server on ' +  scheme + (self.options.listenHost || 'localhost') + ':' + self.options.listenPort + '/' + (self.options.apiPath || ''));
  } else {

    RoutePolicy.declare('/' + this.options.apiPath + '/', 'network');

    WebApp.connectHandlers.use(function(req, res, next) {
      if (req.url.split('/')[1] !== self.options.apiPath) {
        next();
        return;
      }
      self._fiber(function () {
        new CollectionLD._requestListener(self, req, res);
      }).run();
    });

    console.log(startupMessage + ' running at /' + this.options.apiPath);
  }
};

// associates options with a particular requestpath / collectionpath (?)
CollectionLD.prototype._collectionOptions = function(requestPath) {
  var self = this;
  return self._collections[requestPath.collectionPath] ? self._collections[requestPath.collectionPath].options : undefined;
};

// takes in the headers and body
CollectionLD._requestListener = function (server, request, response) {
  var self = this;

  self._server = server;
  self._request = request;
  self._response = response;

  self._requestUrl = self._server._url.parse(self._request.url);

  // Check for the X-Auth-Token header or auth-token in the query string
  self._requestAuthToken = self._request.headers['x-auth-token'] ? self._request.headers['x-auth-token'] : self._server._querystring.parse(self._requestUrl.query)['auth-token'];
// console.log(JSON.parse(self._request.headers['body']).signature.signatureValue) // this one's broken anyway

  var requestPath;
  if (self._server.options.standAlone === true && ! self._server.options.apiPath) {
    requestPath = self._requestUrl.pathname.split('/').slice(1,3);
  } else {
    requestPath = self._requestUrl.pathname.split('/').slice(2,4);
  }

  self._requestPath = {
    collectionPath: requestPath[0],
    collectionId: requestPath[1]
  };

// called by all the methods for record manipulation
  self._requestCollection = self._server._collections[self._requestPath.collectionPath] ? self._server._collections[self._requestPath.collectionPath].collection : undefined;

  if (!self._authenticate()) {
    return self._unauthorizedResponse('Invalid/Missing Auth Token');
  }

  if (!self._httpKeysAuth()) {
    return self._badRequestResponse('Bad syntax or wrong encoding - is it a JSON-LD Http Keys spec?');
  }

  if (!self._requestCollection) {
    return self._notFoundResponse('Collection Object Not Found');
  }

  return self._handleRequest();
};

CollectionLD._requestListener.prototype._authenticate = function() {
  var self = this;
  var collectionOptions = self._server._collectionOptions(self._requestPath);

  // Check to see if the collection is open
  if (collectionOptions && collectionOptions.open) {
    return true;
  }

  // Check the collection's auth token
  if (collectionOptions && collectionOptions.authToken) {
    return self._requestAuthToken === collectionOptions.authToken;
  }

  // Check the global auth token
  if (self._server.options.authToken) {
    return self._requestAuthToken === self._server.options.authToken;
  }

  return true;
};

// checks to see if you're authenticated via Http Keys
CollectionLD._requestListener.prototype._httpKeysAuth = function() {
  var self = this
  if (self._request.headers.body == undefined) {
  return true
  } else {
  return httpKeyAuthenticate(JSON.parse(self._request.headers.body))
  }
};

// decides the return value of _requestListener. 
// first it sees if the _request.method of the particular request is _requestMethodAllowed
// then it directs to _getRequest, _postRequest, etc. if it is
CollectionLD._requestListener.prototype._handleRequest = function() {
  var self = this;

  if (!self._requestMethodAllowed(self._request.method)) {
    return self._notSupportedResponse();
  }

  switch (self._request.method) {
    case 'GET':
      return self._getRequest();
    case 'POST':
      return self._postRequest();
    case 'PUT':
      return self._putRequest();
    case 'DELETE':
      return self._deleteRequest();
    default:
      return self._notSupportedResponse();
  }
};

// this one should be changed to deal with hydra and the json-ld body (maybe)
CollectionLD._requestListener.prototype._requestMethodAllowed = function (method) {
  var self = this;
  var collectionOptions = self._server._collectionOptions(self._requestPath);

  if (collectionOptions && collectionOptions.methods) {
    return _.indexOf(collectionOptions.methods, method) >= 0;
  }

  return true;
};

// best to leave the _beforeHandling to specific implementations
CollectionLD._requestListener.prototype._beforeHandling = function (method) {
  var self = this;
  var collectionOptions = self._server._collectionOptions(self._requestPath);
  
  if (collectionOptions && collectionOptions.before && collectionOptions.before[method] &&  _.isFunction(collectionOptions.before[method])) {
    return collectionOptions.before[method].apply(self, _.rest(arguments));
  }
  
  return true;
}

// GET request
// lets document it fully shall we?
// JSON.stringify is nice
CollectionLD._requestListener.prototype._getRequest = function(fromPutRequest) {
  var self = this;

  self._server._fiber(function() {

    try {
      // TODO: A better way to do this?
      var collection_result = self._requestPath.collectionId !== undefined ? self._requestCollection.find(self._requestPath.collectionId) : self._requestCollection.find();

      var records = [];
      collection_result.forEach(function(record) {
// push - Mutates an array by appending the given elements and returning the new length of the array.
        records.push(record);
      });
      
      if(!self._beforeHandling('GET',  self._requestPath.collectionId, records)) {
        if (fromPutRequest) {
          return records.length ? self._noContentResponse() : self._notFoundResponse('No Record(s) Found');
        }
        return self._rejectedResponse("Could not get that collection/object.");
      }
      
// _.compact Returns a copy of the array with all falsy values removed. In JavaScript, false, null, 0, "", undefined and NaN are all falsy. 
      records = _.compact(records);

      if (records.length === 0) {
        return self._notFoundResponse('No Record(s) Found');
      }

      return self._okResponse(JSON.stringify(records, undefined, 2));

    } catch (e) {
      return self._internalServerErrorResponse(e);
    }

  }).run();

};

// PUT request
CollectionLD._requestListener.prototype._putRequest = function() {
  var self = this;

  if (! self._requestPath.collectionId) {
    return self._notFoundResponse('Missing _id');
  }

  var requestData = '';

  self._request.on('data', function(chunk) {
    requestData += chunk.toString();
  });

  self._request.on('end', function() {
    self._server._fiber(function() {
      try {
        var obj = JSON.parse(requestData);
        
        if(!self._beforeHandling('PUT', self._requestPath.collectionId, self._requestCollection.findOne(self._requestPath.collectionId), obj)) {
          return self._rejectedResponse("Could not put that object.");
        }
        self._requestCollection.update(self._requestPath.collectionId, obj);
      } catch (e) {
        return self._internalServerErrorResponse(e);
      }
      return self._getRequest('fromPutRequest');
    }).run();
  });

};

// DELETE request
CollectionLD._requestListener.prototype._deleteRequest = function() {
  var self = this;

  if (! self._requestPath.collectionId) {
    return self._notFoundResponse('Missing _id');
  }

  self._server._fiber(function() {
    try {      
      if(!self._beforeHandling('DELETE', self._requestPath.collectionId, self._requestCollection.findOne(self._requestPath.collectionId))) {
        return self._rejectedResponse("Could not delete that object.");
      }
      self._requestCollection.remove(self._requestPath.collectionId);
    } catch (e) {
      return self._internalServerErrorResponse(e);
    }
    return self._okResponse('');
  }).run();
};

// POST request
CollectionLD._requestListener.prototype._postRequest = function() {
  var self = this;
  var requestData = '';

  self._request.on('data', function(chunk) {
    requestData += chunk.toString();
  });

  self._request.on('end', function() {
    self._server._fiber(function() {
      try {
        var obj = JSON.parse(requestData);
        
        if(!self._beforeHandling('POST', obj)) {
          return self._rejectedResponse("Could not post that object.");
        }
        self._requestPath.collectionId = self._requestCollection.insert(obj);
      } catch (e) {
        return self._internalServerErrorResponse(e);
      }
      return self._createdResponse(JSON.stringify({_id: self._requestPath.collectionId}));
    }).run();
  });
};

// a laundry list of response status codes
CollectionLD._requestListener.prototype._okResponse = function(body) {
  var self = this;
  self._sendResponse(200, body);
};

CollectionLD._requestListener.prototype._createdResponse = function(body) {
  var self = this;
  self._sendResponse(201, body);
};

CollectionLD._requestListener.prototype._noContentResponse = function() {
  var self = this;
  self._sendResponse(204, '');
};

CollectionLD._requestListener.prototype._notSupportedResponse = function() {
  var self = this;
  self._sendResponse(501, '');
};

// 400 error for wrong signature JSON-LD
CollectionLD._requestListener.prototype._badRequestResponse = function(body) {
  var self = this;
  self._sendResponse(400, JSON.stringify({message: body.toString()}));
};

CollectionLD._requestListener.prototype._unauthorizedResponse = function(body) {
  var self = this;
  self._sendResponse(401, JSON.stringify({message: body.toString()}));
};

CollectionLD._requestListener.prototype._notFoundResponse = function(body) {
  var self = this;
  self._sendResponse(404, JSON.stringify({message: body.toString()}));
};

CollectionLD._requestListener.prototype._rejectedResponse= function(body) {
  var self = this;
  self._sendResponse(409, JSON.stringify({message: body.toString()}));
};

CollectionLD._requestListener.prototype._internalServerErrorResponse = function(body) {
  var self = this;
  self._sendResponse(500, JSON.stringify({error: body.toString()}));
};

// builds the response headers
CollectionLD._requestListener.prototype._sendResponse = function(statusCode, body) {
  var self = this;
  self._response.statusCode = statusCode;
  self._response.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
  self._response.setHeader('Content-Type', 'application/json');
  self._response.write(body);
  self._response.end();
};
