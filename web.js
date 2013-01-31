var express = require('express'),
    imagick = require('imagemagick'),
    request = require('request'),
    _ = require('underscore');

var app = express.createServer(express.logger()),
    ip = {
      VALID_ACTIONS: ['flip'],
      isValidAction: function(action){
        return _.contains(ip.VALID_ACTIONS, action);
      },
      isValidURL: function(url){
      },
      parseActions: function(actions){
        if(actions) {
          return _.filter(actions.split(','), ip.isValidAction);
        } else return [];
      }
    };

app.get('/', function(req, res) {
  var url = req.query['url'],
      actions = ip.parseActions(req.query['do']);

  if( url && _.isEmpty(actions) ) return res.redirect(url);
  res.send("URL: "+url+", Actions: "+actions);
});
app.get('/ping', function(req, res) { res.send("PONG"); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
