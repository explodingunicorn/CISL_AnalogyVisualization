var jetpack = require('fs-jetpack');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var port = process.env.PORT || 3000

app.use(express.static('assets'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
})

//Setting the bodyparser limits
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 10000}));

//Route for caching our results
app.post('/', function(req, res) {
    var file = req.body;
    jetpack.remove('./cache/' + req.body.key1 + req.body.key2 +'.json');
    jetpack.write('./cache/' + req.body.key1 + req.body.key2 +'.json', file);
    res.send('donezo');
});

//Route for requesting a new analogy
app.post('/requestAnalogy', function(req, res) {
    var json = jetpack.read('./cache/' + req.body.key1 + req.body.key2 + '.json');
    res.send(json);
});


app.listen(port, function() {
    console.log('Running on port 3000!');
});

//Live reload
var livereload = require('livereload');
var lrserver = livereload.createServer();
lrserver.watch(__dirname + "/assets");