const express = require('express');

const app = express();
const http = require('http').Server(app);
const path = require('path');

const PORT = 3003;

app.use('/assets', express.static(path.join(__dirname, '/assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

http.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});
