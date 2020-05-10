import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';
import unmuteIcon from '../assets/musicOn.png';
import muteIcon from '../assets/musicOff.png';
import pauseIcon from '../assets/pause.png';

const {SIZE} = CONFIG;

export class MenuScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'MenuScene'
    })
  }

  preload() {

    if (Koji.config.images.background) {
      this.load.image('background', Koji.config.images.background + '?fit=crop&w='+CONFIG.WIDTH+'&h='+CONFIG.HEIGHT);
    }
    document.body.style.backgroundColor = Koji.config.colors.background;

    if (Koji.config.images.logo) {
      this.load.image('logo', Koji.config.images.logo + '?fit=fillmax&w=256&h=256');
    }

    this.load.image('mute', muteIcon);
    this.load.image('unmute', unmuteIcon);
    this.load.image('pause', pauseIcon);


    if (Koji.config.audio.background) {
      this.load.audio('background', Koji.config.audio.background);
    }

    this.load.audio('cut', [Koji.config.audio.cut]);
    this.load.audio('nocut', [Koji.config.audio.nocut]);
    this.load.audio('hit', [Koji.config.audio.hit]);
    this.load.audio('crash', [Koji.config.audio.crash]);
  }

  create() {
    this.scene.launch("UIScene");

    if (Koji.config.images.logo) {
      this.add.image(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, 'logo');
    } else if (Koji.config.strings.title) {
      this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, Koji.config.strings.title, { fontFamily: Koji.config.strings.font.family, fontSize: '100px', fill: Koji.config.colors.font }).setOrigin(0.5,0.5);
    }
    if (Koji.config.strings.play_button) {
      this.graphics = this.add.graphics();
      this.graphics.fillStyle(Koji.config.colors.button.replace("#", "0x"), 1.0);
      this.graphics.fillRect(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+225,CONFIG.WIDTH/2,150)
        .setInteractive(new Phaser.Geom.Rectangle(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+225,CONFIG.WIDTH/2,150), Phaser.Geom.Rectangle.Contains)
        .on('pointerdown', this.start_game, this);
      this.startText = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2+300, Koji.config.strings.play_button, { fontFamily: Koji.config.strings.font.family, fontSize: '75px', fill: Koji.config.colors.button_font });
      this.startText.setOrigin(0.5,0.5);
      this.startText.setInteractive().on('pointerdown', this.start_game, this);
    }

    // audio
    if (Koji.config.audio.background && !this.background_music) {
      this.background_music = this.sound.add('background');
      this.background_music.setVolume(0.8);
      this.background_music.setLoop(true);
      if (!this.background_music.isPlaying)
        this.background_music.play();
    }
    this.game.cut = this.sound.add('cut');
    this.game.nocut = this.sound.add('nocut');
    this.game.hit = this.sound.add('hit');
    this.game.crash = this.sound.add('crash');
  }

  update() {}

  start_game() {
    //this.scene.start("GameScene", {level:0});
    this.scene.start("LevelSelectScene");
  }

}