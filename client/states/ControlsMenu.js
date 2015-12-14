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
