import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

const { SIZE } = CONFIG;
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
    this.scene.switch("GameScene", { level });
  }

  create() {
    const levels = Koji.config.images.levels;
    const len = levels.length + 1;
    const cols = Math.ceil(Math.sqrt(len));
    const rows = Math.ceil(len / cols);
    const size = Math.floor((SIZE - MARGIN) / cols) - MARGIN;
    console.log(levels, cols, rows, size)

    const color = Koji.config.colors.button.replace("#", "0x");

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const level = i * cols + j;
        if (level >= len)
          break
        const action = level === 0 ? () => this.scene.start("MenuScene") : () => this.scene.start("GameScene", { level: level - 1 });
        const dim = [MARGIN + (MARGIN + size) * j, MARGIN + (MARGIN + size) * i, size, size];
        const text = JSON.parse(window.localStorage.getItem(level)) || level;

        this.add.rectangle(...dim, color).setOrigin(0, 0).setInteractive().on('pointerdown', action);
        this.add.text(dim[0] + size / 2, dim[1] + size / 2, level === 0 ? Koji.config.strings.main_menu : text,
          { fontFamily: Koji.config.strings.font.family, fontSize: '50px', fill: Koji.config.colors.button_font, align: 'center', wordWrap: { width: size - 10 } })
          .setOrigin(0.5, 0.5).setInteractive().on('pointerdown', action);
      }
    }
  }

  update() { }

}