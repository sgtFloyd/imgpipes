var express = require('express'),
    imagick = require('imagemagick');

var app = express.createServer(express.logger());

app.get('/', function(req, res) {
  var url = req.query['url'];
  res.send('URL: ' + url);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
