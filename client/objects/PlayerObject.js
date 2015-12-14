'use strict';

var NetworkManager = require('client/utils/NetworkManager');
var PlayerSprite = require('client/sprites/PlayerSprite');

var PlayerObject = function(game, x, y, isMainPlayer, properties) {
  this.configure(game, isMainPlayer);
  this.setupSprite(x, y, properties);
};

PlayerObject.prototype.configure = function(game, isMainPlayer) {
  this.game = game;
  this.isMainPlayer = isMainPlayer;
  this.info = {};
}

PlayerObject.prototype.setupSprite = function(x, y, properties) {
  this.sprite = new PlayerSprite(this.game, x, y, true, properties);
  this.game.add.existing(this.sprite);
  this.sprite.body.gravity.y = 1000;
  this.sprite.body.allowGravity = true;
  this.sprite.body.collideWorldBounds = true;
}


module.exports = PlayerObject;
