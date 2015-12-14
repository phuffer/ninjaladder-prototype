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
