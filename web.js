var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn;

var app = express.createServer(express.logger());

var EFFECTS = {
      flip: ['-', '-flip', '-']
    };

app.get('/', function(req, res, next) {
  var url = req.query['url'],
      actions = req.query['do'];

  if( url && actions ) {
    var actions = actions.split(','),
        input = request.get(url);

    while( action = actions.shift() ){
      if( EFFECTS[action] ) {
        var convert = spawn('convert', EFFECTS[action]);
        input.pipe(convert.stdin);
        input = convert.stdout;
      }
    }
    input.pipe(res);
  } else next();
});

app.get('/ping', function(req, res) { res.send("PONG"); });
app.get('*', function(req, res){ res.send(404); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
