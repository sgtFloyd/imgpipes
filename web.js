var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn,
    _ = require('underscore');

var FX = {
      blur:       {fn:'convert', rgs:['-blur', '0x3']},
      contrast:   {fn:'convert', rgs:['-contrast']},
      explode:    {fn:'convert', rgs:['-implode', '-0.5']},
      implode:    {fn:'convert', rgs:['-implode', '0.33']},
      flip:       {fn:'convert', rgs:['-flip']},
      flop:       {fn:'convert', rgs:['-flop']},
      gray:       {fn:'convert', rgs:['-colorspace', 'Gray']},
      negate:     {fn:'convert', rgs:['-negate']},
      paint:      {fn:'convert', rgs:['-paint', '3']},
      polaroid:   {fn:'convert', rgs:['-polaroid', '3', '-background', 'white']},
      posterize:  {fn:'convert', rgs:['-posterize', '5']},
      sepia:      {fn:'convert', rgs:['-sepia-tone', '75%']},
      sharpen:    {fn:'convert', rgs:['-sharpen', '5']},
      swirl:      {fn:'convert', rgs:['-swirl', '90']},
      vignette:   {fn:'convert', rgs:['-vignette', '0x50']}
    };
FX.greyscale = FX.grayscale = FX.grey = FX.gray;
FX.mirror = FX.flop;
FX.negative = FX.invert = FX.negate;

var convert = function(url, effects, callback){
  if( !url ) return callback();

  var imagepipe = request.get(url),
      commands = construct(effects);

  // Spawn an ImageMagick process for each command, piping
  // the previous command's output into the next one's input.
  _.each(commands, function(cmd){
    console.log('Spawning:', cmd.fn, cmd.rgs.join(' '));
    var process = spawn(cmd.fn, cmd.rgs);
    imagepipe.pipe(process.stdin);
    imagepipe = process.stdout;
  });
  callback(imagepipe);
};

var construct = function(effects){
  if( !effects ) return [];
  return _.chain( optimizeEffects(effects) )
    .reduce(function(output, effect){
      var lastCmd = _.last(output),
          thisCmd = FX[effect];

      // If this effect uses the same function as the previous,
      // append its arguments to the previous command's arguments.
      if( lastCmd && lastCmd.fn === thisCmd.fn )
        lastCmd.rgs = lastCmd.rgs.concat(thisCmd.rgs);

      // Otherwise add it to the output as a new command.
      else output = output.concat(_.clone(thisCmd));
      return output;
    }, [])
    .map(function(cmd){
      // Add '-' as each command's first and last arguments,
      // telling ImageMagick to pipe from stdin to stdout.
      cmd.rgs = _.flatten(['-', cmd.rgs, '-']);
      return cmd;
    }).value();
};

var optimizeEffects = function(effects){
  // Reject any invalid effects
  effects = _.filter(effects.split(','),
    function(effect){ return effect in FX; }
  ).join(',');

  // Remove or combine any redundant combinations.
  // This can probably be done more efficently.
  var tempEffects;
  while( tempEffects !== effects ) {
    tempEffects = effects;
    effects = effects.replace(/flip,flip,?/g,'');
    effects = effects.replace(/flop,flop,?/g,'');
    effects = effects.replace(/gr[ea]y,gr[ea]y,?/g, 'grey,');
    effects = effects.replace(/(negate|invert|negative),(negate|invert|negative),?/g,'');
  }
  return _.compact(effects.split(','));
};

var app = express.createServer(express.logger());
app.get('/', function(req, res, next){
  var url = req.query['url'] || req.query['u'],
      effects = req.query['do'];

  convert(url, effects,
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
