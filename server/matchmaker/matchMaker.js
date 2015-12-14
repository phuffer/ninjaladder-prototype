'use strict';

var PORT = 9194;

var matchmakerServer;
var serverSocket;
var playerPool = [];
var unavailablePool = [];
var gameInfo = {};

var MatchMaker = {
  start: function() {
    matchmakerServer = require('socket.io')(PORT);
    console.log('Match Making Server started on port ' + PORT);
    matchmakerServer.on('connection', onClientConnected);
  }
};

function onClientConnected(client) {
  client.on('CLIENT_REQUEST_ID', onRequestId);
  client.on('CLIENT_REQUEST_GAME', onRequestGame);
  client.on('CLIENT_PING', onClientPing);

  client.on('disconnect', onDisconnected);

  client.latency = 0;
  client.pingCounter = 0;
  client.pingTimer = setInterval(function() {
    client.pingCounter++;
    client.startTime = Date.now();
    client.emit('MATCHMAKER_PING');
  }, 1000);

  function onRequestId() {
    client.emit('MATCHMAKER_PLAYER_ID', client.id);
  }

  function onRequestGame(player) {
    playerPool.push(player);
    makeMatch();
    if(Object.keys(gameInfo).length) {
      console.log('sending game info:' + gameInfo.player1 + ' ' + gameInfo.player2 + ' ' + gameInfo.gid);
      client.broadcast.to(gameInfo.player1).emit('MATCHMAKER_GAME_FOUND', gameInfo);
      client.emit('MATCHMAKER_GAME_FOUND', gameInfo);
      playerPool.splice(0, 2);
      gameInfo = {};
      // serverSocket = io.connect('http://localhost:9192'); // send gameInfo to gameServer
    }
  }

  function makeMatch() {
    if(playerPool[0] && playerPool[1]) {
      gameInfo.player1 = playerPool[0].id;
      gameInfo.player2 = playerPool[1].id;
      gameInfo.gid = playerPool[0].id + playerPool[1].id;
    }
  }

  function onClientPing() {
    client.endTime = Date.now();
    var pingLatency = (client.endTime - client.startTime) / 2;
    client.latency += pingLatency;
    if(client.pingCounter == 3) {
      clearInterval(client.pingTimer);
      client.latency = client.latency / client.pingCounter;
      console.log('average latency of ' + client.id + ': ' + client.latency + 'ms');
    }
  }

  function onDisconnected() {
    client.disconnect();
  }
};

module.exports = MatchMaker;
