/**
 * Ship - Oyuncu gemisi
 */
class Ship extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Sahneye ekle ve fiziği etkinleştir
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Gemi özellikleri
        this.maxSpeed = 150;
        this.acceleration = 10;
        this.deceleration = 5;
        this.rotationSpeed = 3;
        
        // Sağlık değerleri
        this.maxHealth = 100;
        this.health = 100;
        
        // Saldırı özellikleri
        this.fireRate = 500; // ms
        this.lastFired = 0;
        this.cannonDamage = 20;
        
        // Çoklu top seviyesi (başlangıçta 1 top)
        this.cannonLevel = 1; // 1, 2, 3 veya 4 top
        
        // Fizik ayarları
        this.body.setDamping(true);
        this.body.setDrag(0.99);
        this.body.setMaxVelocity(this.maxSpeed);
        this.setCollideWorldBounds(true);
        
        // Çarpışmalar için beden boyutunu ayarla - daha kesin çarpışma için
        this.body.setSize(this.width * 0.5, this.height * 0.5);
        this.body.setOffset(this.width * 0.25, this.height * 0.25); // Çarpışma kutusunu merkeze hizala
        this.body.setBounce(0);
        this.body.setImmovable(false);
        this.body.pushable = true;
        
        // Çarpışmaları daha güçlü hale getir
        this.body.useDamping = true;
        this.body.onWorldBounds = true;
        this.body.setCollideWorldBounds(true, 0.5, 0.5); // Ada çarpışmaları için bouncing efekti
        
        // Debug modu - çarpışma kutularını görselleştirme
        // scene.physics.world.createDebugGraphic();
        
        // Derinlik ayarı (adaların üzerinde olacak)
        this.setDepth(10);
        
        // Diğer özellikler
        this.isDead = false; // Gemi öldü mü
        
        // Varsayılan animasyonu oynat
        this.play('player-idle');
        
        // Geminin bakış yönü (0=yukarı, 90=sağ, 180=aşağı, 270=sol)
        this.direction = 0;
    }
    
    update(cursors) {
        // Eğer gemi öldüyse güncelleme yapma
        if (this.isDead) return;
        
        // Hareket kontrolü
        if (cursors.up.isDown) {
            // İleri hareket (geminin baktığı yöne doğru)
            this.scene.physics.velocityFromRotation(
                this.rotation, 
                this.acceleration, 
                this.body.acceleration
            );
        } else if (cursors.down.isDown) {
            // Geri hareket (geminin baktığı yönün tersine)
            this.scene.physics.velocityFromRotation(
                this.rotation,
                -this.acceleration, 
                this.body.acceleration
            );
        } else {
            // Hiçbir yöne tuş basılmıyorsa, ivmeyi sıfırla
            this.body.setAcceleration(0);
        }
        
        // Dönme kontrolü
        if (cursors.left.isDown) {
            this.setAngularVelocity(-this.rotationSpeed * 100);
        } else if (cursors.right.isDown) {
            this.setAngularVelocity(this.rotationSpeed * 100);
        } else {
            this.setAngularVelocity(0);
        }
    }
    
    fire() {
        const time = this.scene.time.now;
        
        // Ateş hızı kontrolü
        if (time > this.lastFired) {
            // En yakın düşmanı bul
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            const enemies = this.scene.enemies.getChildren();
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
            
            // Düşmana doğru açıyı hesapla
            let targetAngle = null;
            if (closestEnemy && closestDistance < 500) {
                targetAngle = Phaser.Math.RadToDeg(
                    Phaser.Math.Angle.Between(this.x, this.y, closestEnemy.x, closestEnemy.y)
                );
                
                // Geminin mevcut yönünü güncelle (mermi için değil, sadece görsel olarak)
                if (targetAngle > -45 && targetAngle <= 45) { // Yukarı
                    this.play('ship-north', true);
                    this.direction = 0;
                } else if (targetAngle > 45 && targetAngle <= 135) { // Sağ
                    this.play('ship-east', true);
                    this.direction = 90;
                } else if (targetAngle > 135 || targetAngle <= -135) { // Aşağı
                    this.play('ship-south', true);
                    this.direction = 180;
                } else { // Sol
                    this.play('ship-west', true);
                    this.direction = 270;
                }
            }
            
            // Seviyeye göre hangi topların ateşleneceğini belirle
            let cannonDirections = [];
            
            switch (this.cannonLevel) {
                case 1: // Tek top - yakın düşman varsa ona doğru, yoksa geminin baktığı yöne
                    cannonDirections = [targetAngle !== null ? targetAngle : this.direction];
                    break;
                    
                case 2: // İki top - ön ve arka
                    if (targetAngle !== null) {
                        // Düşmana doğru ve tam ters yöne
                        cannonDirections = [targetAngle, (targetAngle + 180) % 360];
                    } else {
                        // Normal yönde ve ters yönde
                        cannonDirections = [this.direction, (this.direction + 180) % 360];
                    }
                    break;
                    
                case 3: // Üç top - ön, sağ ve sol
                    if (targetAngle !== null) {
                        // Düşmana doğru ve 90 derece sağ ve sola
                        cannonDirections = [
                            targetAngle, 
                            (targetAngle + 90) % 360, 
                            (targetAngle + 270) % 360
                        ];
                    } else {
                        // Normal yönde ve sağ ve sol yönlerde
                        cannonDirections = [
                            this.direction, 
                            (this.direction + 90) % 360, 
                            (this.direction + 270) % 360
                        ];
                    }
                    break;
                    
                case 4: // Dört top - her yöne
                    if (targetAngle !== null) {
                        // Düşmana doğru ve diğer üç yöne
                        cannonDirections = [
                            targetAngle, 
                            (targetAngle + 90) % 360, 
                            (targetAngle + 180) % 360, 
                            (targetAngle + 270) % 360
                        ];
                    } else {
                        // Dört yöne
                        cannonDirections = [
                            this.direction, 
                            (this.direction + 90) % 360, 
                            (this.direction + 180) % 360, 
                            (this.direction + 270) % 360
                        ];
                    }
                    break;
            }
            
            // Belirlenen yönlere göre ateş et
            let firedCount = 0;
            
            for (const direction of cannonDirections) {
                const projectile = this.scene.projectiles.get();
                
                if (projectile) {
                    // Mermiyi geminin konumuna yerleştir
                    projectile.setPosition(this.x, this.y);
                    
                    // Belirlenen yöne göre mermi hızını ayarla
                    const angle = Phaser.Math.DegToRad(direction);
                    this.scene.physics.velocityFromRotation(angle, 400, projectile.body.velocity);
                    
                    // Mermiyi aktifleştir ve görünür hale getir
                    projectile.setActive(true);
                    projectile.setVisible(true);
                    projectile.setTexture('cannonball'); // Mermi dokusunu ayarla
                    
                    // Mermi hasarını geminin hasar değişkeninden al
                    projectile.damage = this.cannonDamage;
                    
                    // Eğer bu en yakın düşmana doğru atılan bir mermiyse, hedefi kaydet
                    if (targetAngle !== null && Math.abs(direction - targetAngle) < 1 && closestEnemy) {
                        projectile.targetEnemy = closestEnemy;
                    }
                    
                    firedCount++;
                }
            }
            
            // En az bir mermi başarıyla ateşlendiyse ses çal
            if (firedCount > 0) {
                // Top atma sesi çal
                this.scene.sound.play('cannon-fire', { volume: 0.1 });
                
                // Ateş zamanını güncelle
                this.lastFired = time + this.fireRate;
            }
        }
    }
    
    damage(amount) {
        // Eğer gemi zaten öldüyse işlem yapma
        if (this.isDead) return;
        
        // Gemiye hasar ver
        this.health -= amount;
        
        // Hasar aldığında yanıp sönme efekti (soluklaşıp kalmaması için)
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 50,
            ease: 'Linear',
            repeat: 2,
            yoyo: true,
            onComplete: () => {
                // Yanıp sönme bittikten sonra tamamen görünür olduğundan emin ol
                this.alpha = 1;
            }
        });
        
        // Sağlık sıfırın altına düşmesin
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            
            // Geminin kendisini silmek yerine, sadece aktif olmayan duruma getir
            // Böylece GameScene içindeki referanslar bozulmaz
            this.setActive(false);
            this.setVisible(false);
        }
    }
    
    upgradeSpeed(multiplier) {
        this.maxSpeed *= multiplier;
        this.body.setMaxVelocity(this.maxSpeed);
    }
    
    upgradeAcceleration(amount) {
        this.acceleration += amount;
    }
    
    upgradeFireRate(amount) {
        this.fireRate = Math.max(100, this.fireRate - amount);
    }
    
    upgradeDamage(amount) {
        this.cannonDamage += amount;
    }
    
    upgradeHealth(amount) {
        this.maxHealth += amount;
        this.health += amount;
    }
    
    // Çoklu top seviyesi yükseltme metodu
    upgradeCannonLevel() {
        if (this.cannonLevel < 4) {
            this.cannonLevel++;
            return true;
        }
        return false;
    }
    
    // Mevcut top seviyesini döndür
    getCannonLevel() {
        return this.cannonLevel;
    }
} 