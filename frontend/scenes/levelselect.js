import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

const {SIZE} = CONFIG;
const MARGIN = 16;

export class LevelSelectScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'LevelSelectScene'
    })
  }

  preload() { }


  main_menu() {
    this.scene.switch("MenuScene");
  }
 
  start_level(level) {
    this.scene.switch("GameScene", {level});
  }

  create() {
    const levels = Koji.config.images.levels;
    const len = levels.length + 1;
    const cols = Math.ceil(Math.sqrt(len));
    const rows = Math.ceil(len / cols);
    const size = Math.floor((SIZE-MARGIN) / cols) - MARGIN;
    console.log(levels, cols, rows, size)

    //this.graphics = this.add.graphics();
    //this.graphics.fillStyle(Koji.config.colors.button.replace("#", "0x"), 1.0);
    const color = Koji.config.colors.button.replace("#", "0x");

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const level = i*cols+j;
        if (level >= len)
          break
        const action = level === 0 ? () => this.scene.start("MenuScene") : () => this.scene.start("GameScene", {level: level-1});
        const dim = [MARGIN+(MARGIN+size) * j, MARGIN+(MARGIN+size) * i, size, size];
        const text = JSON.parse(window.localStorage.getItem(level)) || level;
        //this.graphics.fillRect(...dim)
        //  .setInteractive(new Phaser.Geom.Rectangle(...dim), Phaser.Geom.Rectangle.Contains)
        this.add.rectangle(...dim, color).setOrigin(0,0).setInteractive().on('pointerdown', action);
        this.add.text(dim[0]+size/2, dim[1]+size/2, level===0 ? Koji.config.strings.main_menu : text,
          { fontFamily: Koji.config.strings.font.family, fontSize: '50px', fill: Koji.config.colors.button_font, align:'center', wordWrap: {width: size-10} })
          .setOrigin(0.5,0.5).setInteractive().on('pointerdown', action);
      }
    }


   /* if (Koji.config.images.logo) {
      this.add.image(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, 'logo');
    } else if (Koji.config.strings.title) {
      this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, Koji.config.strings.title, { fontFamily: Koji.config.strings.font.family, fontSize: '60px', fill: Koji.config.colors.font }).setOrigin(0.5,0.5);
    }
    if (Koji.config.strings.play_button) {
      this.graphics = this.add.graphics();
      this.graphics.fillStyle(Koji.config.colors.button.replace("#", "0x"), 1.0);
      this.graphics.fillRoundedRect(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+275,CONFIG.WIDTH/2,50)
        .setInteractive(new Phaser.Geom.Rectangle(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+275,CONFIG.WIDTH/2,50), Phaser.Geom.Rectangle.Contains)
        .on('pointerdown', this.start_game, this);
      this.startText = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2+300, Koji.config.strings.play_button, { fontFamily: Koji.config.strings.font.family, fontSize: '30px', fill: Koji.config.colors.button_font });
      this.startText.setOrigin(0.5,0.5);
      this.startText.setInteractive().on('pointerdown', this.start_game, this);
    }*/

  }

  update() {}

}