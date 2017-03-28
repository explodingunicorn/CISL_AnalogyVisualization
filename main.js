var express = require('express');
var app = express();

var port = process.env.PORT || 3000

app.use(express.static('assets'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
})

app.listen(port, function() {
    console.log('Running on port 3000!');
});


var livereload = require('livereload');
var lrserver = livereload.createServer();
lrserver.watch([__dirname + "/assets/js", __dirname + "/assets/xmltest/js"]);