import * as PIXI from 'pixi.js';

export class SoundManager {
    private backgroundMusic: PIXI.sound.Sound;
    private soundEffects: { [key: string]: PIXI.sound.Sound };

    constructor() {
        this.soundEffects = {};
        this.loadSounds();
    }

    private loadSounds(): void {
        // Load background music
        this.backgroundMusic = PIXI.sound.Sound.from('assets/audio/music/background.mp3');

        // Load sound effects
        this.soundEffects['spin'] = PIXI.sound.Sound.from('assets/audio/sfx/spins/spin.mp3');
        this.soundEffects['win'] = PIXI.sound.Sound.from('assets/audio/sfx/wins/win.mp3');
        this.soundEffects['evolution'] = PIXI.sound.Sound.from('assets/audio/sfx/evolutions/evolution.mp3');
        this.soundEffects['bonus'] = PIXI.sound.Sound.from('assets/audio/sfx/bonuses/bonus.mp3');
    }

    public playBackgroundMusic(): void {
        this.backgroundMusic.play({ loop: true });
    }

    public stopBackgroundMusic(): void {
        this.backgroundMusic.stop();
    }

    public playSoundEffect(effectName: string): void {
        const sound = this.soundEffects[effectName];
        if (sound) {
            sound.play();
        }
    }
}