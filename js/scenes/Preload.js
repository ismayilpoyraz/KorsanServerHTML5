/**
 * Preload Scene - Oyun varlıklarını yükler
 */
class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Yükleme ekranı
        this.createLoadingBar();
        
        // Oyun logosu
        this.load.image('title', 'assets/images/title.png');
        
        // Oyuncu gemisi
        this.load.spritesheet('player-ship', 'assets/images/player-ship.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        // Düşman gemisi
        this.load.spritesheet('enemy-ship', 'assets/images/enemy-ship.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        // Yükseltme adası ve efektleri
        this.load.image('upgrade-island', 'assets/images/upgrade-island.png');
        this.load.image('upgrade-aura', 'assets/images/upgrade-aura.png');
        this.load.image('upgrade-glow', 'assets/images/upgrade-glow.png');
        
        // Arka plan ve harita öğeleri
        this.load.image('sea', 'assets/images/sea.png');
        this.load.image('island', 'assets/images/island.png');
        
        // Yeni ada görselleri
        this.load.image('island1', 'assets/images/island1.png');
        this.load.image('island2', 'assets/images/island2.png');
        this.load.image('island3', 'assets/images/island3.png');
        
        // Can yükseltme kutusu
        this.load.image('health-box', 'assets/images/can.png');
        
        this.load.image('cannonball', 'assets/images/cannonball.png');
        this.load.image('treasure', 'assets/images/treasure.png');
        
        // Su dalgacıkları efekti için
        this.load.image('water-particle', 'assets/images/water-particle.png');
        
        // Patlama animasyonu
        this.load.spritesheet('explosion', 'assets/images/explosion.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        // Ses dosyaları
        this.load.audio('cannon-fire', 'assets/audio/cannon-fire.mp3');
        this.load.audio('explosion-sound', 'assets/audio/explosion-sound.mp3');
        this.load.audio('collect-treasure', 'assets/audio/collect-treasure.mp3');
        this.load.audio('carpma', 'assets/audio/carpma.mp3');
        this.load.audio('upgrade-sound', 'assets/audio/upgrade-sound.mp3');
        this.load.audio('button-click', 'assets/audio/button-click.mp3');
        this.load.audio('can-sound', 'assets/audio/can.mp3');
        
        // Oyun müzikleri
        this.load.audio('main-theme', 'assets/audio/main-theme.mp3');
        this.load.audio('battle-theme', 'assets/audio/battle-theme.mp3');
        
        // Butonlar
        this.load.image('button', 'assets/images/button.png');
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Yükleniyor...', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x0094ff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 5, 300 * value, 20);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    create() {
        // Animasyonları oluştur
        this.createAnimations();
        
        // Ana menüye geçiş
        this.scene.start('MainMenu');
    }
    
    createAnimations() {
        // Oyuncu gemisi animasyonları
        this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player-ship', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Düşman gemisi animasyonları
        this.anims.create({
            key: 'enemy-idle',
            frames: this.anims.generateFrameNumbers('enemy-ship', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        // Patlama animasyonu
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: 0
        });
    }
} 