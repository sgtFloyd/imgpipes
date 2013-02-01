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
      parseActions: function(actions){
        if(actions) {
          return _.filter(actions.split(','), ip.isValidAction);
        } else return [];
      }
    };

app.get('/', function(req, res) {
  var url = req.query['url'],
      actions = ip.parseActions(req.query['do']);

  if( url && _.isEmpty(actions) )
    return request.get(url).pipe(res);
    // return res.redirect(url);

  var input = request.get(url),
      output = new Buffer(0, 'binary'),
      type, isImage;

  input.on('data', function(buf){
    if( typeof type == "undefined" ) {
      type = input.response.headers['content-type'];
      isImage = !!type.match(/^image/);
    }

    if( isImage )
      output = Buffer.concat([output, buf]);
  });

  input.on('end', function(){
    if( isImage ) {
      res.contentType(type);
      res.send(output);
    }
  });

});

app.get('/ping', function(req, res) { res.send("PONG"); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
