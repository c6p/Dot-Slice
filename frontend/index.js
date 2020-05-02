import Koji from '@withkoji/vcc';
import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from 'config';
import { MenuScene } from 'scenes/menu';
import { LevelSelectScene } from 'scenes/levelselect';
import { GameScene } from 'scenes/game';
import { UIScene } from 'scenes/ui';

var config = {
  scale: {
        mode: Phaser.Scale.FIT,
        width: CONFIG.WIDTH,
        height: CONFIG.HEIGHT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH
    },
  fps: {
    target: 60
  },
  disableContextMenu: true,
  physics: {
    default: 'matter',
    matter: {
      autoUpdate: false,
      restingThresh: 0.001,
      //enableSleeping: true,
      gravity: {
        x: 0,
        y: 0
      },
      debug: false
      /*debug: {
        showStaticBody: true,
        showBroadphase: true,
        //showCollisions: true,
        showConvexHulls: true,
        //showSleeping: true,
      }*/
    }
  },
  scene: [
    MenuScene,
    LevelSelectScene,
    GameScene,
    UIScene,
  ],
  transparent: true,
}

var WebFont = require('webfontloader');

if (Koji.config.strings.font) {
  WebFont.load({
    google: {
      families: [Koji.config.strings.font.family]
    },
    active: () => {
      
      const style = `url("${Koji.config.images.background}") center center / cover no-repeat fixed`;
      document.body.style.background = style;

      document.getElementById('loading').remove();
      var game = new Phaser.Game(config)
    
    }
  });
}

