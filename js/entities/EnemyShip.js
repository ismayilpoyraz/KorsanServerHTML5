/**
 * EnemyShip - Düşman gemisi
 */
class EnemyShip extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Sahneye ekle ve fizik özelliklerini ayarla
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Düşman gemisi özellikleri
        this.health = 50;
        this.maxHealth = 50;
        this.maxSpeed = 100; // Oyuncudan daha yavaş olsun
        this.direction = 0; // Bakış yönü
        
        // Benzersiz ID oluştur
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        
        // Saldırı özellikleri
        this.fireRate = 2000; // 2 saniye - oyuncudan daha yavaş ateş etsin
        this.lastFired = 0;
        this.cannonDamage = 10; // Düşman mermileri daha az hasar versin
        this.attackRange = 350; // Bu mesafe içindeyse ateş edebilir
        
        // AI için değişkenler
        this.movementState = 'patrol'; // patrol, chase, flee
        this.patrolTimer = 0;
        this.patrolDelay = 3000; // Her 3 saniyede bir patrolün yönünü değiştir
        this.patrolDirection = new Phaser.Math.Vector2(
            Phaser.Math.Between(-1, 1), 
            Phaser.Math.Between(-1, 1)
        ).normalize();
        
        // Son hareket zamanı - su efekti için
        this.lastMoveTime = 0;
        
        // Fizik ayarlarını yap
        this.body.setDamping(true);
        this.body.setDrag(0.95);
        this.body.setMaxVelocity(this.maxSpeed);
        this.body.setBounce(0.5); // Çarpışmalarda biraz sıçrasın
        
        // Derinlik ayarı
        this.setDepth(10);
        
        // Çarpışma kutusu ayarları
        this.body.setSize(this.width * 0.6, this.height * 0.6);
        this.body.setOffset(this.width * 0.2, this.height * 0.2);
    }
    
    damage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Hasar efekti - kırmızı yanıp sönme
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
        
        // Hasar alındığında küçük bir patlama efekti göster
        const smallExplosion = this.scene.add.sprite(this.x, this.y, 'explosion')
            .setScale(0.5) // Ana geminin patlamasından daha küçük olsun
            .play('explode');
            
        // Animasyon bitince yok et
        smallExplosion.once('animationcomplete', () => {
            smallExplosion.destroy();
        });
        
        // Patlama sesi çal
        this.scene.sound.play('explosion-sound', { volume: 0.3 }); // Ses daha düşük olsun
        
        // Hafif kamera sarsıntısı (oyuncudan daha hafif)
        this.scene.cameras.main.shake(30, 0.005);
        
        if (this.health <= 0) {
            // 'destroy' olayını tetikleyerek emitter temizliğini sağla
            this.emit('destroy');
            // Gemiyi saheden kaldır
            this.destroy();
        } 
        // Sağlık düşükse kaçma davranışına geç
        else if (this.health < this.maxHealth * 0.3) {
            this.movementState = 'flee';
        }
    }
    
    updateAI(player) {
        // Oyuncuyla aradaki mesafeyi hesapla
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            player.x, player.y
        );
        
        // Durum makinesine göre hareket et
        if (this.movementState === 'patrol') {
            this.updatePatrol(player, distance);
        } else if (this.movementState === 'chase') {
            this.updateChase(player, distance);
        } else if (this.movementState === 'flee') {
            this.updateFlee(player, distance);
        }
        
        // Ateş etme kontrolü - belli mesafede ve her durum için
        if (distance < this.attackRange && this.scene.time.now > this.lastFired) {
            this.fire(player);
        }
        
        // Gemi yönünü harekete göre ayarla
        this.updateShipImage();
    }
    
    updatePatrol(player, distance) {
        // Belirli bir süre boyunca rastgele yönde devriye gez
        this.patrolTimer += this.scene.sys.game.loop.delta;
        
        if (this.patrolTimer > this.patrolDelay) {
            // Yeni bir rastgele yön belirle
            this.patrolDirection = new Phaser.Math.Vector2(
                Phaser.Math.Between(-1, 1), 
                Phaser.Math.Between(-1, 1)
            ).normalize();
            
            this.patrolTimer = 0;
        }
        
        // Düşük hızda devriye gez
        const patrolSpeed = this.maxSpeed * 0.5;
        this.body.setVelocity(
            this.patrolDirection.x * patrolSpeed,
            this.patrolDirection.y * patrolSpeed
        );
        
        // Hareket halinde olduğunu kaydet
        this.lastMoveTime = this.scene.time.now;
        
        // Eğer oyuncu yakınsa takip etmeye başla
        if (distance < 400) {
            this.movementState = 'chase';
        }
    }
    
    updateChase(player, distance) {
        // Oyuncuyu bir yere kadar takip et, çok yaklaşınca durup ateş et
        if (distance > 200) {
            // Oyuncuya doğru yönelim vektörü
            const directionToPlayer = new Phaser.Math.Vector2(
                player.x - this.x,
                player.y - this.y
            ).normalize();
            
            // Orta hızda takip et
            const chaseSpeed = this.maxSpeed * 0.8;
            this.body.setVelocity(
                directionToPlayer.x * chaseSpeed,
                directionToPlayer.y * chaseSpeed
            );
            
            // Hareket halinde olduğunu kaydet
            this.lastMoveTime = this.scene.time.now;
            
            // Yönümüzü oyuncuya doğru ayarla
            this.updateDirection(directionToPlayer.x, directionToPlayer.y);
        } else {
            // Çok yaklaşınca dur ve ateş et
            this.body.setVelocity(0, 0);
        }
        
        // Oyuncu çok uzaktaysa devriye moduna geri dön
        if (distance > 600) {
            this.movementState = 'patrol';
        }
    }
    
    updateFlee(player, distance) {
        // Oyuncudan uzaklaş (kaç)
        const directionFromPlayer = new Phaser.Math.Vector2(
            this.x - player.x,
            this.y - player.y
        ).normalize();
        
        // Tam hızda kaç
        this.body.setVelocity(
            directionFromPlayer.x * this.maxSpeed,
            directionFromPlayer.y * this.maxSpeed
        );
        
        // Hareket halinde olduğunu kaydet
        this.lastMoveTime = this.scene.time.now;
        
        // Yönümüzü kaçış yönüne ayarla
        this.updateDirection(directionFromPlayer.x, directionFromPlayer.y);
        
        // Yeterince uzaklaştıysak devriye moduna geri dön
        if (distance > 800) {
            this.movementState = 'patrol';
        }
    }
    
    updateDirection(velX, velY) {
        // Hareket vektörüne göre yönü belirle
        if (Math.abs(velX) > Math.abs(velY)) {
            this.direction = velX < 0 ? 270 : 90; // Yatay hareket baskın
        } else {
            this.direction = velY < 0 ? 0 : 180; // Dikey hareket baskın
        }
    }
    
    setDirection(direction) {
        this.direction = direction;
        this.updateShipImage();
    }
    
    updateShipImage() {
        // Yöne göre doğru animasyonu oynat
        switch (this.direction) {
            case 0: // Yukarı
                this.play('enemy-north', true);
                break;
            case 90: // Sağ
                this.play('enemy-east', true);
                break;
            case 180: // Aşağı
                this.play('enemy-south', true);
                break;
            case 270: // Sol
                this.play('enemy-west', true);
                break;
        }
    }
    
    // Top ateşleme metodu
    fire(player) {
        // Ateş yönünü hesapla (oyuncuya doğru)
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        // Mermi oluştur
        const projectile = this.scene.enemyProjectiles.get();
        
        if (projectile) {
            // Mermiyi geminin konumuna yerleştir
            projectile.setPosition(this.x, this.y);
            
            // Mermiyi oyuncuya doğru yönlendir
            this.scene.physics.velocityFromRotation(angle, 300, projectile.body.velocity);
            
            // Mermiyi aktifleştir
            projectile.setActive(true);
            projectile.setVisible(true);
            projectile.damage = this.cannonDamage; // Mermi hasarını ayarla
            
            // Top atma sesi çal
            this.scene.sound.play('cannon-fire', { volume: 0.1 });
            
            // Son ateş zamanını güncelle
            this.lastFired = this.scene.time.now + this.fireRate;
            
            // Top atınca hareket etmiş gibi son hareket zamanını güncelle
            this.lastMoveTime = this.scene.time.now;
            
            // Düşman gemisinin su efekti emitter'ını kontrol et ve aktifleştir
            if (this.scene.enemyEmitters && this.scene.enemyEmitters.has(this)) {
                const enemyEmitter = this.scene.enemyEmitters.get(this);
                if (enemyEmitter) {
                    // Ateş ettikten sonra tekrar su efektini aktifleştir
                    enemyEmitter.on = true;
                    
                    // Geminin konumunda su efektini oluştur
                    const velX = this.body.velocity.x;
                    const velY = this.body.velocity.y;
                    
                    // Geminin arkasında dalga bırak - hareket yönünün tersine
                    const offsetX = -Math.sign(velX) * 20;
                    const offsetY = -Math.sign(velY) * 20;
                    
                    enemyEmitter.setPosition(this.x + offsetX, this.y + offsetY);
                    
                    // Geminin hızıyla ilişkili olarak parçacık parametrelerini ayarla
                    const speed = Math.sqrt(velX * velX + velY * velY) || 50; // Eğer hız 0 ise varsayılan bir değer kullan
                    
                    enemyEmitter.speedX.min = -speed / 5;
                    enemyEmitter.speedX.max = speed / 5;
                    enemyEmitter.speedY.min = -speed / 5;
                    enemyEmitter.speedY.max = speed / 5;
                    
                    // Emisyon frekansını ayarla
                    enemyEmitter.frequency = Math.max(20, 60 - speed / 3);
                }
            }
        }
    }
    
    // Benzersiz ID'yi döndür
    getId() {
        return this.id;
    }
} 