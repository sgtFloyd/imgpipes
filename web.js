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

var construct = function(cmdList){
  if( !cmdList ) return [];
  var wrap = function(cmds){ return ['-'].concat(cmds, ['-']) };

  var retVal = [];
  _.each(cmdList.split(','), function(cmd){
    if( cmd in COMMANDS ) {
      cmd = COMMANDS[cmd];
      var lastCmd = retVal[retVal.length-1];
      if (lastCmd && lastCmd.fn == cmd.fn) {
        lastCmd.rgs = lastCmd.rgs.concat(cmd.rgs);
      } else {
        retVal = retVal.concat( _.clone(cmd) );
      }
    }
  });
  return _.map(retVal, function(cmd){
    cmd.rgs = wrap(cmd.rgs);
    return cmd;
  });
};

var convert = function(url, cmdList, callback){
  if( !url ) return callback();

  var imagepipe = request.get(url);
  _.each(construct(cmdList), function(cmd){
    console.log(cmd.fn, cmd.rgs.join(' '));
    var convert = spawn(cmd.fn, cmd.rgs);
    imagepipe.pipe(convert.stdin);
    imagepipe = convert.stdout;
  });
  callback(imagepipe);
};

var app = express.createServer(express.logger());
app.get('/', function(req, res, next){
  var url = req.query['url'] || req.query['u'],
      cmdList = req.query['do'];

  convert(url, cmdList,
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
