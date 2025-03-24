/**
 * Treasure - Toplanabilir hazine
 */
class Treasure extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Sahneye ekle ve fiziği etkinleştir
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Hazine özellikleri
        this.value = Phaser.Math.Between(5, 20);
        
        // Fizik ayarları
        this.body.setImmovable(true);
        this.setScale(0.8);
        
        // Derinlik ayarı (adaların üzerinde)
        this.setDepth(6);
        
        // Yüzen animasyon
        this.startFloatingAnimation();
    }
    
    startFloatingAnimation() {
        // Hafifçe yukarı aşağı yüzen animasyon
        this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });
        
        // Parlama efekti
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 1000,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    collect() {
        // Toplama animasyonu
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Back.In',
            onComplete: () => {
                this.destroy();
            }
        });
    }
} 