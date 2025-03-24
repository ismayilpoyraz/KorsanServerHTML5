/**
 * HealthBox - Oyuncunun canını artıran kutu
 */
class HealthBox extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Sahneye ekle ve fiziği etkinleştir
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Görsel ayarlar
        this.setScale(0.6); // Boyut ayarı
        this.setDepth(8); // Adalardan yukarıda, gemilerden aşağıda olsun
        
        // Fizik ayarları
        this.body.setCircle(this.width / 2.5); // Çarpışma alanını daire olarak ayarla
        this.body.setOffset(this.width / 2 - this.width / 2.5, this.width / 2 - this.width / 2.5);
        this.body.setBounce(0);
        this.body.setImmovable(true);
        
        // Yüzen hissi oluşturmak için animasyon
        this.floatingAnimation();
        
        // Can yükseltme miktarı
        this.healthAmount = 25; // Her kutu 25 can yükseltir
    }
    
    // Kutuların hafifçe yukarı-aşağı hareket etmesi için animasyon
    floatingAnimation() {
        this.scene.tweens.add({
            targets: this,
            y: this.y + 10, // 10 birim aşağı
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true, // Geri-dön animasyonu
            repeat: -1 // Sürekli tekrarla
        });
    }
    
    // Kutuyu topla
    collect() {
        // Toplama animasyonu
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });
    }
    
    update() {
        // Gerekirse güncelleme fonksiyonları buraya eklenebilir
    }
} 