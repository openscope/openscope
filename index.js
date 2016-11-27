var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');

var PORT = 3003;

app.use('/assets', express.static(path.join(__dirname + '/assets')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});
