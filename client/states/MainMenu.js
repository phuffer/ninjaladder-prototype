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
