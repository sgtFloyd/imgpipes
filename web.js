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

function Image() {
  this.load = function(url, callback){
    var that = this;
    that.data = new Buffer(0, 'binary');

    var input = request.get(url);
    input.on('data', function(buf){
      if( typeof that.type === 'undefined' )
        that.type = input.response.headers['content-type'];

      if( that.type.match(/image/) )
        that.data = Buffer.concat([that.data, buf]);
      else input.end();
    });
    input.on('end', function(){
      callback(that.data);
    });
  }
}

app.get('/', function(req, res) {
  var url = req.query['url'],
      actions = ip.parseActions(req.query['do']);

  if( url ) {
    if( _.isEmpty(actions) )
      return request.get(url).pipe(res);
      // return res.redirect(url);

    var image = new Image();
    image.load(url, function(buf){
      if( buf && buf.length ) {
        res.contentType(image.type);
        res.send(buf);
      } else {
        res.send('invalid content type on url');
      }
    });
  } else res.send('', 404);
});

app.get('/ping', function(req, res) { res.send("PONG"); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
