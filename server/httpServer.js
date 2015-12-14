'use strict';

var express    = require('express');
var http       = require('http');
var Path       = require('path');

var GameServer = require('./game/gameServer');
var MatchMaker = require('./matchmaker/matchMaker');

exports.startServer = function startServer(port, path, callback) {

    var app = express();

    var httpServer = http.createServer(app);
    var io = require('socket.io')(httpServer);
    var gameServer = GameServer(io);

    app.use(express.static(Path.join(__dirname + "/../" + path)));

    app.get('/', function(req, res){
        res.sendFile('index.html');
    });

    gameServer.start();
    console.log('Game Server started on port ' + port);
    MatchMaker.start();
    httpServer.listen(port, callback);
};
