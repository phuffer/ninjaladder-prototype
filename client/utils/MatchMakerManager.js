'use strict';

var mainPlayer;
var matchmaker;
var playerPool = [];

var onGameFoundCallback;

var MatchMakerManager = {
  connect: function(player) {
    mainPlayer = player;

    matchmaker = io.connect('http://localhost:9194');
    matchmaker.on('connect', onConnectedToServer);

    this.configureIncomingTraffic();
  },

  configureIncomingTraffic: function() {
    matchmaker.on('MATCHMAKER_PLAYER_ID', onReceiveId);
    matchmaker.on('MATCHMAKER_GAME_FOUND', onGameFound);
    matchmaker.on('MATCHMAKER_PING', onPingRequest);

  },

  setGameFoundCallback: function(callback) {
    onGameFoundCallback = callback;
  },

  getPid: function() {
    return mainPlayer.id;
  },

  disconnect: function() {
    matchmaker.emit('disconnect');
  }
}

function onConnectedToServer() {
  MatchMakerManager.connected = true;
  matchmaker.emit('CLIENT_REQUEST_ID');
};

function onReceiveId(id) {
  mainPlayer.id = id;
  console.log('received id: ' + id);
  matchmaker.emit('CLIENT_REQUEST_GAME', mainPlayer);
};

function onPingRequest() {
  matchmaker.emit('CLIENT_PING');
};

function onGameFound(matchInfo) {
  onGameFoundCallback(matchInfo);
};

module.exports = MatchMakerManager;
