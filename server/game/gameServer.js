var gameServer, playerList = [];
var playerPool = [];
var currentMatches = {};
var NICKNAME_MAX_LENGTH = 16;

var GameServer = function(io){
  gameServer = io;
  return {
    start: function(){
      gameServer.on('connection', onClientConnected);
    }
  };
};

function onClientConnected(client) {
  client.on('CLIENT_CONNECTED', clientConnected);
  client.on('CLIENT_PLAYER_MOVE', onPlayerMove);
  client.on('CLIENT_PLAYER_ACTION', onPlayerAction);
  client.on('CLIENT_GAME_INFO', onReceiveGameInfo);

  client.on('disconnect', onDisconnected);

  function onPlayerMove(playerInfo) {
    client.broadcast.to(playerInfo.otherId).emit('SERVER_OTHER_PLAYER_MOVE', playerInfo);
  }

  function onPlayerAction(actionInfo) {
    client.broadcast.to(actionInfo.otherId).emit('SERVER_PLAYER_ACTION', actionInfo);
  }

  function onReceiveGameInfo(gameInfo) {
    var oldId = client.id;
    client.leave(client.id);
    client.join(gameInfo.myId);
    client.id = gameInfo.myId;
    if(!currentMatches[gameInfo.gid]) {
      currentMatches[gameInfo.gid] = gameInfo.gid;
    }
  }

  function clientConnected() {
    console.log('client ' + client.id + ' connected to server');
  }

  function onDisconnected() {
    client.disconnect();
  }
};

module.exports = GameServer;
