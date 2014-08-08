# Hapi-superfeedr

This is a re-usable [Hapi](http://hapijs.com/) plugin for [Superfeedr](https://superfeedr.com/). It implements a small subset of [PubSubHubbub API calls](http://documentation.superfeedr.com/subscribers.html#webhooks) to allow the following:
 * subscribe
 * unsubscribe
 * handle notifications

## Usage

```javascript
var superfeedr = require('hapi-superfeedr');

var superfeedrOptions = {
  login: 'demo', // Superfeedr login
  password: 'ee72118e8a2a7939361fe48c478b9135', // Superfeedr token
  webhooks: {
    host: '14ab6330636c.b.passageway.io', // web accessible host of your application
    base: '/superfeedr', // base path for the webhook. make sure you use a unique base path to avoid route conflicts
    scheme: 'http', // can also be 'https'
    port: 80 // defaults to 80, but can be configured 
  }
}

server.pack.register({plugin: superfeedr, options: superfeedrOptions},  function(err) {
  if (err) {
    console.error('Failed to load a plugin:', err);
  }
});
```javascript

Later, anywhere your app you can invoke the following:

```javascript
// Handle notifications
server.plugins.superfeedr.on('notification', function(feed_id, payload, url, request) {
  // Save to database, send to user... etc
});
```

```javascript
// Subscribe to a feed
// Takes the feed url, a unique feed id (primary key, ideally) and an set of options:
// - retrieve: yield the previous feed entries
// - format: atom or json
// - secret: a secret string used to compute an HMAC signature for secure notifications. (not implemented by this plugin, you'll have to handle it yourself)
server.plugins.superfeedr.subscribe(url, id, {retrieve: true, format: 'atom', 'secret': 'xxxx'}, function(error, body) {
      // if !error => success. Body will only have data if you used retrieve to subscribe   
    });
```

```javascript
// Unsubscribe from a feed
// Takes the feed url, a unique feed id (you need to use the same used for subscription)
server.plugins.superfeedr.unsubscribe(url, id, function(error) {
      // if !error => success.  
    });
```



**Warning**: This is my very very first hapi project, so there are likely imperfections and even bugs. Please use with caution and feel free to fork and fix/improve. It also only implements a very small subset of Superfeedr features.