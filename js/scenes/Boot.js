/**
 * Boot Scene - Oyun başlangıcı için temel ayarları yükler
 */
class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Yükleme göstergesi için gerekli görseller
        this.load.image('loadingBar', 'assets/images/loading-bar.png');
        this.load.image('loadingFrame', 'assets/images/loading-frame.png');
    }

    create() {
        // Bir sonraki sahneye geçiş
        this.scene.start('Preload');
    }
} 