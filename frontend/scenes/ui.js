import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

const { SIZE } = CONFIG;

export class UIScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'UIScene'
    })
  }

  preload() { }

  create() {
    const color = Koji.config.colors.button.replace("#", "0x");
    const font_color = Koji.config.colors.button_font.replace("#", "0x");

    // slices
    this.game.slices = this.add.text(50, 1050, "", { fontFamily: Koji.config.strings.font.family, fontSize: '50px', fill: Koji.config.colors.button_font })
      .setOrigin(0, 0.5);
    // progress bar
    const bg = this.add.rectangle(0, 0, CONFIG.WIDTH, 40, 0x666666).setOrigin(0, 0);
    this.game.progress = this.add.rectangle(0, 0, CONFIG.WIDTH, 40, color).setOrigin(0, 0);
    this.game.target = this.add.rectangle(0, 0, 10, 40, font_color).setOrigin(0.5, 0);
    this.game.progressBar = this.add.group([bg, this.game.progress, this.game.target, this.game.slices]).setVisible(false);

    // pause menu
    const menu = [
      { text: Koji.config.strings.resume, action: this.resume_game, size: 100 },
      { text: Koji.config.strings.restart, action: this.restart_level, size: 70 },
      { text: Koji.config.strings.select_level, action: this.select_level, size: 75 },
    ]
    const mask = this.add.rectangle(0, 0, SIZE, SIZE, 0x000000, 0.7).setOrigin(0, 0);
    this.game.pauseMenu = this.add.group([mask]);
    for (let i = 0; i < menu.length; i++) {
      const dim = [190, 300 + 170 * i, 700, 150];
      const rect = this.add.rectangle(...dim, color).setOrigin(0, 0).setInteractive().on('pointerdown', menu[i].action, this);
      const text = this.add.text(dim[0] + 350, dim[1] + 75, menu[i].text, { fontFamily: Koji.config.strings.font.family, fontSize: menu[i].size + 'px', fill: Koji.config.colors.button_font })
        .setOrigin(0.5, 0.5).setInteractive().on('pointerdown', menu[i].action, this);
      this.game.pauseMenu.addMultiple([rect, text]);
    }
    this.game.pauseMenu.setVisible(false);
    this.game.pause = this.add.image(CONFIG.UI_ICON_PADDING, CONFIG.UI_ICON_PADDING, 'pause').setOrigin(0, 0).setInteractive().on('pointerdown', this.pause_menu, this).setVisible(false);

    // win menu
    const winText = this.add.text(SIZE / 2, 250, Koji.config.strings.win, { fontFamily: Koji.config.strings.font.family, fontSize: '96px', fill: Koji.config.colors.button_font }).setOrigin(0.5)
    this.game.areaText = this.add.text(SIZE / 2, 450, "", { fontFamily: Koji.config.strings.font.family, fontSize: '96px', fill: Koji.config.colors.button_font }).setOrigin(0.5)
    this.game.slicesText = this.add.text(SIZE / 2, 600, "", { fontFamily: Koji.config.strings.font.family, fontSize: '96px', fill: Koji.config.colors.button_font }).setOrigin(0.5)
    const rect = this.add.rectangle(190, 800, 700, 150, color).setOrigin(0, 0).setInteractive().on('pointerdown', this.select_level, this);
    const text = this.add.text(SIZE / 2, 875, "Select Level", { fontFamily: Koji.config.strings.font.family, fontSize: '75px', fill: Koji.config.colors.button_font })
      .setOrigin(0.5, 0.5).setInteractive().on('pointerdown', this.select_level, this);
    this.game.winMenu = this.add.group([mask, winText, this.game.slicesText, this.game.areaText, rect, text]).setVisible(false);

    // audio
    this.unmute = this.add.image(CONFIG.WIDTH - CONFIG.UI_ICON_SIZE - CONFIG.UI_ICON_PADDING, CONFIG.UI_ICON_PADDING, 'unmute').setOrigin(1, 0).setInteractive().on('pointerdown', this.toggleMute, this);
    this.mute = this.add.image(CONFIG.WIDTH - CONFIG.UI_ICON_SIZE - CONFIG.UI_ICON_PADDING, CONFIG.UI_ICON_PADDING, 'mute').setOrigin(1, 0).setInteractive().on('pointerdown', this.toggleMute, this).setTint(Koji.config.colors.button.replace("#", "0x"));
    if (this.game.sound.mute) {
      this.unmute.setAlpha(0);
    } else {
      this.mute.setAlpha(0);
    }
  }

  update() { }

  pause_menu() {
    this.scene.pause("GameScene");
    this.game.winMenu.setVisible(false);
    this.game.pauseMenu.setVisible(true);
  }

  resume_game() {
    this.game.pauseMenu.setVisible(false);
    this.scene.resume("GameScene");
  }

  restart_level() {
    this.game.pauseMenu.setVisible(false);
    this.scene.launch("GameScene");
  }

  select_level() {
    this.game.pauseMenu.setVisible(false);
    this.game.winMenu.setVisible(false);
    this.game.pause.setVisible(false);
    this.game.progressBar.setVisible(false);
    this.scene.stop("GameScene");
    this.scene.launch("LevelSelectScene");
  }

  toggleMute() {
    this.game.sound.mute = !this.game.sound.mute
    if (this.game.sound.mute) {
      this.unmute.setAlpha(0);
      this.mute.setAlpha(1);
    } else {
      this.mute.setAlpha(0);
      this.unmute.setAlpha(1);
    }
  }
}