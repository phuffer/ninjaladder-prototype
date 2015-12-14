(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
require.register("client/game", function(exports, require, module) {
"use strict";

var gameBootstrapper = {
    init: function(gameContainerElementId){

        var game = new Phaser.Game(800, 600, Phaser.AUTO, gameContainerElementId);

        game.state.add('MainMenu', require('./states/MainMenu'));
        game.state.add('ControlsMenu', require('./states/ControlsMenu'));
        game.state.add('LoadingState', require('./states/LoadingState'));
        game.state.add('PlayState', require('./states/PlayState'));
        game.state.add('GameOver', require('./states/GameOver'));

        game.state.start('MainMenu');
    }
};

module.exports = gameBootstrapper;

});

require.register("client/objects/PlayerObject", function(exports, require, module) {
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

});

require.register("client/sprites/PlayerSprite", function(exports, require, module) {
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

});

require.register("client/states/ControlsMenu", function(exports, require, module) {
'use strict';

function ControlsMenu() {}

ControlsMenu.prototype = {
  preload: function() {
    this.load.image('controls', 'images/buttons/Controls.png');
    this.load.image('backBtn', 'images/buttons/BackButton.png');
  },

  create: function() {
    var me = this;

    var btnX = this.game.world.centerX;
    var btnY = this.game.world.centerY;

    // add controls menu
    var controls = this.game.add.sprite(btnX, btnY - 25, 'controls');
    controls.anchor.set(0.5);
    controls.inputEnabled = true;

    // add back button
    var backBtn = this.game.add.sprite(btnX, btnY + 255, 'backBtn');
    backBtn.anchor.set(0.5);
    backBtn.inputEnabled = true;
    backBtn.events.onInputDown.add(returnToMenu, this);

    function returnToMenu() {
      me.game.state.start('MainMenu');
    }
  }
}

module.exports = ControlsMenu;

});

require.register("client/states/GameOver", function(exports, require, module) {
'use strict';

function GameOver() {}

GameOver.prototype = {
  init: function(winner, loser, myId) {
    this.winnerId = winner.id;
    this.loserId = loser.id;
    this.myId = myId;
  },

  preload: function() {
    this.load.image('playAgainBtn', 'images/buttons/PlayAgainButton.png');
    this.load.image('mainMenuBtn', 'images/buttons/MainMenuButton.png')
  },

  create: function() {
    var text;
    if(this.winnerId == this.myId) {
      text = 'You Win!';
    }
    else {
      text = 'You Lose!';
    }

    var gameOverText = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 200, text);
    gameOverText.anchor.set(0.5);
    gameOverText.align = 'center';
    gameOverText.font = 'Arial';
    gameOverText.fontWeight = 'bold';
    gameOverText.fontSize = 70;
    gameOverText.fill = 'black';
    gameOverText.setShadow(5, 5, 'rgb(68, 68, 68)', 5)

    // Start x and y positions for menu buttons
    var btnX = this.game.world.centerX;
    var btnY = this.game.world.centerY - 20;

    // Add play again button
    var playAgainBtn = this.game.add.sprite(btnX, btnY - 10, 'playAgainBtn');
    playAgainBtn.anchor.set(0.5);
    playAgainBtn.inputEnabled = true;
    playAgainBtn.events.onInputDown.add(playAgain, this);
    playAgainBtn.alpha = 0.75;

    // Add return to main menu button
    var mainMenuBtn = this.game.add.sprite(btnX, btnY + 45, 'mainMenuBtn');
    mainMenuBtn.anchor.set(0.5);
    mainMenuBtn.inputEnabled = true;
    mainMenuBtn.events.onInputDown.add(returnToMainMenu, this);

    function playAgain() {
      // this.game.state.start('LoadingState');
    }

    function returnToMainMenu() {
      this.game.state.start('MainMenu', true, true, false);
    }
  }
};

module.exports = GameOver;

});

require.register("client/states/LoadingState", function(exports, require, module) {
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

});

require.register("client/states/MainMenu", function(exports, require, module) {
'use strict';

var MenuCreator = require('client/utils/MenuCreator');

var nickNameInput;
var eleToRemove = [];

function MainMenu() {}

MainMenu.prototype = {
  preload: function() {
    this.load.image('playBtn', 'images/buttons/PlayButton.png');
    this.load.image('controlsBtn', 'images/buttons/ControlsButton.png');
    this.load.image('settingsBtn', 'images/buttons/SettingButton.png');
    this.load.image('loginBtn', 'images/buttons/LoginButton.png');
    this.load.image('registerBtn', 'images/buttons/RegisterButton.png');
  },

  create: function() {
    this.game.stage.backgroundColor = 0x009933;

    this.game.stage.disableVisibilityChange = true;

    //this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    MenuCreator.init(this.game);
    this.showMainMenu();
  },

  showMainMenu: function() {
    var me = this;

    // Create Ninja Ladder main menu title
    var title = 'Ninja Ladder';
    var title = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 200, title);
    title.anchor.set(0.5);
    title.align = 'center';
    title.font = 'Arial';
    title.fontWeight = 'bold';
    title.fontSize = 70;
    title.fill = 'black';
    title.setShadow(5, 5, 'rgb(68, 68, 68)', 5);

    // Create nickname text input
    var panel = MenuCreator.mediumPanel(180, 120, 'game-login-panel');
    var form = MenuCreator.form(playGame);
    var blockInput = MenuCreator.inputBlock();
    nickNameInput = MenuCreator.inputWithLabel(blockInput, '', 100, 200);
    nickNameInput.x = 500;
    form.appendChild(blockInput);
    panel.appendChild(form);

    eleToRemove.push(panel);

    // Start x and y positions for menu buttons
    var btnX = this.game.world.centerX;
    var btnY = this.game.world.centerY - 20;

    // Add play button
    var playBtn = this.game.add.sprite(btnX, btnY - 10, 'playBtn');
    playBtn.anchor.set(0.5);
    playBtn.inputEnabled = true;
    playBtn.events.onInputDown.add(playGame, this);

    // Add controls button
    var controlsBtn = this.game.add.sprite(btnX, btnY + 45, 'controlsBtn');
    controlsBtn.anchor.set(0.5);
    controlsBtn.inputEnabled = true;
    controlsBtn.events.onInputDown.add(controlsMenu, this);

    // Add settings button;
    var settingsBtn = this.game.add.sprite(btnX, btnY + 100, 'settingsBtn');
    settingsBtn.anchor.set(0.5);
    settingsBtn.alpha = 0.75;

    // Add login button
    var loginBtn = this.game.add.sprite(btnX, btnY + 170, 'loginBtn');
    loginBtn.anchor.set(0.5);
    loginBtn.alpha = 0.75;

    // Add register button
    var registerBtn = this.game.add.sprite(btnX, btnY + 225, 'registerBtn');
    registerBtn.anchor.set(0.5);
    registerBtn.alpha = 0.75;

    function playGame(){
      me.game.mainPlayerName = nickNameInput.value;
      if(me.game.mainPlayerName){
        me.cleanElements();
        me.game.state.start('LoadingState');
      }
      else {
        var title = 'Please enter a name';
        var title = this.game.add.text(this.game.world.centerX, this.game.world.centerY + 270, title);
        title.anchor.set(0.5);
        title.align = 'center';
        title.font = 'Arial';
        title.fontSize = 20;
        title.fill = 'red';
      }
      nickNameInput.value = '';
    }

    function controlsMenu() {
      me.cleanElements();
      me.game.state.start('ControlsMenu');
    }
  },

  cleanElements: function() {
    for(var i = 0, max = eleToRemove.length; i < max; i++){
      eleToRemove[i].remove();
    }
  }
};

module.exports = MainMenu;

});

require.register("client/states/PlayState", function(exports, require, module) {
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

});

require.register("client/utils/MatchMakerManager", function(exports, require, module) {
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

});

require.register("client/utils/MenuCreator", function(exports, require, module) {
'use strict';

var containerElement, verticalOffset = 0, horizontalOffset = 0;

function getY(y){
    return y - verticalOffset;
}

function getX(x){
    return x - horizontalOffset;
}


module.exports = {
    init: function(game){
        containerElement = document.getElementById(game.parent);
        verticalOffset = game.height;
    },

    mediumPanel: function (x, y, cssClass){
        if(!cssClass){
            cssClass = '';
        }
        var panel = document.createElement('div');
        panel.className = 'gui-panel gui-panel-medium ' + cssClass;
        panel.style.left = getX(x) + 'px';
        panel.style.top = getY(y) + 'px';

        containerElement.appendChild(panel);

        return panel;
    },

    form: function(onSaveCallback){
        var form = document.createElement('form');
        form.onsubmit= function(){
            onSaveCallback();

            return false;
        };

        return form;
    },

    inputBlock: function(){
        var blockInput = document.createElement('div');
        blockInput.className='game-input-block';
        return blockInput;
    },

    inputWithLabel: function(parent, label, x, y){
        var nameLabel = document.createElement('div');
        nameLabel.className='game-gui-label';
        nameLabel.innerHTML = label;


        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'game-gui-input';
        nameInput.placeholder = 'name';

        parent.appendChild(nameLabel);
        parent.appendChild(nameInput);

        return nameInput;
    },

    // createButton: function(label, cssClass){
    //     var button = document.createElement('button');
    //     button.className = cssClass;
    //
    //     button.innerHTML = label;
    //     return button;
    // }
};

});

require.register("client/utils/NetworkManager", function(exports, require, module) {
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

});


//# sourceMappingURL=client.js.map