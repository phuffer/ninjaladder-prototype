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
