var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn,
    _ = require('underscore');

var COMMANDS = {
      blur:       {fn:'convert', rgs:['-blur', '0x3']},
      contrast:   {fn:'convert', rgs:['-contrast']},
      explode:    {fn:'convert', rgs:['-implode', '-0.5']},
      implode:    {fn:'convert', rgs:['-implode', '0.33']},
      flip:       {fn:'convert', rgs:['-flip']},
      flop:       {fn:'convert', rgs:['-flop']},
      gray:       {fn:'convert', rgs:['-colorspace', 'Gray']},
      negate:     {fn:'convert', rgs:['-negate']},
      paint:      {fn:'convert', rgs:['-paint', '3']},
      polaroid:   {fn:'convert', rgs:['-polaroid', '3', '-background', 'None', '-format', 'png']},
      posterize:  {fn:'convert', rgs:['-posterize', '5']},
      sepia:      {fn:'convert', rgs:['-sepia-tone', '75%']},
      sharpen:    {fn:'convert', rgs:['-sharpen', '5']},
      swirl:      {fn:'convert', rgs:['-swirl', '90']},
      vignette:   {fn:'convert', rgs:['-vignette', '0x50']}
    };
COMMANDS.greyscale = COMMANDS.grayscale = COMMANDS.grey = COMMANDS.gray;
COMMANDS.mirror = COMMANDS.flop;
COMMANDS.negative = COMMANDS.invert = COMMANDS.negate;

var construct = function(commandList){
  if( !commandList ) return [];
  return _.chain(commandList.split(','))
    .reduce( function(output, cmd){
      // Skip any invalid commands.
      if( !(cmd in COMMANDS) ) return output;

      var lastCmd = _.last(output),
          thisCmd = COMMANDS[cmd];

      // If this command uses the same function as the previous,
      // append its arguments to the previous command's arguments.
      if( lastCmd && lastCmd.fn == thisCmd.fn )
        lastCmd.rgs = lastCmd.rgs.concat(thisCmd.rgs);
      // Otherwise add it to the output as a new command.
      else output = output.concat(_.clone(thisCmd));
      return output;
    }, [])
    .map( function(cmd){
      // Add '-' as each command's first and last arguments,
      // telling ImageMagick to pipe from stdin to stdout.
      cmd.rgs = _.flatten(['-', cmd.rgs, '-']);

      return cmd;
    }).value();
};

var convert = function(url, commandList, callback){
  if( !url ) return callback();

  var imagepipe = request.get(url);
  _.each(construct(commandList), function(cmd){
    console.log('Spawning:', cmd.fn, cmd.rgs.join(' '));
    var convert = spawn(cmd.fn, cmd.rgs);
    imagepipe.pipe(convert.stdin);
    imagepipe = convert.stdout;
  });
  callback(imagepipe);
};

var app = express.createServer(express.logger());
app.get('/', function(req, res, next){
  var url = req.query['url'] || req.query['u'],
      commandList = req.query['do'];

  convert(url, commandList,
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
