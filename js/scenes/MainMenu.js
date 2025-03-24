/**
 * MainMenu Scene - Oyun ana menüsü
 */
class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
        
        // Ses durumu
        this.isSoundOn = true;
    }

    create() {
        // Ses bağlamını başlatmak için gerekli ayarlar
        this.sound.pauseOnBlur = false;
        
        // Kaydedilmiş ses durumunu yükle
        const savedSoundState = localStorage.getItem('isSoundOn');
        if (savedSoundState !== null) {
            this.isSoundOn = savedSoundState === 'true';
            // Ses durumunu hemen uygula
            this.sound.mute = !this.isSoundOn;
        }
        
        // Ses bağlamını başlatmak için kullanıcı etkileşimi bekle
        const resumeAudioContext = () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
        };

        // Tüm etkileşimleri dinle
        this.input.on('pointerdown', resumeAudioContext);
        this.input.keyboard.on('keydown', resumeAudioContext);
        
        // Arka planı oluştur
        this.createBackground();
        
        // Başlığı oluştur
        this.createTitle();
        
        // Menü düğmelerini oluştur
        this.createMenuButtons();
        
        // Ses açma/kapatma butonunu oluştur
        this.createSoundButton();
        
        // Ana menü müziğini başlat
        this.mainTheme = this.sound.add('main-theme', {
            volume: 0.4,
            loop: true
        });
        this.mainTheme.play();
    }
    
    createBackground() {
        // Canvas boyutlarını alalım
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Deniz arka planı (tekrarlanan) - tam ortasından başlatalım
        this.sea = this.add.tileSprite(gameWidth/2, gameHeight/2, gameWidth, gameHeight, 'sea')
            .setOrigin(0.5);
        
        // Rastgele ada görseli seçme fonksiyonu
        const getRandomIsland = () => {
            const islands = ['island', 'island1', 'island2', 'island3'];
            const randomIndex = Phaser.Math.Between(0, islands.length - 1);
            return islands[randomIndex];
        };
        
        // Adaları dengeli dağıtalım ve rastgele görseller kullanarak
        // Sol tarafta bir ada
        this.add.image(gameWidth * 0.2, gameHeight * 0.3, getRandomIsland())
            .setScale(Phaser.Math.FloatBetween(0.5, 0.8));
            
        // Sağ tarafta bir ada
        this.add.image(gameWidth * 0.8, gameHeight * 0.2, getRandomIsland())
            .setScale(Phaser.Math.FloatBetween(0.5, 0.8));
            
        // Alt tarafta bir ada
        this.add.image(gameWidth * 0.7, gameHeight * 0.8, getRandomIsland())
            .setScale(Phaser.Math.FloatBetween(0.5, 0.8));
            
        // Birkaç rastgele ada daha ekleyelim
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(100, gameWidth - 100);
            const y = Phaser.Math.Between(100, gameHeight - 100);
            // Başlık ve düğmelere çok yakın olmasınlar
            if (Math.abs(x - gameWidth/2) > 150 || Math.abs(y - 150) > 100) {
                this.add.image(x, y, getRandomIsland())
                    .setScale(Phaser.Math.FloatBetween(0.3, 0.6))
                    .setDepth(0); // Diğer öğelerin altında göster
            }
        }
    }
    
    createTitle() {
        // Canvas orta noktası
        const centerX = this.cameras.main.width / 2;
        
        // Başlık görüntüsü - orijinal title.png'yi geri getiriyoruz
        this.title = this.add.image(centerX, 150, 'title')
            .setScale(1.5);
            
        // Başlık yazısı (görsel yoksa)
        if (!this.textures.exists('title')) {
            this.title = this.add.text(centerX, 150, 'KORSAN SERVER', {
                font: 'bold 64px Arial',
                fill: '#e38c37',
                stroke: '#000000',
                strokeThickness: 8
            }).setOrigin(0.5);
        }
        
        // Başlık animasyonu
        this.tweens.add({
            targets: this.title,
            y: '+=10',
            duration: 2000,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    createMenuButtons() {
        const centerX = this.cameras.main.width / 2;
        const buttonStyle = {
            font: 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        };

        // Buton arka planları ve metinleri için container'lar oluştur
        const createButton = (y, text) => {
            const container = this.add.container(centerX, y);
            
            // Önce buton metnini oluştur (boyutunu öğrenmek için)
            const buttonText = this.add.text(0, 0, text, buttonStyle)
                .setOrigin(0.5);
            
            // Metin boyutlarına göre arka plan ölçeğini hesapla
            // Yazının etrafında daha fazla boşluk bırakmak için padding'i artırdım
            const padding = { x: 100, y: 40 };
            const buttonWidth = buttonText.width + padding.x * 2;
            const buttonHeight = buttonText.height + padding.y * 2;
            
            // Buton arka plan görseli
            const buttonBg = this.add.image(0, 0, 'button');
            
            // Arka plan görselini metin boyutuna göre ölçekle
            const scaleX = buttonWidth / buttonBg.width;
            const scaleY = buttonHeight / buttonBg.height;
            buttonBg.setScale(scaleX, scaleY);
            
            // Container'a öğeleri ekle
            container.add([buttonBg, buttonText]);
            container.setSize(buttonWidth, buttonHeight);
            container.setInteractive();
            
            // Hover efekti için tween oluştur
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            });
            
            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });
            
            return container;
        };

        // Butonları oluştur ve aralarındaki mesafeyi artır
        const startButton = createButton(300, 'BAŞLA');
        const optionsButton = createButton(450, 'SEÇENEKLER');
        const aboutButton = createButton(600, 'HAKKINDA');

        // Düğme etkileşimleri
        this.setupButtonInteraction(startButton, () => {
            // Önce mevcut GameScene'i tamamen kaldır
            if (this.scene.get('GameScene')) {
                this.scene.remove('GameScene');
            }
            
            // Yeni bir GameScene ekle
            this.scene.add('GameScene', GameScene, false);
            
            // Müziği durdur
            if (this.mainTheme) {
                this.mainTheme.stop();
                this.mainTheme.destroy();
            }
            
            // Ses bağlamını kontrol et ve yeni GameScene'i başlat
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(() => {
                    this.scene.start('GameScene');
                });
            } else {
                this.scene.start('GameScene');
            }
        });

        this.setupButtonInteraction(optionsButton, () => {
            // Seçenekler menüsü
            console.log('Seçenekler menüsü açılacak');
        });

        this.setupButtonInteraction(aboutButton, () => {
            // Hakkında menüsü
            console.log('Hakkında menüsü açılacak');
        });
    }
    
    setupButtonInteraction(button, clickHandler) {
        button.on('pointerover', () => {
            button.setScale(1.1);
        });

        button.on('pointerout', () => {
            button.setScale(1.0);
        });

        button.on('pointerdown', () => {
            // Tıklama sesi çal (eğer ses açıksa)
            if (this.isSoundOn) {
                this.sound.play('button-click', { volume: 0.5 });
            }
            
            // Ses bağlamını kontrol et
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(clickHandler);
            } else {
                clickHandler();
            }
        });
    }

    // Ses açma/kapama butonu oluştur
    createSoundButton() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Buton arka planı (yarı saydam daire)
        this.soundButtonBg = this.add.circle(
            gameWidth - 60, // Sağ kenardan uzaklık
            60, // Üst kenardan uzaklık
            40, // Daire yarıçapı
            0x000000, // Siyah
            0.6 // Yarı saydam
        );
        
        // Ses simgesi (emoji kullanımı)
        const soundIcon = this.isSoundOn ? '🔊' : '🔇';
        
        // Ses butonu metni
        this.soundButton = this.add.text(
            gameWidth - 60, // X pozisyonu
            60, // Y pozisyonu
            soundIcon, // Ses açıksa hoparlör, kapalıysa üstü çizili hoparlör simgesi
            {
                font: '32px Arial',
                fill: '#ffffff' // Beyaz metin
            }
        ).setOrigin(0.5) // Tam ortadan hizala
         .setInteractive();
        
        // Butonun çerçevesi
        this.soundButtonBorder = this.add.graphics();
        this.soundButtonBorder.lineStyle(3, 0xffffff, 0.8); // 3 piksel kalınlığında, beyaz, yarı saydam çizgi
        this.soundButtonBorder.strokeCircle(gameWidth - 60, 60, 40); // Dairenin etrafını çiz
        
        // Buton etkileşimleri
        this.soundButton.on('pointerover', () => {
            this.soundButtonBg.setAlpha(0.8); // Arka planı daha belirgin yap
            this.soundButton.setScale(1.1); // Metni hafifçe büyüt
        });
        
        this.soundButton.on('pointerout', () => {
            this.soundButtonBg.setAlpha(0.6); // Arka planı normale döndür
            this.soundButton.setScale(1.0); // Metni normale döndür
        });
        
        this.soundButton.on('pointerdown', () => {
            this.toggleSound(this.soundButton, this.soundButtonBg);
        });
        
        // Pencere yeniden boyutlandırıldığında butonun pozisyonunu güncelle
        this.scale.on('resize', this.updateSoundButtonPosition, this);
    }
    
    // Sesi aç/kapat
    toggleSound(button, buttonBg) {
        this.isSoundOn = !this.isSoundOn;
        
        // Ses simgesini güncelle
        button.setText(this.isSoundOn ? '🔊' : '🔇');
        
        // Arka plan rengini güncelle
        if (this.isSoundOn) {
            buttonBg.setFillStyle(0x000000, 0.6); // Normal koyu arkaplan
        } else {
            buttonBg.setFillStyle(0x880000, 0.6); // Kırmızımsı arkaplan (ses kapalı)
        }
        
        // Ses açık/kapalı durumunu sisteme bildir
        this.sound.mute = !this.isSoundOn;
        
        // Tıklama sesi çal (eğer ses açıksa)
        if (this.isSoundOn) {
            this.sound.play('button-click', { volume: 0.5 });
        }
        
        // Ses durumunu localStorage'a kaydedelim ki oyun yeniden başladığında hatırlasın
        localStorage.setItem('isSoundOn', this.isSoundOn);
        
        // Basılma efekti
        this.tweens.add({
            targets: button,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true
        });
    }
    
    // Pencere boyutu değiştiğinde buton pozisyonunu güncelle
    updateSoundButtonPosition() {
        if (this.soundButton && this.soundButtonBg && this.soundButtonBorder) {
            const newX = this.cameras.main.width - 60;
            const newY = 60;
            
            // Buton ve simgeyi güncelle
            this.soundButton.setPosition(newX, newY);
            this.soundButtonBg.setPosition(newX, newY);
            
            // Çerçeveyi yeniden çiz
            this.soundButtonBorder.clear();
            this.soundButtonBorder.lineStyle(3, 0xffffff, 0.8);
            this.soundButtonBorder.strokeCircle(newX, newY, 40);
        }
    }
    
    // Sahneden çıkıldığında çalıştırılır
    shutdown() {
        // Ana menü müziğini durdur ve kaynakları temizle
        if (this.mainTheme) {
            this.mainTheme.stop();
            this.mainTheme.destroy();
            this.mainTheme = null;
        }
        
        // Event listener'ları temizle
        this.input.off('pointerdown');
        this.input.keyboard.off('keydown');
        this.scale.off('resize', this.updateSoundButtonPosition, this);
        
        // Tüm butonları ve etkileşimleri temizle
        this.input.removeAllListeners();
    }

    // Sahne tamamen kaldırıldığında çalıştırılır
    destroy() {
        if (this.mainTheme) {
            this.mainTheme.stop();
            this.mainTheme.destroy();
        }
        super.destroy();
    }

    update() {
        // Arka planı hareket ettir
        this.sea.tilePositionX += 0.5;
    }
} 