var path = require('path');
var urlParser = require('url');
var http = require('http');
var https = require('https');
var querystring = require('querystring');


exports.register = function (plugin, options, next) {

  // Sends a request to Superfeedr: private sugar!
  function _superfeedrRequest(mode, url, id, opts, cb) {
    var post_data = {
      'hub.mode': mode,
      'hub.topic': url,
      'hub.callback': urlParser.format({
        'protocol': options.webhooks.scheme || "http",
        'hostname': options.webhooks.host,
        'port': options.webhooks.port,
        'pathname': path.join(options.webhooks.base, id)
      })
    };

    if(opts.retrieve) {
      post_data['retrieve'] = true;
    }
    if(opts.format) {
      post_data['format'] = opts.format;
    }
    if(opts.secret) {
      post_data['hub.secret'] = opts.secret;
    }

    var post_options = {
      'host': 'push.superfeedr.com',
      'port': '443',
      'path': '/',
      'auth': [options.login, options.password].join(':'),
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': querystring.stringify(post_data).length
      }
    };
    
    var post_req = https.request(post_options, function(res) {
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function() {
        if(res.statusCode == 204 || res.statusCode == 200) {
          cb(null, data);
        }
        else {
          cb(new Error(res.statusCode, data));
        }
      })
    });

    post_req.write(querystring.stringify(post_data));
    post_req.end();
  }

  // Subscribe is called from anywhere in the hapi app like this
  // Params
  // - url: url of the feed/topic to which you want to subscribe
  // - id: unique id of the feed/topic uou want to subscribe. This is important to identify unique notifications. You should use some kind of primary key.
  // - opts: 
  //      - retrieve: set to true if you want previous items from the feed
  //      - format: 'atom' or 'json'
  //      - secret: a unique secret used to compute an HMAC key for notifications. 
  // - the callback will be called with the result of the subscription. First param is error, second param is body if retrieve:true.
  plugin.expose('subscribe', function(url, id, opts, cb) {
    _superfeedrRequest('subscribe', url, id, opts, cb);
  });

  // Unsubscribe is called from anywhere in the hapi app like this
  // Params
  // - url: url of the feed/topic to which you want to subscribe
  // - id: unique id of the feed/topic that you used to subscribe
  // - the callback will be called with the result of the subscription. First param is error, second param is body if retrieve:true.
  plugin.expose('unsubscribe', function(url, id, cb) {
    _superfeedrRequest('unsubscribe', url, id, {}, cb);
  });

  // Expose the events
  plugin.expose('on', plugin.events.on);


  plugin.route({
    method: 'POST',
    path: path.join(options.webhooks.base, '{feed_id?}'),
    handler: function(request, reply) {
      // The event is triggered so that anyone who listens to 'notification' on the superfeedr plugin (how do we do that?)
      // will recive the feed_id, the RAWBODY (if we are able to extract it), the topic/feed url and the request object
      // if they want to debug it.
      plugin.events.emit('notification', request.params.feed_id, request.payload, request.headers['x-pubsubhubbub-topic'], request);
      reply('Thanks Superfeedr');
    },
    config: { 
      payload: { 
        allow: ["application/atom+xml", "application/json"],
        parse: false 
      } 
    }
  });

  next();
}

exports.register.attributes = {
  multiple: false,
  name: 'superfeedr',
  version: '1.0.0'
};
