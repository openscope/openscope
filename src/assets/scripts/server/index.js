const express = require('express');
const http = require('http');
const path = require('path');
const colors = require('ansi-colors');

const app = express();
const server = http.Server(app);

const PORT = process.env.PORT || 3003;

app.use('/assets', express.static(path.join(__dirname, '/../../../assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../../../index.html'));
});

server.listen(PORT, () => {
    console.log(colors.green.bold(`\nListening on PORT ${PORT}`));
});
