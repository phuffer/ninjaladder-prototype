'use strict';

var PlayerSprite = function(game, x, y, isCollisionEnabled, properties) {
  Phaser.Sprite.call(this, game, x, y, 'player_spritesheet');
  if(isCollisionEnabled) {
    this.enableCollision();
  }
  this.configureProperties(properties);
  this.setupAnimations();
};

PlayerSprite.prototype = Object.create(Phaser.Sprite.prototype);
PlayerSprite.prototype.constructor = PlayerSprite;

PlayerSprite.prototype.enableCollision = function() {
  this.game.physics.arcade.enable(this);
};

PlayerSprite.prototype.configureProperties = function(properties) {
  this.walking_speed = +properties.walking_speed;
  this.jumping_speed = +properties.jumping_speed;
  this.bouncing = +properties.bouncing;
  this.score = 0;
};

PlayerSprite.prototype.setupAnimations = function() {
  this.animations.add('left', [0, 1, 2, 3], 10, true);
  this.animations.add('right', [5, 6, 7, 8], 10, true);
  this.animations.add('jump', [4]);
  this.animations.add('none');
};

module.exports = PlayerSprite;
