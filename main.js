var jetpack = require('fs-jetpack');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var port = process.env.PORT || 3000

app.use(express.static('assets'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.post('/', function(req, res) {
    var file = JSON.stringify(req.body);
    jetpack.write('./cache/' + req.body.key1 + req.body.key2 +'.json', file);
});

app.listen(port, function() {
    console.log('Running on port 3000!');
});


var livereload = require('livereload');
var lrserver = livereload.createServer();
console.log(__dirname);
lrserver.watch(__dirname + "/assets");