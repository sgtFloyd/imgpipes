var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn;

var app = express.createServer(express.logger());

var EFFECTS = {
      average:  ['convert', ['-average']],
      blur:     ['convert', ['-blur', '0x3']],
      contrast: ['convert', ['-contrast']],
      flip:     ['convert', ['-flip']],
      flop:     ['convert', ['-flop']],
      negate:   ['convert', ['-negate']],
      paint:    ['convert', ['-paint', '3']],
      sepia:    ['convert', ['-sepia-tone', '75%']],
      sharpen:  ['convert', ['-sharpen', '5']],
      swirl:    ['convert', ['-swirl', '90']]
    };
EFFECTS.mirror = EFFECTS.flop;
EFFECTS.negative = EFFECTS.invert = EFFECTS.negate;
EFFECTS.squash = EFFECTS.average;

app.get('/', function(req, res, next) {
  var url = req.query['url'],
      actions = req.query['do'];

  if( url ) {
    var actions = actions ? actions.split(',') : [],
        input = request.get(url);

    while( action = actions.shift() ){
      if( EFFECTS[action] ) {
        var cmd = EFFECTS[action][0],
            args = EFFECTS[action][1],
            args = ['-'].concat(args, '-'),
            convert = spawn(cmd, args);

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
