'use strict';

var serverSocket, mainPlayerId;
var gameInfo;

var onPlayerDisconnectCallback;
var onOtherPlayerMoveCallback;
var onOtherPlayerActionCallback;

var NetworkManager = {
  connected: false,
  gameInfo: {},
  connect: function(gameInfo) {
    mainPlayerId = gameInfo.myId;
    serverSocket = io.connect('http://localhost:9192');
    serverSocket.on('connect', onConnectedToServer);
    serverSocket.emit('CLIENT_GAME_INFO', gameInfo);

    this.configureIncomingTraffic();
  },

  configureIncomingTraffic: function(){
    serverSocket.on('SERVER_PLAYER_DISCONNECT', onPlayerDisconnect);
    serverSocket.on('SERVER_OTHER_PLAYER_MOVE', onPlayerMove);
    serverSocket.on('SERVER_PLAYER_ACTION', onPlayerAction);
  },

  onOtherPlayerMove: function(callback) {
    onOtherPlayerMoveCallback = callback;
  },

  onOtherPlayerAction: function(callback) {
    onOtherPlayerActionCallback = callback;
  },

  onPlayerDisconnect: function(callback) {
    onPlayerDisconnectCallback = callback;
  },

  onMainPlayerMove: function(playerInfo) {
    serverSocket.emit('CLIENT_PLAYER_MOVE', playerInfo);
  },

  onMainPlayerAction: function(actionInfo) {
    serverSocket.emit('CLIENT_PLAYER_ACTION', actionInfo);
  }
};

function onConnectedToServer() {
  NetworkManager.connected = true;
  serverSocket.emit('CLIENT_CONNECTED');
};

function onPlayerMove(playerInfo) {
  onOtherPlayerMoveCallback(playerInfo);
};

function onPlayerAction(actionInfo) {
  onOtherPlayerActionCallback(actionInfo);
};

function onPlayerDisconnect(player) {
  onPlayerDisconnectCallBack(player);
};

module.exports = NetworkManager;
