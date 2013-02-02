var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn,
    _ = require('underscore');

var COMMANDS = {
      blur:       {fn:'convert', args:['-blur', '0x3']},
      contrast:   {fn:'convert', args:['-contrast']},
      explode:    {fn:'convert', args:['-implode', '-0.5']},
      implode:    {fn:'convert', args:['-implode', '0.33']},
      flip:       {fn:'convert', args:['-flip']},
      flop:       {fn:'convert', args:['-flop']},
      gray:       {fn:'convert', args:['-colorspace', 'Gray']},
      negate:     {fn:'convert', args:['-negate']},
      paint:      {fn:'convert', args:['-paint', '3']},
      polaroid:   {fn:'convert', args:['-polaroid', '3', '-background', 'None', '-format', 'png']},
      posterize:  {fn:'convert', args:['-posterize', '5']},
      sepia:      {fn:'convert', args:['-sepia-tone', '75%']},
      sharpen:    {fn:'convert', args:['-sharpen', '5']},
      swirl:      {fn:'convert', args:['-swirl', '90']},
      vignette:   {fn:'convert', args:['-vignette', '0x50']}
    };
COMMANDS.greyscale = COMMANDS.grayscale = COMMANDS.grey = COMMANDS.gray;
COMMANDS.mirror = COMMANDS.flop;
COMMANDS.negative = COMMANDS.invert = COMMANDS.negate;

var buildCommands = function(actions){
  if( !actions ) return [];

  return _.chain(actions.split(','))
          .map(function(action){
            var cmd = COMMANDS[action];
            return {fn:cmd.fn, args:['-'].concat(cmd.args, ['-'])};
          }).compact().value();
};

var convert = function(url, actions, callback){
  if( !url ) return callback();

  var commands = buildCommands(actions),
      imagepipe = request.get(url);

  _.each(commands, function(cmd){
    var convert = spawn(cmd.fn, cmd.args);
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
