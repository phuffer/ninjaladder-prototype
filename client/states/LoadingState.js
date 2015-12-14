'use strict';

var level_data;

var MatchMakerManager = require('client/utils/MatchMakerManager');

function LoadingState() {}

LoadingState.prototype = {
  init: function() {
    this.displaySearchingScreen();
    this.gameInfo = {};
    this.mainPlayer = {};
    this.searchForGame();
  },

  preload: function() {
    this.load.text('level1', 'maps/map1.json');
  },

  create: function() {
    var level_text;
    level_text = this.game.cache.getText('level1');
    level_data = JSON.parse(level_text);
  },

  displaySearchingScreen: function() {
    var seachingText = 'Searching for Game...';
    var text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, seachingText);

    text.anchor.set(0.5);
    text.align = 'center';

    text.font = 'Arial';
    text.fontWeight = 'bold';
    text.fontSize = 70;
    text.fill = 'black';
    text.setShadow(5, 5, 'rgb(68, 68, 68)', 5);
  },

  searchForGame: function() {
    var me = this;

    MatchMakerManager.setGameFoundCallback(function(newGame) {
      me.gameInfo = newGame;
      me.gameInfo.myId = MatchMakerManager.getPid();
      level_data.players.player1.id = me.gameInfo.player1;
      level_data.players.player2.id = me.gameInfo.player2;
      MatchMakerManager.disconnect();
      me.game.state.start('PlayState', true, false, me.gameInfo, level_data);
    });


    MatchMakerManager.connect(this.mainPlayer);
  }
};

module.exports = LoadingState;
