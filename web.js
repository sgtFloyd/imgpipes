var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn,
    _ = require('underscore');

var COMMANDS = {
      blur:       ['convert', ['-blur', '0x3']],
      contrast:   ['convert', ['-contrast']],
      explode:    ['convert', ['-implode', '-0.5']],
      implode:    ['convert', ['-implode', '0.33']],
      flip:       ['convert', ['-flip']],
      flop:       ['convert', ['-flop']],
      gray:       ['convert', ['-colorspace', 'Gray']],
      negate:     ['convert', ['-negate']],
      paint:      ['convert', ['-paint', '3']],
      polaroid:   ['convert', ['-polaroid', '3', '-background', 'None', '-format', 'png']],
      posterize:  ['convert', ['-posterize', '5']],
      sepia:      ['convert', ['-sepia-tone', '75%']],
      sharpen:    ['convert', ['-sharpen', '5']],
      swirl:      ['convert', ['-swirl', '90']],
      vignette:   ['convert', ['-vignette', '0x50']]
    };
COMMANDS.greyscale = COMMANDS.grayscale = COMMANDS.grey = COMMANDS.gray;
COMMANDS.mirror = COMMANDS.flop;
COMMANDS.negative = COMMANDS.invert = COMMANDS.negate;

var buildCommands = function(actions){
  if( !actions ) return [];

  return _.chain(actions.split(','))
          .map(function(action){
            var fn = COMMANDS[action][0],
                args = COMMANDS[action][1];
            return [fn, ['-'].concat(args, ['-'])];
          }).compact().value();
};

var converter = function(action){
  var command = action[0],
      args = action[1];

  return spawn(command, args);
};

var convert = function(url, actions, callback){
  if( !url ) return callback();

  var commands = buildCommands(actions),
      imagepipe = request.get(url);

  _.each(commands, function(command){
    var convert = converter(command);
    imagepipe.pipe(convert.stdin);
    imagepipe = convert.stdout;
  });
  callback(imagepipe);
};

var app = express.createServer(express.logger());
app.get('/', function(req, res, next){
  var url = req.query['url'] || req.query['u'],
      actions = req.query['do'];

  convert(url, actions,
    function(output){
      if( output )
        output.pipe(res);
      else next();
  });
});
app.get('/ping', function(req, res) { res.send("PONG"); });
app.get('*', function(req, res){ res.send(404); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
