'use strict';

var myId, otherId, me, otherPlayer;
var game, groups;
var mySword, otherSword;
var winner;
var keys = {};
var weapon = 'sword';
var directionBool = true;

var playerDirection = 1;
var otherPlayerDirection;

var ninjastar_rotation = 15;
var ninjastar_velocity = 700;

var keyCodes = {
  'A': 65,
  'S': 83,
  'W': 87,
  'D': 68,
  'SPACE': 32,
  'W_SWORD': 49,
  'W_NINJASTAR': 50
};

var NetworkManager = require('client/utils/NetworkManager');
var PlayerObject = require('client/objects/PlayerObject');

function PlayState() {}

PlayState.prototype = {
  init: function(gameInfo, level_data) {
    this.gameInfo = gameInfo;
    this.level_data = level_data;
    this.initKeys();
    this.game.canvas.oncontextmenu = function(e) {e.preventDefault(); };
    myId = gameInfo.myId;
    otherId = getOtherPlayerId(gameInfo);

    NetworkManager.connect(gameInfo);

    NetworkManager.onOtherPlayerMove(function(movementInfo) {
      updateOtherPlayer(movementInfo);
    });
    NetworkManager.onOtherPlayerAction(function(actionInfo) {
      onOtherPlayerAction1(actionInfo);
    });
    NetworkManager.onPlayerDisconnect(function() {
      
    });
  },

  preload: function() {
    var assets, asset_load, asset_key, asset;
    assets = this.level_data.assets;
    for(asset_key in assets) {
      if(assets.hasOwnProperty(asset_key)) {
        asset = assets[asset_key];
        switch(asset.type) {
          case "image":
            this.load.image(asset_key, asset.source);
            break;
          case "spritesheet":
            this.load.spritesheet(asset_key, asset.source, asset.frame_width, asset.frame_height, asset.frames, asset.margin, asset.spacing);
            break;
        }
      }
    }
  },

  create: function() {
    var group_name;

    this.game.add.sprite(0, 0, "background");

    this.groups = {};
    this.level_data.groups.forEach(function (group_name) {
      this.groups[group_name] = this.game.add.group();
    }, this);

    this.createPlatforms();

    otherPlayer = this.createPlayer(otherId);
    me = this.createPlayer(myId);

    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.input.onDown.add(function() {
      this.throwNinjaStar(me.sprite, 'ninjastars1');
    }, this);

    this.game.input.reset();
    this.game.input.onDown.add(function() {
      this.swingSword();
    }, this);

    this.drawSwords();

    game = this.game;
    groups = this.groups;
  },

  update: function() {
    // check player collision with platforms
    this.game.physics.arcade.collide(me.sprite, this.groups['platforms']);
    this.game.physics.arcade.collide(otherPlayer.sprite, this.groups['platforms']);
    this.game.physics.arcade.collide(this.groups['ninjastars1'], this.groups['platforms'], function(ninjastar, platform) {
      ninjastar.kill();
    });
    this.game.physics.arcade.collide(this.groups['ninjastars2'], this.groups['platforms'], function(ninjastar, platform) {
      ninjastar.kill();
    });
    // console.log(this.game.physics.arcade.collide(mySword, otherPlayer.sprite));
    if(weapon == 'sword') {
      if(playerDirection == 1) {
        var frame = me.sprite.frame;
        if(frame == 5) {
          mySword.angle = 55;
        }
        else if(frame == 6) {
          mySword.angle = 85;
        }
        else if(frame == 7) {
          mySword.angle = 45;
        }
      }
      else {
        var frame = me.sprite.frame;
        if(frame == 3) {
          mySword.angle = 325;
        }
        else if(frame == 2) {
          mySword.angle = 305;
        }
        else if(frame == 1) {
          mySword.angle = 275;
        }
      }
    }

    if(keys.equip_sword.isDown) {
      weapon = 'sword';
      mySword.alpha = 1;
    }
    else if(keys.equip_ninjastar.isDown) {
      weapon = 'ninjastar';
      mySword.alpha = 0;
    }

    // move right
    if(me.sprite.body.velocity.x >= 0 && (keys.right.isDown ||
                                          this.cursors.right.isDown)) {

      playerDirection = 1;
      me.sprite.body.velocity.x = me.sprite.walking_speed;
      me.sprite.animations.play('right');
      this.updateSword(me, 'right', mySword);
      NetworkManager.onMainPlayerMove(getPlayerInfo(me));
    }

    // move left
    else if(me.sprite.body.velocity.x <= 0 && (keys.left.isDown ||
                                               this.cursors.left.isDown)) {

      playerDirection = -1;
      me.sprite.body.velocity.x = -me.sprite.walking_speed;
      me.sprite.animations.play('left');
      this.updateSword(me, 'left', mySword);
      NetworkManager.onMainPlayerMove(getPlayerInfo(me));
    }
    // standing still
    else {
      me.sprite.body.velocity.x = 0;
      me.sprite.animations.stop();
      if(playerDirection == 1) {
        me.sprite.frame = 5;
      }
      else {
        me.sprite.frame = 2;
      }

      var playerInfo = {};
      playerInfo.animation = 'none';
      playerInfo.otherId = otherId;
      NetworkManager.onMainPlayerMove(playerInfo);
    }

    // jump
    if(me.sprite.body.touching.down && (keys.jump.isDown ||
                                        keys.jump_space.isDown ||
                                        this.cursors.up.isDown)) {

      me.sprite.body.velocity.y = -me.sprite.jumping_speed;
      me.sprite.animations.play('jump');

      var playerInfo = {};
      playerInfo.animation = 'jump';
      playerInfo.otherId = otherId;
      NetworkManager.onMainPlayerMove(playerInfo);
    }

    // check ninjastar bounds with players
    this.checkNinjaStars('ninjastars1', otherPlayer, me);
    this.checkNinjaStars('ninjastars2', me, otherPlayer);
  },

  createPlayer: function(id) {
    var player = {};
    if(this.level_data.players.player1.id == id) {
      var startX = this.level_data.players.player1.x;
      var startY = this.level_data.players.player1.y;
      var properties = this.level_data.players.player1.properties;
      player = new PlayerObject(this.game,startX, startY, true, properties);
      player.sprite.frame = 4;
      player.id = id;
    }
    else {
      var startX = this.level_data.players.player2.x;
      var startY = this.level_data.players.player2.y;
      var properties = this.level_data.players.player2.properties;
      player = new PlayerObject(this.game,startX, startY, true, properties);
      player.sprite.frame = 4;
      player.id = id;
    }
    return player;
  },

  createPlatforms: function() {
    this.groups["platforms"].enableBody = true;
    var ground = this.groups['platforms'].create(0, this.game.world.height - 64, 'platform');
    ground.scale.setTo(2, 2);
    ground.body.immovable = true;
    ground.body.allowGravity = false;

    var ledge = this.groups['platforms'].create(400, 400, 'platform');
    ledge.body.immovable = true;
    ledge.body.allowGravity = false;

    ledge = this.groups['platforms'].create(-150, 250, 'platform');
    ledge.body.immovable = true;
    ledge.body.allowGravity = false;
  },

  initKeys: function() {
    keys.left = this.game.input.keyboard.addKey(keyCodes.A);
    keys.right = this.game.input.keyboard.addKey(keyCodes.D);
    keys.jump = this.game.input.keyboard.addKey(keyCodes.W);
    keys.jump_space = this.game.input.keyboard.addKey(keyCodes.SPACE);
    keys.equip_sword = this.game.input.keyboard.addKey(keyCodes.W_SWORD);
    keys.equip_ninjastar = this.game.input.keyboard.addKey(keyCodes.W_NINJASTAR);
  },

  throwNinjaStar: function(playerSprite, group) {
    if(weapon == 'ninjastar') {
      var startX;
      var startY = playerSprite.position.y + playerSprite.height/2;
      if(playerDirection == 1) {
        startX = playerSprite.position.x + (playerDirection*playerSprite.width);
      }
      else {
        startX = playerSprite.position.x;
      }
      var ninjastar = this.groups[group].create(startX, startY, 'ninjastar');
      this.game.physics.enable(ninjastar);
      ninjastar.alive = true;
      ninjastar.anchor.setTo(.5, .5);
      ninjastar.outOfBoundsKill = true;
      var x = this.game.input.x;
      var y = this.game.input.y;
      this.game.physics.arcade.moveToXY(ninjastar, x, y, ninjastar_velocity);

      var actionInfo = {};
      actionInfo.action = 'ninjastar';
      actionInfo.otherId = otherId;
      actionInfo.x = x;
      actionInfo.y = y;
      NetworkManager.onMainPlayerAction(actionInfo);
    }
  },

  drawSwords: function() {
    mySword = me.sprite.addChild(this.game.add.sprite(me.sprite.width-5, me.sprite.height-10, 'sword'));
    otherSword = otherPlayer.sprite.addChild(this.game.add.sprite(otherPlayer.sprite.width-5, otherPlayer.sprite.height-10, 'sword'));

    this.game.physics.arcade.enable(mySword);
    this.game.physics.arcade.enable(otherSword);

    mySword.anchor.set(.5, .8);
    mySword.angle = 55;
    mySword.scale.setTo(.8);

    otherSword.anchor.set(.5, .8);
    otherSword.angle = 55;
    otherSword.scale.setTo(.8);
  },

  updateSword: function(player, action, sword) {
    switch(action) {
      case 'right':
        if(!directionBool) {
          sword.position.x = me.sprite.width-5;
          sword.angle = 55;
          directionBool = true;
        }
        break;
      case 'left':
        if(directionBool) {
          sword.position.x = me.sprite.width-25;
          sword.angle = 305;
          directionBool = false;
        }
        break;
      case 'default':
        break;
    }
  },

  checkNinjaStars: function(group, player, winner) {
    if(this.groups[group].countLiving()) {
      this.groups[group].forEach(function(ninjastar) {
        ninjastar.angle += ninjastar_rotation;
        var posX = ninjastar.position.x;
        var posY = ninjastar.position.y;
        if(posX < (player.sprite.x + player.sprite.width) &&
           posX > (player.sprite.x) &&
           posY > (player.sprite.y) &&
           posY < (player.sprite.y + player.sprite.height)) {
             removeSprite(player.sprite);
             removeSprite(ninjastar);
             win(winner);
        }
      });
    }
  },

  swingSword: function() {
    if(playerDirection == 1) { // right

    }
    else { // left

    }
  }
};

function onOtherPlayerAction1(actionInfo) {
  switch(actionInfo.action) {
    case 'ninjastar':
      var startX;
      var startY = otherPlayer.sprite.position.y + otherPlayer.sprite.height/2;
      if(playerDirection == 1) {
        startX = otherPlayer.sprite.position.x + (playerDirection*otherPlayer.sprite.width);
      }
      else {
        startX = otherPlayer.sprite.position.x;
      }
      var ninjastar = groups['ninjastars2'].create(startX, startY, 'ninjastar');
      game.physics.enable(ninjastar);
      ninjastar.alive = true;
      ninjastar.anchor.setTo(.5, .5);
      game.physics.arcade.moveToXY(ninjastar, actionInfo.x, actionInfo.y, ninjastar_velocity);
      break;
    default:
      console.log('error: no action');
  }
};

function getOtherPlayerId(gameInfo) {
  if(myId == gameInfo.player1) {
    return gameInfo.player2;
  }
  else {
    return gameInfo.player1;
  }
};

function updateOtherPlayer(movementInfo) {
  if(movementInfo.animation == 'right') {
    otherPlayer.sprite.position.x = movementInfo.x;
    otherPlayer.sprite.position.y = movementInfo.y;
    otherPlayer.sprite.animations.play('right');
    otherPlayer.direction = 1;
    PlayState.prototype.updateSword(otherPlayer, 'right', otherSword);
  }
  else if(movementInfo.animation == 'left') {
    otherPlayer.sprite.position.x = movementInfo.x;
    otherPlayer.sprite.position.y = movementInfo.y;
    otherPlayer.sprite.animations.play('left');
    otherPlayer.direction = -1;
    PlayState.prototype.updateSword(otherPlayer, 'left', otherSword);
  }
  else if(movementInfo.animation == 'jump') {
    otherPlayer.sprite.body.velocity.y = -otherPlayer.sprite.jumping_speed;
  }
  else if(movementInfo.animation == 'none') {
    otherPlayer.sprite.body.velocity.x = 0;
    otherPlayer.sprite.animations.stop();
    if(otherPlayer.direction == 1) {
      otherPlayer.sprite.frame = 5;
    }
    else {
      otherPlayer.sprite.frame = 2;
    }
  }
};

function getPlayerInfo(player) {
  var playerInfo = {};
  playerInfo.x = me.sprite.position.x;
  playerInfo.y = me.sprite.position.y;
  playerInfo.animation = me.sprite.animations.name;
  playerInfo.otherId = otherId;
  return playerInfo;
};

function removeSprite(sprite) {
  sprite.destroy();
};

function win(player) {
  winner = player;
  var loser = otherPlayerId(winner);
  keys = {};
  me.game.state.start('GameOver', true, true, winner, loser, myId);
};

function otherPlayerId(winner) {
  if(me.id == winner.id) {
    return otherPlayer;
  }
  else {
    return me;
  }
};

module.exports = PlayState;
