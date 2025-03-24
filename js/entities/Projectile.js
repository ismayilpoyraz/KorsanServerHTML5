/**
 * Projectile - Gemi mermileri (gülle)
 */
class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Sahneye ekle ve fiziği etkinleştir
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Mermi özellikleri - sayısal değer olarak ayarla
        this.damage = 10; // Varsayılan hasar değeri (sayısal)
        this.lifespan = 2000; // ms
        this.createTime = scene.time.now;
        
        // Fizik ayarları - Çarpışma kutusu boyutunu arttır
        this.body.setSize(40, 40); // Daha büyük çarpışma boyutu
        this.setScale(0.8); // Biraz daha büyük göster
        
        // Derinlik ayarı (gemilerin altında)
        this.setDepth(8);
        
        // Fizik ayarları
        this.body.setBounce(0);
        this.body.setCollideWorldBounds(true);
        
        // Dönme animasyonu
        scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    update() {
        // Ömrü dolmuşsa yok et
        if (this.scene && this.scene.time.now - this.createTime > this.lifespan) {
            this.destroy();
        }
        
        // Dünya sınırlarına çarparsa yok et
        if (this.scene) {
            const bounds = this.scene.physics.world.bounds;
            if (this.x < bounds.x || this.x > bounds.x + bounds.width ||
                this.y < bounds.y || this.y > bounds.y + bounds.height) {
                this.destroy();
            }
        }
    }
} 