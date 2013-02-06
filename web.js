var express = require('express'),
    request = require('request'),
    spawn = require('child_process').spawn,
    repoUrl = 'https://github.com/sgtFloyd/imgpipes';

var FX = {
      blur:       {fn:'convert', rgs:['-blur', '0x3']},
      contrast:   {fn:'convert', rgs:['-contrast']},
      eccehomo:   {fn:'convert', rgs:['-swirl', '75', '-posterize', '15', '-paint', '10']},
      explode:    {fn:'convert', rgs:['-implode', '-0.5']},
      implode:    {fn:'convert', rgs:['-implode', '0.33']},
      flip:       {fn:'convert', rgs:['-flip']},
      flop:       {fn:'convert', rgs:['-flop']},
      gray:       {fn:'convert', rgs:['-colorspace', 'Gray']},
      negate:     {fn:'convert', rgs:['-negate']},
      paint:      {fn:'convert', rgs:['-paint', '3']},
      pixel:      {fn:'convert', rgs:['-scale', '10%', '-scale', '1000%']},
      polaroid:   {fn:'convert', rgs:['+polaroid', '-background', 'white', '-flatten']},
      posterize:  {fn:'convert', rgs:['-posterize', '5']},
      sepia:      {fn:'convert', rgs:['-sepia-tone', '75%']},
      sharpen:    {fn:'convert', rgs:['-sharpen', '5']},
      swirl:      {fn:'convert', rgs:['-swirl', '90']},
      vignette:   {fn:'convert', rgs:['-vignette', '0x50']}
    };
FX.greyscale = FX.grayscale = FX.grey = FX.gray;
FX.mirror = FX.flop;
FX.pixelate = FX.pixelart = FX.pixel;
FX.negative = FX.invert = FX.negate;

var convert = function(url, effects, callback){
  if(typeof url !== 'string') return callback();
  var imagepipe = request.get(url),
      commands = construct(effects);

  // Spawn an ImageMagick process for each command, piping
  // the previous command's output into the next one's input.
  commands.forEach(function(cmd){
    var process = spawn(cmd.fn, cmd.rgs);
    imagepipe.pipe(process.stdin);
    imagepipe = process.stdout;
  });
  callback(imagepipe);
};

// Construct a list of commands given a comma-separated list of
// effects. If an effect uses the same command as the previous
// one, combine them into a single command.
var construct = function(effects){
  if(typeof effects !== 'string') return [];

  var commands = [];
  effects.split(',').forEach(function(effect){
    if( !(effect in FX) ) return;
    var lastCmd = commands[commands.length-1],
        thisCmd = FX[effect];

    // If this effect uses the same function as the previous,
    // append its arguments to the previous command's arguments.
    if( lastCmd && lastCmd.fn === thisCmd.fn )
      lastCmd.rgs = lastCmd.rgs.concat(thisCmd.rgs);

    // Otherwise add it to the output as a new command.
    else commands = commands.concat({fn:thisCmd.fn, rgs:thisCmd.rgs});
  });

  // Add '-' as each command's first and last arguments,
  // telling ImageMagick to pipe from stdin to stdout.
  commands.forEach(function(cmd){
    cmd.rgs = ['-'].concat(cmd.rgs, ['-']);
  });
  return commands;
};

var app = express.createServer(express.logger());
app.get('/', function(req, res, next){
  var url = req.query['url'] || req.query['u'],
      fx = req.query['do'] || req.query['fx'];
  if(url instanceof Array) url = url[0];
  if(fx instanceof Array) fx = fx[0];

  try {
    convert(url, fx,
      function(output){
        if( output )
          output.pipe(res);
        else res.redirect(repoUrl);
    });
  } catch(e) {
    res.send(500);
    console.error(e.stack);
  }
});
app.get('/ping', function(req, res) { res.send("PONG"); });
app.get('*', function(req, res){ res.send(404); });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
