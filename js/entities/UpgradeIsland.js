/**
 * UpgradeIsland - Oyuncunun gemisini yükseltebileceği özel ada
 */
class UpgradeIsland extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'upgrade-island');
        
        // Sahneye ekle ve fizik özelliklerini ayarla
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = statik obje
        
        // Görsel ayarlar
        this.setScale(1.2);
        this.setDepth(5);
        
        // Çarpışma kutusu ayarları
        this.body.setSize(this.width * 0.8, this.height * 0.8);
        
        // Etkileşim bölgesi için bir aura (parıltı) ekle
        this.aura = scene.add.sprite(x, y, 'upgrade-aura')
            .setScale(1.5)
            .setAlpha(0.7)
            .setDepth(4);
            
        // Aura animasyonu
        this.auraAnimation();
        
        // Adanın durumu
        this.isActive = true;
        this.upgradePrice = 50; // Yükseltme için gereken hazine miktarı
        
        // Menü durumu
        this.menuOpen = false;
        
        // Adanın üzerinde bilgi metni (yükseltme için gereken hazine)
        this.infoText = scene.add.text(x, y - 70, 'Yükseltme: ' + this.upgradePrice + ' Altın', {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(6);
        
        // "E" tuşu grafik ipucu
        this.keyHint = scene.add.text(x, y - 40, '[E]', {
            fontSize: '20px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(6).setAlpha(0); // Başlangıçta gizle
        
        // E tuşu dinleyicisi - basit ve net
        this.keyListener = scene.input.keyboard.addKey('E');
    }
    
    // Parıldama animasyonu
    auraAnimation() {
        this.scene.tweens.add({
            targets: this.aura,
            alpha: { from: 0.3, to: 0.7 },
            scale: { from: 1.3, to: 1.6 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
    
    // Ada ile etkileşim
    interact() {
        // Artık bu metodu kullanmıyoruz - tüm etkileşim olay dinleyici üzerinden yapılıyor
    }
    
    // Yükseltme menüsünü aç
    openUpgradeMenu() {
        // Menü zaten açıksa işlem yapma
        if (this.menuOpen) return;
        
        // Menü durumunu güncelle
        this.menuOpen = true;
        
        // Oyun geçici olarak durdurulacak (oyuncu hareketi, düşmanlar vb.)
        this.scene.pauseGame();
        
        // Menü arka planı (yarı saydam)
        const menuBg = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            400,
            400,
            0x333333,
            0.9
        ).setScrollFactor(0).setDepth(100);
        
        // Menü başlığı
        const menuTitle = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 120,
            'GEMİ YÜKSELTMELERİ',
            {
                fontSize: '24px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        
        // Geminin mevcut top seviyesini kontrol et
        const currentCannonLevel = this.scene.player.getCannonLevel();
        const maxCannonLevel = 4;
        
        // Yükseltme seçenekleri
        const options = [
            { text: 'Hız Artışı (+20%)', price: this.upgradePrice, upgrade: 'speed' },
            { text: 'Mermi Hasarı (+10)', price: this.upgradePrice, upgrade: 'damage' },
            { text: 'Can Artışı (+25)', price: this.upgradePrice, upgrade: 'health' }
        ];
        
        // Eğer maksimum top seviyesine ulaşılmadıysa, top yükseltme seçeneğini ekle
        if (currentCannonLevel < maxCannonLevel) {
            const nextLevelText = currentCannonLevel + 1;
            options.push({
                text: `Top Sayısı (${nextLevelText} top)`, 
                price: this.upgradePrice, // Diğer yükseltmelerle aynı fiyatta olsun
                upgrade: 'cannon'
            });
        }
        
        const buttons = [];
        
        // Seçenekleri ekrana ekle
        options.forEach((option, index) => {
            // Buton arka planı
            const buttonBg = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 80 + (index * 60),
                350,
                50,
                this.scene.score >= option.price ? 0x3a7b5c : 0x6b4b45,
                1
            ).setScrollFactor(0).setDepth(101);
            
            // Buton metni
            const buttonText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 80 + (index * 60),
                option.text + ' (' + option.price + ' Altın)',
                {
                    fontSize: '18px',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(102);
            
            // Eğer oyuncunun yeterli hazinesi varsa buton interaktif olsun
            if (this.scene.score >= option.price) {
                buttonBg.setInteractive();
                buttonBg.on('pointerover', () => {
                    buttonBg.setScale(1.05);
                    buttonText.setScale(1.05);
                });
                
                buttonBg.on('pointerout', () => {
                    buttonBg.setScale(1);
                    buttonText.setScale(1);
                });
                
                buttonBg.on('pointerdown', () => {
                    this.applyUpgrade(option.upgrade, option.price);
                    // Menüyü kapat
                    this.closeUpgradeMenu();
                });
            }
            
            buttons.push({ bg: buttonBg, text: buttonText });
        });
        
        // Kapatma butonu - en altta olacak şekilde pozisyon ayarla
        const closeButton = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 + 160,
            150,
            40,
            0x992222,
            1
        ).setScrollFactor(0).setDepth(101).setInteractive();
        
        const closeText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 + 160,
            'KAPAT',
            {
                fontSize: '20px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        
        closeButton.on('pointerover', () => {
            closeButton.setScale(1.05);
            closeText.setScale(1.05);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setScale(1);
            closeText.setScale(1);
        });
        
        closeButton.on('pointerdown', () => {
            this.closeUpgradeMenu();
        });
        
        // Menü elemanlarını sakla
        this.menuElements = {
            bg: menuBg,
            title: menuTitle,
            buttons: buttons,
            closeButton: closeButton,
            closeText: closeText
        };
    }
    
    // Menüyü kapat
    closeUpgradeMenu() {
        // Menü elemanları yoksa işlem yapma
        if (!this.menuElements) return;
        
        // Menü elemanlarını yok et
        this.menuElements.bg.destroy();
        this.menuElements.title.destroy();
        
        this.menuElements.buttons.forEach(button => {
            button.bg.destroy();
            button.text.destroy();
        });
        
        this.menuElements.closeButton.destroy();
        this.menuElements.closeText.destroy();
        
        // Menü elemanlarını temizle
        this.menuElements = null;
        
        // Menü durumunu güncelle
        this.menuOpen = false;
        
        // Oyunu devam ettir
        this.scene.resumeGame();
        
        // Ana menüden yeni oyun başlatırken
        this.scene.add('GameScene', GameScene); // Scene'i yeniden ekle
        this.scene.start('GameScene');          // Yeni oyunu başlat
    }
    
    // Gemi yükseltmelerini uygula
    applyUpgrade(type, price) {
        // Hazineyi düş
        this.scene.score -= price;
        this.scene.scoreText.setText('Altın: ' + this.scene.score);
        
        // Yükseltme efekti
        this.scene.sound.play('upgrade-sound', { volume: 0.7 });
        
        // Gemi parıltısı (yükseltme efekti)
        const glow = this.scene.add.sprite(this.scene.player.x, this.scene.player.y, 'upgrade-glow')
            .setScale(2)
            .setAlpha(0.8)
            .setDepth(10);
            
        this.scene.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 2.5,
            duration: 1000,
            onComplete: () => {
                glow.destroy();
            }
        });
        
        // Yükseltme tipine göre uygulanacak değişiklikler
        switch (type) {
            case 'speed':
                // Gemi hızını artır (%20)
                this.scene.player.upgradeSpeed(1.2);
                console.log("Hız yükseltildi - Yeni hız:", this.scene.player.maxSpeed);
                
                // Bildirim göster
                this.showNotification('Gemi Hızı Artırıldı!');
                break;
                
            case 'damage':
                // Mermi hasarını artır (+10)
                this.scene.player.upgradeDamage(10);
                console.log("Hasar yükseltildi - Yeni hasar:", this.scene.player.cannonDamage);
                
                // Bildirim göster
                this.showNotification('Mermi Hasarı Artırıldı!');
                break;
                
            case 'health':
                // Can artışı (+25)
                this.scene.player.upgradeHealth(25);
                console.log("Can yükseltildi - Yeni maksimum can:", this.scene.player.maxHealth);
                
                // Can çubuğunu güncelle
                this.scene.updateHealthBar();
                
                // Bildirim göster
                this.showNotification('Gemi Dayanıklılığı Artırıldı!');
                break;
                
            case 'cannon':
                // Top sayısını artır
                if (this.scene.player.upgradeCannonLevel()) {
                    const newLevel = this.scene.player.getCannonLevel();
                    console.log("Top seviyesi yükseltildi - Yeni seviye:", newLevel);
                    
                    // Bildirim göster
                    this.showNotification(`Top Sayısı Artırıldı! (${newLevel} Top)`);
                }
                break;
        }
        
        // Yükseltme fiyatını artır
        this.upgradePrice += 25;
        this.infoText.setText('Yükseltme: ' + this.upgradePrice + ' Altın');
    }
    
    // Yükseltme bildirimini göster
    showNotification(message) {
        const notification = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height - 100,
            message,
            {
                fontSize: '20px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Birkaç saniye sonra bildirim kaybolsun
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    notification.destroy();
                }
            });
        });
    }
    
    // Her karede çağrılacak güncelleme metodu
    update() {
        // Oyuncunun var olup olmadığını kontrol et
        if (!this.scene || !this.scene.player || !this.scene.player.active) {
            // Oyuncu yok veya aktif değil - ipucu metni gizle
            if (this.keyHint) {
                this.keyHint.setAlpha(0);
            }
            return;
        }
        
        // Eğer oyuncu yeterince yakınsa E tuşu ipucunu göster
        const player = this.scene.player;
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            player.x, player.y
        );
        
        if (distance < 150 && this.isActive) {
            this.keyHint.setAlpha(1);
            
            // E tuşuna basıldı mı kontrol et
            if (Phaser.Input.Keyboard.JustDown(this.keyListener) && !this.menuOpen) {
                this.openUpgradeMenu();
            }
        } else {
            this.keyHint.setAlpha(0);
        }
    }

    shutdown() {
        // Tüm event listener'ları temizle
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
        
        // Tüm game object'leri temizle
        this.children.removeAll(true);
        
        // Özel değişkenleri sıfırla
        this.ship = null;
        this.enemies = null;
        // ... diğer özel değişkenler
        
        // Fizik sistemini temizle
        this.physics.world.cleanup();
    }

    init() {
        // Tüm değişkenleri başlangıç değerlerine sıfırla
        this.ship = null;
        this.controls = null;
        // ... diğer değişkenler
    }
} 