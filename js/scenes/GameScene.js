/**
 * GameScene - Ana oyun sahnesi
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        // Oyun durumu
        this.score = 0;
        this.gameOver = false;
        
        // Çarpma sesi için zamanlayıcı
        this.lastCollisionSound = 0;
        this.collisionSoundDelay = 500; // 500ms minimum bekleme süresi
        
        // Hazine toplama sesi için zamanlayıcı
        this.lastTreasureSound = 0;
        this.treasureSoundDelay = 500; // 500ms minimum bekleme süresi
        
        // Can kutusu toplama sesi için zamanlayıcı
        this.lastHealthBoxSound = 0;
        this.healthBoxSoundDelay = 500; // 500ms minimum bekleme süresi
        
        // Oyunu durdur (menüler için)
        this.gamePaused = false;
        
        // Ses durumu - localStorage'dan al
        const savedSoundState = localStorage.getItem('isSoundOn');
        this.isSoundOn = savedSoundState !== null ? savedSoundState === 'true' : true;
    }

    create() {
        // Ses bağlamını kullanıcı etkileşiminden sonra başlat
        this.sound.pauseOnBlur = false;
        
        // Önceden kaydedilmiş ses durumunu uygula
        this.sound.mute = !this.isSoundOn;
        
        // Dünya sınırları (oyun dünyası kamera görüş alanından büyük olacak)
        this.physics.world.setBounds(0, 0, 3000, 3000);
        
        // Debug modu - çarpışma kutularını göster (gerekirse aç)
        // this.physics.world.createDebugGraphic();
        // this.physics.world.drawDebug = true;
        
        // Arka plan
        this.createBackground();
        
        // Su efekti için parçacık efektlerini oluştur
        this.createWaterParticles();
        
        // Oyun öğelerini oluştur
        this.createGameObjects();
        
        // Yükseltme adası oluştur
        this.createUpgradeIsland();
        
        // Arayüz
        this.createUI();
        
        // Ses açma/kapama butonu
        this.createSoundButton();
        
        // Mobil kontroller
        this.createMobileControls();
        
        // Kontroller
        this.setupInput();
        
        // Müziği başlat
        this.sound.play('battle-theme', {
            volume: 0.2,
            loop: true
        });
        
        // Kamerayı oyuncuya bağla
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, 3000, 3000);
        
        // Düşman oluşturucu
        this.setupEnemySpawner();
        
        // Hazine oluşturucu
        this.setupTreasureSpawner();
        
        // Can kutusu oluşturucu
        this.setupHealthBoxSpawner();
        
        // Çarpışma algılayıcıları
        this.setupCollisions();
        
        // Geminin farklı yönleri için animasyonları tanımla
        this.anims.create({
            key: 'ship-north', // Yukarı yön (kuzey)
            frames: [{ key: 'player-ship', frame: 3 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'ship-east', // Sağ yön (doğu)
            frames: [{ key: 'player-ship', frame: 1 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'ship-south', // Aşağı yön (güney)
            frames: [{ key: 'player-ship', frame: 0 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'ship-west', // Sol yön (batı)
            frames: [{ key: 'player-ship', frame: 2 }],
            frameRate: 1
        });
        
        // Düşman gemisi için animasyonları tanımla
        this.anims.create({
            key: 'enemy-east', // Sağ yön (doğu)
            frames: [{ key: 'enemy-ship', frame: 0 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'enemy-west', // Sol yön (batı)
            frames: [{ key: 'enemy-ship', frame: 1 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'enemy-north', // Yukarı yön (kuzey)
            frames: [{ key: 'enemy-ship', frame: 2 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'enemy-south', // Aşağı yön (güney)
            frames: [{ key: 'enemy-ship', frame: 0 }],
            frameRate: 1
        });
        
        // Oyun durumu
        this.gamePaused = false;
    }
    
    createBackground() {
        // Deniz arka planı (tekrarlanan doku)
        this.seaTile = this.add.tileSprite(0, 0, 3000, 3000, 'sea')
            .setOrigin(0, 0);
            
        // Dalga animasyonu için değişkenler
        this.waveOffset = 0; // Dalga animasyonu için offset
        this.waveSpeed = 0.2; // Dalga hızı
            
        // Adaları statik grup olarak oluştur (fizik motoru tarafından yok edilemez)
        this.islands = this.physics.add.staticGroup();
        
        // Rastgele ada görseli seçme fonksiyonu
        const getRandomIsland = () => {
            const islands = ['island', 'island1', 'island2', 'island3'];
            const randomIndex = Phaser.Math.Between(0, islands.length - 1);
            return islands[randomIndex];
        };
        
        // Adalar (rastgele dağılmış)
        const islandPositions = []; // Oluşturulan adaların konumlarını takip et
        
        for (let i = 0; i < 15; i++) {
            let x, y, tooClose;
            let tries = 0;
            const maxTries = 50; // Maksimum deneme sayısı
            
            // Diğer adalara çok yakın olmayan bir konum bul
            do {
                tooClose = false;
                x = Phaser.Math.Between(100, 2900);
                y = Phaser.Math.Between(100, 2900);
                
                // Önceki adaların konumlarıyla karşılaştır
                for (let j = 0; j < islandPositions.length; j++) {
                    const pos = islandPositions[j];
                    const dist = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
                    
                    // Minimum 300 birim uzaklık olmalı
                    if (dist < 300) {
                        tooClose = true;
                        break;
                    }
                }
                
                tries++;
            } while (tooClose && tries < maxTries);
            
            // Eğer uygun konum bulunamadıysa, bu adayı atla
            if (tries >= maxTries) continue;
            
            // Ada boyutu
            const scale = Phaser.Math.FloatBetween(0.8, 2);
            
            // Rastgele bir ada görseli seç
            const islandTexture = getRandomIsland();
            
            // Ada oluştur ve statik gruba ekle
            const island = this.islands.create(x, y, islandTexture);
            island.setScale(scale);
            island.refreshBody(); // Fizik gövdesini yenile
            
            // Adanın çarpışma alanını adanın tamamına yakın ayarla
            island.body.setSize(island.width * 0.95, island.height * 0.95);
            
            // Derinlik ayarı
            island.setDepth(5);
            
            // Konumu listeye ekle
            islandPositions.push({ x, y, radius: island.width * scale * 0.5 });
        }
        
        // Ada konumlarını daha sonra kullanmak için sakla
        this.islandPositions = islandPositions;
    }
    
    createWaterParticles() {
        // Su dalga efekti için parçacık sistemi oluştur
        this.waterParticles = this.add.particles('water-particle'); // Su dalgacığı dokusunu kullan
        
        // Oyuncu gemisi su efekti
        this.playerWaterEmitter = this.waterParticles.createEmitter({
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            speedX: { min: -20, max: 20 },
            speedY: { min: -20, max: 20 },
            quantity: 1,
            frequency: 40, // Her 40ms'de bir parçacık
            on: false, // Başlangıçta kapalı
            tint: 0xffffff, // Beyaz renk
            maxParticles: 100 // Maksimum parçacık sayısını arttır
        });
        
        // Düşman gemileri için su efekti emitter'ı şablonu
        // Her düşman için ayrı emitter oluşturacağız
        this.enemyWaterEmitterConfig = {
            scale: { start: 0.3, end: 0.1 }, // Oyuncununkiyle aynı boyut
            alpha: { start: 0.6, end: 0 }, // Daha görünür olması için alpha değerini arttırdım
            lifespan: 800, // Oyuncununkiyle aynı ömür
            speedX: { min: -20, max: 20 }, // Oyuncununkiyle aynı hız aralığı
            speedY: { min: -20, max: 20 },
            quantity: 2, // Sabit değer olarak ayarlandı, fonksiyon değil
            frequency: 40,
            on: false,
            tint: 0xffffff, // Beyaz renk
            maxParticles: 50 // Daha fazla parçacık
        };
        
        // Düşman gemilerinin emitter'larını saklamak için harita
        this.enemyEmitters = new Map();
    }
    
    createGameObjects() {
        // Uygun bir başlangıç konumu bul (adalardan uzak)
        let playerX = 400, playerY = 300;
        
        // Eğer ada pozisyonları varsa, güvenli bir başlangıç noktası bul
        if (this.islandPositions && this.islandPositions.length > 0) {
            let safeSpot = false;
            let attempts = 0;
            
            while (!safeSpot && attempts < 50) {
                safeSpot = true;
                playerX = Phaser.Math.Between(200, 600);
                playerY = Phaser.Math.Between(200, 600);
                
                // Her adaya olan mesafeyi kontrol et
                for (const island of this.islandPositions) {
                    const dist = Phaser.Math.Distance.Between(playerX, playerY, island.x, island.y);
                    if (dist < island.radius + 100) { // Güvenli mesafe
                        safeSpot = false;
                        break;
                    }
                }
                
                attempts++;
            }
        }
        
        // Oyuncu gemisi
        this.player = new Ship(this, playerX, playerY, 'player-ship');
        this.player.anims.stop(); // Animasyonu durdur
        this.player.setFrame(0); // Sabit bir kare göster
        
        // Düşman gemileri grubu
        this.enemies = this.physics.add.group({
            classType: EnemyShip,
            maxSize: 20,
            runChildUpdate: true
        });
        
        // Hazineler grubu
        this.treasures = this.physics.add.group({
            classType: Treasure,
            runChildUpdate: true
        });
        
        // Can kutuları grubu
        this.healthBoxes = this.physics.add.group({
            classType: HealthBox,
            runChildUpdate: true
        });
        
        // Mermiler grubu
        this.projectiles = this.physics.add.group({
            defaultKey: 'cannonball', // Varsayılan doku
            classType: Projectile,
            maxSize: 30,
            runChildUpdate: true,
            collideWorldBounds: true,
            allowGravity: false
        });
        
        // Düşman mermileri
        this.enemyProjectiles = this.physics.add.group({
            defaultKey: 'cannonball', // Varsayılan doku
            classType: Projectile,
            maxSize: 30,
            runChildUpdate: true,
            collideWorldBounds: true,
            allowGravity: false
        });
    }
    
    createUI() {
        // Skor metni
        this.scoreText = this.add.text(20, 20, 'Altın: 0', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);
        
        // Can çubuğu
        this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.updateHealthBar();
        
        // Oyun sonu metni (başlangıçta gizli)
        this.gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2, 
            'OYUN BİTTİ\n\nTekrar denemek için SPACE tuşuna basın', {
            font: 'bold 32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    }
    
    updateHealthBar() {
        this.healthBar.clear();
        
        // Arka plan (kırmızı)
        this.healthBar.fillStyle(0xE73246, 1);
        this.healthBar.fillRect(20, 60, 200, 20);
        
        // Ön plan (yeşil)
        if (this.player && this.player.health > 0) {
            this.healthBar.fillStyle(0x62DE55, 1);
            this.healthBar.fillRect(20, 60, 200 * (this.player.health / this.player.maxHealth), 20);
        }
    }
    
    setupInput() {
        // Klavye tuşlarını tanımla
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Ateş etme tuşu
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameOver) {
                this.restartGame();
                return;
            }
            
            this.player.fire();
        });

        // E tuşu için olay dinleyici
        this.input.keyboard.on('keydown-E', () => {
            if (!this.gameOver) {
                this.handleInteraction();
            }
        });
    }

    // Etkileşim işlevi
    handleInteraction() {
        // Hata ayıklama için konsol mesajı
        console.log("handleInteraction çağrıldı!");
        console.log("Oyuncu pozisyonu:", this.player.x, this.player.y);
        console.log("Yükseltme adası pozisyonu:", this.upgradeIsland.x, this.upgradeIsland.y);
        
        // Oyuncu ve yükseltme adası arasındaki mesafeyi kontrol et
        if (this.upgradeIsland && this.player) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.upgradeIsland.x, this.upgradeIsland.y
            );
            
            console.log("Mesafe:", distance);
            
            // Eğer oyuncu yükseltme adasına yeterince yakınsa
            if (distance < 200) {
                // Yükseltme menüsünü aç
                console.log("Menü açılıyor!");
                this.upgradeIsland.openUpgradeMenu();
            } else {
                console.log("Oyuncu adaya yeterince yakın değil!");
            }
        } else {
            console.log("Yükseltme adası veya oyuncu bulunamadı!");
        }
    }
    
    setupEnemySpawner() {
        // Belirli aralıklarla düşman gemileri oluştur
        this.enemyTimer = this.time.addEvent({
            delay: 5000,
            callback: this.spawnEnemyFleet,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnEnemyFleet() {
        if (this.gameOver) return;

        // Maksimum düşman sayısını kontrol et
        if (this.enemies.getChildren().length >= 10) return;

        // Filo boyutunu rastgele belirle (2-5 arası)
        const fleetSize = Phaser.Math.Between(2, 5);
        const leaderX = Phaser.Math.Between(200, 2800);
        const leaderY = Phaser.Math.Between(200, 2800);

        // Filo liderini oluştur
        const leader = new EnemyShip(this, leaderX, leaderY, 'enemy-ship');
        this.enemies.add(leader);

        // Diğer gemileri liderin etrafında konumlandır
        for (let i = 1; i < fleetSize; i++) {
            const angle = (i * (360 / fleetSize)) * (Math.PI / 180); // Dereceyi radiana çevir
            const offsetX = Math.cos(angle) * 50; // 50 birim uzaklıkta
            const offsetY = Math.sin(angle) * 50;

            const ship = new EnemyShip(this, leaderX + offsetX, leaderY + offsetY, 'enemy-ship');
            this.enemies.add(ship);
        }
    }
    
    setupTreasureSpawner() {
        // Belirli aralıklarla hazine oluştur
        this.treasureTimer = this.time.addEvent({
            delay: 10000,
            callback: this.spawnTreasure,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnTreasure() {
        if (this.gameOver) return;
        
        // Maksimum hazine sayısını kontrol et
        if (this.treasures.getChildren().length >= 5) return;
        
        // Adalardan uzak bir konum seç
        let x, y;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!validPosition && attempts < maxAttempts) {
            // Rastgele bir konum seç
            x = Phaser.Math.Between(200, 2800);
            y = Phaser.Math.Between(200, 2800);
            
            // Adalara olan mesafeyi kontrol et
            validPosition = true;
            if (this.islandPositions && this.islandPositions.length > 0) {
                for (const island of this.islandPositions) {
                    const dist = Phaser.Math.Distance.Between(x, y, island.x, island.y);
                    // Adadan en az ada yarıçapı + 50 piksel uzaklıkta olsun
                    if (dist < island.radius + 50) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // Eğer geçerli bir konum bulunamadıysa, hazine oluşturma
        if (!validPosition) return;
        
        // Yeni hazine ekle
        const treasure = new Treasure(this, x, y, 'treasure');
        this.treasures.add(treasure);
    }
    
    setupHealthBoxSpawner() {
        // Belirli aralıklarla can kutusu oluştur
        this.healthBoxTimer = this.time.addEvent({
            delay: 10000,
            callback: this.spawnHealthBox,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnHealthBox() {
        if (this.gameOver) return;
        
        // Maksimum can kutusu sayısını kontrol et
        if (this.healthBoxes.getChildren().length >= 5) return;
        
        // Adalardan uzak bir konum seç
        let x, y;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!validPosition && attempts < maxAttempts) {
            // Rastgele bir konum seç
            x = Phaser.Math.Between(200, 2800);
            y = Phaser.Math.Between(200, 2800);
            
            // Adalara olan mesafeyi kontrol et
            validPosition = true;
            if (this.islandPositions && this.islandPositions.length > 0) {
                for (const island of this.islandPositions) {
                    const dist = Phaser.Math.Distance.Between(x, y, island.x, island.y);
                    // Adadan en az ada yarıçapı + 50 piksel uzaklıkta olsun
                    if (dist < island.radius + 50) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // Eğer geçerli bir konum bulunamadıysa, can kutusu oluşturma
        if (!validPosition) return;
        
        // Yeni can kutusu ekle
        const healthBox = new HealthBox(this, x, y, 'health-box');
        this.healthBoxes.add(healthBox);
    }
    
    setupCollisions() {
        // Oyuncu ve adalar arasındaki çarpışma
        this.physics.add.collider(this.player, this.islands, (player, island) => {
            // Çarpışma etkisi - geminin yavaşlaması ve çarpma sesi
            this.cameras.main.shake(100, 0.01);
            player.setVelocity(player.body.velocity.x * -0.7, player.body.velocity.y * -0.7);
            
            // Çarpma sesini çal (zamanlayıcı kontrolü ile)
            const currentTime = this.time.now;
            if (currentTime - this.lastCollisionSound >= this.collisionSoundDelay) {
                this.sound.play('carpma', { volume: 0.2 });
                this.lastCollisionSound = currentTime;
            }
            
            // Geminin şeffaflığını sıfırla
            player.setAlpha(1);
        }, null, this);
        
        // Düşmanlar ve adalar arasındaki çarpışma
        this.physics.add.collider(this.enemies, this.islands, (enemy, island) => {
            enemy.setVelocity(enemy.body.velocity.x * -0.7, enemy.body.velocity.y * -0.7);
            enemy.movementState = 'patrol';
            enemy.patrolTimer = 0;
            
            enemy.patrolDirection = new Phaser.Math.Vector2(
                Phaser.Math.Between(-1, 1), 
                Phaser.Math.Between(-1, 1)
            ).normalize();
        }, null, this);
        
        // Düşman gemileri arasındaki çarpışma
        this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => {
            // İki düşman gemi arasındaki yön vektörü
            const dx = enemy1.x - enemy2.x;
            const dy = enemy1.y - enemy2.y;
            
            // Yön vektörünü normalize et
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;
            
            // İtiş kuvveti
            const pushForce = 50;
            
            // Düşmanları birbirinden uzaklaştır
            enemy1.body.velocity.x += normalizedDx * pushForce;
            enemy1.body.velocity.y += normalizedDy * pushForce;
            enemy2.body.velocity.x -= normalizedDx * pushForce;
            enemy2.body.velocity.y -= normalizedDy * pushForce;
            
            // Düşmanların yönünü ve davranışını yeniden belirle
            enemy1.patrolTimer = 0;
            enemy2.patrolTimer = 0;
        }, null, this);
        
        // Mermiler ve adalar arasındaki çarpışma (mermiler yok olur ama adalar etkilenmez)
        this.physics.add.collider(this.projectiles, this.islands, (projectile, island) => {
            projectile.destroy();
        }, null, this);
        
        // Düşman mermileri ve adalar arasındaki çarpışma
        this.physics.add.collider(this.enemyProjectiles, this.islands, (projectile, island) => {
            projectile.destroy();
        }, null, this);
        
        // Oyuncu mermileri ve düşman gemileri arasındaki çarpışma
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        
        // Oyuncu ve hazineler arasındaki çarpışma
        this.physics.add.overlap(this.player, this.treasures, this.collectTreasure, null, this);
        
        // Oyuncu ve can kutuları arasındaki çarpışma
        this.physics.add.overlap(this.player, this.healthBoxes, this.collectHealthBox, null, this);
        
        // Oyuncu ve düşman gemileri arasındaki çarpışma (artık hasar vermez, sadece itiş)
        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            // Hafif bir itiş etkisi (birbirlerini iterler)
            const pushForce = 100;
            
            // İki gemi arasındaki yön vektörü
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            
            // Yön vektörünü normalize et
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;
            
            // Oyuncu ve düşmanı ters yönlerde it
            player.body.velocity.x += normalizedDx * pushForce;
            player.body.velocity.y += normalizedDy * pushForce;
            enemy.body.velocity.x -= normalizedDx * pushForce;
            enemy.body.velocity.y -= normalizedDy * pushForce;
            
            // Hafif bir çarpma sesi çal
            this.sound.play('carpma', { volume: 0.2 });
            
            // Çarpışma kamerasını hafif salla
            this.cameras.main.shake(50, 0.005);
            
            // Oyuncu ve düşman gemisine az miktarda hasar ver
            player.damage(5); // Oyuncuya 5 hasar
            enemy.damage(5);  // Düşmana 5 hasar
            
            // Can çubuğunu güncelle
            this.updateHealthBar();
            
            // Oyuncu öldüyse
            if (player.health <= 0 && !this.gameOver) {
                this.endGame();
            }
        }, null, this);
        
        // Düşman mermileri ve oyuncu gemisi arasındaki çarpışma
        this.physics.add.overlap(this.enemyProjectiles, this.player, this.hitPlayer, null, this);
    }
    
    hitEnemy(projectile, enemy) {
        // Güvenlik kontrolü
        if (enemy && typeof enemy.damage === 'function' && projectile && projectile.active) {
            // Mermi hasarını kontrol et
            let actualDamage = this.player.cannonDamage; // Varsayılan değer olarak oyuncunun hasar değerini kullan
            
            // Eğer mermi üzerinde hasar değeri varsa onu kullan
            if (projectile.damage !== undefined && typeof projectile.damage === 'number') {
                actualDamage = projectile.damage;
            }
            
            console.log("Düşmana hasar verildi:", actualDamage);
            
            // Hasar ver ve mermiyi yok et
            enemy.damage(actualDamage);
            projectile.destroy();
            
            // Düşman yok olduysa
            if (enemy.health <= 0) {
                // Emitter'ı temizle (güvenlik kontrolü)
                if (this.enemyEmitters.has(enemy)) {
                    const emitter = this.enemyEmitters.get(enemy);
                    emitter.on = false;
                    emitter.stop();
                    this.enemyEmitters.delete(enemy);
                }
                
                // Patlama efekti
                this.createExplosion(enemy.x, enemy.y);
                
                // Bazen hazine bırak
                if (Phaser.Math.Between(0, 100) < 60) {
                    const treasure = new Treasure(this, enemy.x, enemy.y, 'treasure');
                    this.treasures.add(treasure);
                }
                
                // Skor ekle
                this.score += 50;
                this.scoreText.setText('Altın: ' + this.score);
            }
        }
    }
    
    hitPlayer(player, projectile) {
        // Güvenlik kontrolü
        if (player && typeof player.damage === 'function' && projectile && projectile.active && !this.gameOver) {
            // Mermi hasarını kontrol et
            let damage = 10; // Varsayılan hasar değeri
            
            // Eğer mermi üzerinde hasar değeri varsa onu kullan
            if (projectile.damage !== undefined && typeof projectile.damage === 'number') {
                damage = projectile.damage;
            }
            
            // Hasar ver ve mermiyi yok et
            player.damage(damage);
            projectile.destroy();
            
            // Hafif bir patlama efekti
            const smallExplosion = this.add.sprite(projectile.x, projectile.y, 'explosion')
                .setScale(0.7)
                .play('explode');
                
            // Animasyon bitince yok et
            smallExplosion.once('animationcomplete', () => {
                smallExplosion.destroy();
            });
            
            // Can çubuğunu güncelle
            this.updateHealthBar();
            
            // Hafif kamera sarsıntısı
            this.cameras.main.shake(50, 0.01);
            
            // Patlama sesi çal
            this.sound.play('explosion-sound', { volume: 0.2 });
            
            // Oyuncu öldüyse
            if (player.health <= 0 && !this.gameOver) {
                this.endGame();
            }
        }
    }
    
    collectTreasure(player, treasure) {
        // Hazineyi topla
        treasure.collect();
        
        // Skor ekle
        this.score += 10;
        this.scoreText.setText('Altın: ' + this.score);
        
        // Hazine toplama sesini çal (zamanlayıcı kontrolü ile)
        const currentTime = this.time.now;
        if (currentTime - this.lastTreasureSound >= this.treasureSoundDelay) {
            this.sound.play('collect-treasure', { volume: 1.5 });
            this.lastTreasureSound = currentTime;
        }
    }
    
    collectHealthBox(player, healthBox) {
        // Can kutusunu topla
        healthBox.collect();
        
        // Oyuncunun canını yükselt
        const newHealth = Math.min(player.health + healthBox.healthAmount, player.maxHealth);
        player.health = newHealth;
        
        // Can çubuğunu güncelle
        this.updateHealthBar();
        
        // Yükseltme sesi çal ve görsel efekt (zamanlayıcı kontrolü ile)
        const currentTime = this.time.now;
        if (currentTime - this.lastHealthBoxSound >= this.healthBoxSoundDelay) {
            this.sound.play('can-sound', { 
                volume: 1.5,
                rate: 1.0 // Normal çalma hızı
            });
            this.lastHealthBoxSound = currentTime;
        }
        
        // Yükseltme animasyonu (parıltı efekti)
        const glow = this.add.sprite(player.x, player.y, 'upgrade-glow')
            .setScale(1)
            .setAlpha(0.7)
            .setDepth(11);
            
        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 2,
            duration: 800,
            onComplete: () => {
                glow.destroy();
            }
        });
        
        // Kullanıcıya bilgi mesajı
        const healthText = this.add.text(player.x, player.y - 40, '+' + healthBox.healthAmount, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#62DE55',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Bilgi mesajını yukarı doğru kaydır ve sonra yok et
        this.tweens.add({
            targets: healthText,
            y: healthText.y - 30,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                healthText.destroy();
            }
        });
    }
    
    createExplosion(x, y) {
        // Patlama animasyonu oluştur
        const explosion = this.add.sprite(x, y, 'explosion')
            .setScale(1.5)
            .play('explode');
            
        // Animasyon bitince yok et
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Patlama sesi çal
        this.sound.play('explosion-sound', { volume: 0.1 });
    }
    
    // Yükseltme adası oluştur
    createUpgradeIsland() {
        // Adalardan uzak bir nokta bul
        let upgradeX, upgradeY;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!validPosition && attempts < maxAttempts) {
            // Haritada merkeze yakın bir konum seç
            upgradeX = Phaser.Math.Between(1000, 2000);
            upgradeY = Phaser.Math.Between(1000, 2000);
            
            // Adalara olan mesafeyi kontrol et
            validPosition = true;
            if (this.islandPositions && this.islandPositions.length > 0) {
                for (const island of this.islandPositions) {
                    const dist = Phaser.Math.Distance.Between(upgradeX, upgradeY, island.x, island.y);
                    if (dist < island.radius + 300) { // Diğer adalardan daha uzak olsun
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // Eğer geçerli bir konum bulunamadıysa, merkezi seç
        if (!validPosition) {
            upgradeX = 1500;
            upgradeY = 1500;
        }
        
        // Yükseltme adasını oluştur
        this.upgradeIsland = new UpgradeIsland(this, upgradeX, upgradeY);
        
        // Alanın etrafında görünmez bir koruyucu statik obje oluştur
        // Bu, top mermilerini durduracak ancak adanın kendisine bir şey olmayacak
        this.upgradeIslandShield = this.physics.add.staticGroup();
        
        // Koruyucu kalkanı ada boyutunda oluştur
        const shield = this.upgradeIslandShield.create(upgradeX, upgradeY, null);
        shield.setVisible(false);
        shield.setCircle(this.upgradeIsland.width * 0.5);
        shield.refreshBody(); // Fizik gövdesini güncelle
        
        // Çarpışma algılayıcıları
        this.physics.add.collider(this.player, this.upgradeIsland);
        
        // Düşman gemileri için çarpışma algılayıcısını ekle
        this.physics.add.collider(this.enemies, this.upgradeIsland);
        
        // Mermilerin sadece koruyucu kalkanla çarpışmasını sağla
        this.physics.add.collider(this.projectiles, this.upgradeIslandShield, this.hitUpgradeIsland, null, this);
        this.physics.add.collider(this.enemyProjectiles, this.upgradeIslandShield, this.hitUpgradeIsland, null, this);
    }
    
    update() {
        // Eğer oyun duraklatıldıysa güncelleme yapma
        if (this.gamePaused) return;
        
        if (this.gameOver) return;
        
        // Deniz dalgası animasyonu güncelleme
        this.waveOffset += this.waveSpeed;
        this.seaTile.tilePositionX = this.waveOffset;
        this.seaTile.tilePositionY = this.waveOffset * 0.5;
        
        // Yeni hareket kontrolü - yön tuşlarına göre doğrudan hareket
        let velX = 0;
        let velY = 0;
        const speed = this.player.maxSpeed;
        
        // Klavye ve mobil kontrolleri birleştir
        if (this.cursors.up.isDown || this.mobileControls.up) {
            velY = -speed;
            this.player.direction = 0;
        }
        if (this.cursors.down.isDown || this.mobileControls.down) {
            velY = speed;
            this.player.direction = 180;
        }
        if (this.cursors.left.isDown || this.mobileControls.left) {
            velX = -speed;
            this.player.direction = 270;
        }
        if (this.cursors.right.isDown || this.mobileControls.right) {
            velX = speed;
            this.player.direction = 90;
        }
        
        // Yön değişikliğini geminin görünümüne yansıtalım
        if (this.player.direction === 0) {
            this.player.setFrame(3); // Yukarı bakan kare
        } else if (this.player.direction === 90) {
            this.player.setFrame(1); // Sağa bakan kare
        } else if (this.player.direction === 180) {
            this.player.setFrame(0); // Aşağı bakan kare
        } else if (this.player.direction === 270) {
            this.player.setFrame(2); // Sola bakan kare
        }
        
        // Çapraz yönler için normalizasyon
        if (velX !== 0 && velY !== 0) {
            // Çapraz hareket durumunda hızı normalize et
            // Böylece çapraz giderken daha hızlı olmaz
            const norm = Math.sqrt(velX * velX + velY * velY);
            velX = (velX / norm) * speed;
            velY = (velY / norm) * speed;
        }
        
        // Hızı uygula
        this.player.body.setVelocity(velX, velY);
        
        // Oyuncu gemisi hareket ediyorsa su efektini aktifleştir
        const playerSpeed = Math.sqrt(velX * velX + velY * velY);
        if (playerSpeed > 10) {
            // Geminin arkasında dalga bırak - hareket yönünün tersine
            const offsetX = -Math.sign(velX) * 20;
            const offsetY = -Math.sign(velY) * 20;
            
            // Parçacık konumunu ayarla
            this.playerWaterEmitter.setPosition(this.player.x + offsetX, this.player.y + offsetY);
            
            // Hız değerine göre parçacık sayısını ve hızını ayarla
            this.playerWaterEmitter.speedX.min = -playerSpeed / 5;
            this.playerWaterEmitter.speedX.max = playerSpeed / 5;
            this.playerWaterEmitter.speedY.min = -playerSpeed / 5;
            this.playerWaterEmitter.speedY.max = playerSpeed / 5;
            
            // Su efektini aktifleştir - hareket devam ettiği sürece çalışsın
            if (!this.playerWaterEmitter.on) {
                this.playerWaterEmitter.on = true;
                this.playerWaterEmitter.frequency = Math.max(20, 80 - playerSpeed / 5);
            }
        } else {
            // Gemi durduğunda su efektini kapat
            if (this.playerWaterEmitter.on) {
                this.playerWaterEmitter.on = false;
            }
        }
        
        // Düşman gemilerini güncelle
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                enemy.updateAI(this.player);
                
                // Düşman gemisinin hızını hesapla
                const enemyVelX = enemy.body.velocity.x;
                const enemyVelY = enemy.body.velocity.y;
                const enemySpeed = Math.sqrt(enemyVelX * enemyVelX + enemyVelY * enemyVelY);
                
                // Bu düşman için emitter'ı al
                const enemyEmitter = this.enemyEmitters.get(enemy);
                
                // Eğer bu düşman için emitter varsa
                if (enemyEmitter) {
                    // Düşman gemileri için her zaman su efektini göster - kovalama durumunda da
                    
                    // Geminin yönünün tersine offset hesapla
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    if (enemySpeed > 10) {
                        // Hareket varsa, hareket yönünün tersine offsetle
                        offsetX = -Math.sign(enemyVelX) * 20;
                        offsetY = -Math.sign(enemyVelY) * 20;
                    } else {
                        // Hareket yoksa, geminin yönüne göre offset belirle
                        if (enemy.direction === 0) offsetY = 20; // North (up) - arkası aşağıda
                        else if (enemy.direction === 90) offsetX = -20; // East (right) - arkası solda
                        else if (enemy.direction === 180) offsetY = -20; // South (down) - arkası yukarıda
                        else if (enemy.direction === 270) offsetX = 20; // West (left) - arkası sağda
                    }
                    
                    // Parçacık oluştur - düşman gemisinin konumunda (offsetli)
                    enemyEmitter.setPosition(enemy.x + offsetX, enemy.y + offsetY);
                    
                    // Parçacık hızını ayarla - geminin hızı düşükse bile minimum bir değer kullan
                    const effectiveSpeed = Math.max(enemySpeed, 50);
                    enemyEmitter.speedX.min = -effectiveSpeed / 5;
                    enemyEmitter.speedX.max = effectiveSpeed / 5;
                    enemyEmitter.speedY.min = -effectiveSpeed / 5;
                    enemyEmitter.speedY.max = effectiveSpeed / 5;
                    
                    // Su efektini her zaman aktif tut
                    enemyEmitter.on = true;
                    
                    // Hıza bağlı olarak frekansı ayarla
                    enemyEmitter.frequency = Math.max(20, 60 - effectiveSpeed / 3);
                    
                    // Geminin son hareket zamanını kaydet
                    enemy.lastMoveTime = this.time.now;
                }
            }
        });
        
        // MANUEL DÜŞMAN MERMİLERİ ÇARPIŞMA KONTROLÜ
        // Bu daha kesin bir çarpışma tespit mekanizması sağlar
        if (this.player.active && !this.gameOver) {
            const enemyBullets = this.enemyProjectiles.getChildren();
            for (let i = 0; i < enemyBullets.length; i++) {
                const bullet = enemyBullets[i];
                if (bullet.active) {
                    // Mesafeyi kontrol et
                    const distance = Phaser.Math.Distance.Between(
                        bullet.x, bullet.y,
                        this.player.x, this.player.y
                    );
                    
                    // Eğer mermi oyuncuya yeterince yakınsa
                    if (distance < 40) { // Çarpışma yarıçapı
                        // Hasar ver
                        this.player.damage(10);
                        bullet.destroy();
                        
                        // Can çubuğunu güncelle
                        this.updateHealthBar();
                        
                        // Oyuncu öldüyse
                        if (this.player.health <= 0 && !this.gameOver) {
                            this.endGame();
                        }
                        
                        // Debug için
                        console.log("Çarpışma tespit edildi! Oyuncu sağlığı:", this.player.health);
                    }
                }
            }
        }
        
        // Yükseltme adasını güncelle
        if (this.upgradeIsland) {
            this.upgradeIsland.update();
        }
    }
    
    endGame() {
        // Oyun sonu işlemleri
        this.gameOver = true;
        
        // Müziği durdur
        this.sound.stopByKey('battle-theme');
        
        // Oyuncu gemisinin patlama efekti
        if (this.player) {
            // Patlama efekti ekle
            this.createExplosion(this.player.x, this.player.y);
        }
        
        // Kamerayı sabitle (takip etmeyi bırak)
        this.cameras.main.stopFollow();
        
        // Yarı-saydam siyah arka plan (tüm ekranı kaplar)
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        ).setScrollFactor(0).setDepth(98);
        
        // Game over paneli (panel arka planı)
        const panel = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            350,
            0x333333,
            0.9
        ).setScrollFactor(0).setDepth(99);
        
        // Panel kenarı (çizgi)
        const panelBorder = this.add.graphics().setScrollFactor(0).setDepth(99);
        panelBorder.lineStyle(4, 0xf5cc66, 1);
        panelBorder.strokeRect(
            this.cameras.main.width / 2 - 200,
            this.cameras.main.height / 2 - 175,
            400,
            350
        );
        
        // Game over metni
        const gameOverText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2 - 120, 
            'OYUN BİTTİ',
            {
                fontSize: '48px',
                fill: '#f5cc66', // Altın/sarı renk
                stroke: '#000',
                strokeThickness: 6,
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Dekoratif çizgi
        const line = this.add.graphics().setScrollFactor(0).setDepth(100);
        line.lineStyle(3, 0xf5cc66, 1);
        line.beginPath();
        line.moveTo(this.cameras.main.width / 2 - 160, this.cameras.main.height / 2 - 80);
        line.lineTo(this.cameras.main.width / 2 + 160, this.cameras.main.height / 2 - 80);
        line.closePath();
        line.strokePath();
        
        // Skor göster
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 30,
            'TOPLAM ALTIN',
            {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        const scoreValue = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 10,
            this.score.toString(),
            {
                fontSize: '38px',
                fill: '#f5cc66', // Altın/sarı renk
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        // Yeniden başlat butonu
        const restartButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 70,
            300,
            40,
            0x62DE55, // Yeşil
            1
        ).setScrollFactor(0).setDepth(100).setInteractive();
        
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 70,
            'YENİDEN BAŞLA',
            {
                fontSize: '24px',
                fill: '#000',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        
        // Ana menüye dön butonu
        const menuButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 130,
            300,
            40,
            0xE73246, // Kırmızı
            1
        ).setScrollFactor(0).setDepth(100).setInteractive();
        
        const menuText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 130,
            'ANA MENÜYE DÖN',
            {
                fontSize: '24px',
                fill: '#fff',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        
        // Buton etkileşimleri
        restartButton.on('pointerdown', () => {
            this.restartGame();
        });
        
        restartButton.on('pointerover', () => {
            restartButton.setScale(1.05);
            restartText.setScale(1.05);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setScale(1);
            restartText.setScale(1);
        });
        
        menuButton.on('pointerdown', () => {
            this.returnToMenu();
        });
        
        menuButton.on('pointerover', () => {
            menuButton.setScale(1.05);
            menuText.setScale(1.05);
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
            menuText.setScale(1);
        });
        
        // Zamanlayıcıları durdur
        if (this.enemyTimer) this.enemyTimer.remove();
        if (this.treasureTimer) this.treasureTimer.remove();
    }
    
    returnToMenu() {
        // Tüm sesleri durdur
        this.sound.stopAll();
        
        // Ana menüye dön
        this.scene.start('MainMenu');
    }
    
    restartGame() {
        // Tüm sesleri durdur
        this.sound.stopAll();
        
        // Oyunu yeniden başlat
        this.scene.restart();
        this.score = 0;
        this.gameOver = false;
    }
    
    // Oyunu durdur (menüler için)
    pauseGame() {
        if (this.gamePaused) return;
        
        this.gamePaused = true;
        
        // Düşman hareketlerini durdur
        this.enemies.getChildren().forEach(enemy => {
            enemy.oldVelocityX = enemy.body.velocity.x;
            enemy.oldVelocityY = enemy.body.velocity.y;
            enemy.body.setVelocity(0, 0);
        });
        
        // Zamanlayıcıları duraklat
        if (this.enemyTimer) this.enemyTimer.paused = true;
        if (this.treasureTimer) this.treasureTimer.paused = true;
    }
    
    // Oyunu devam ettir
    resumeGame() {
        if (!this.gamePaused) return;
        
        this.gamePaused = false;
        
        // Düşman hareketlerini geri yükle
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.oldVelocityX !== undefined && enemy.oldVelocityY !== undefined) {
                enemy.body.setVelocity(enemy.oldVelocityX, enemy.oldVelocityY);
            }
        });
        
        // Zamanlayıcıları devam ettir
        if (this.enemyTimer) this.enemyTimer.paused = false;
        if (this.treasureTimer) this.treasureTimer.paused = false;
    }
    
    // Ses açma/kapama butonu oluştur
    createSoundButton() {
        // Ekranın sağ üst köşesine ses butonu yerleştir
        const soundButtonX = this.cameras.main.width - 50;
        const soundButtonY = 50;
        
        // Buton arka planı
        this.soundButton = this.add.circle(soundButtonX, soundButtonY, 20, 0x000000, 0.5);
        this.soundButton.setScrollFactor(0);
        this.soundButton.setInteractive({ useHandCursor: true });
        this.soundButton.setDepth(100);
        
        // Ses simgesi
        const soundOnIcon = this.isSoundOn ? '🔊' : '🔇';
        this.soundIcon = this.add.text(soundButtonX, soundButtonY, soundOnIcon, { 
            font: '24px Arial Black',
            color: '#ffffff'
        });
        this.soundIcon.setOrigin(0.5);
        this.soundIcon.setScrollFactor(0);
        this.soundIcon.setDepth(101);
        
        // Buton etkileşimleri
        this.soundButton.on('pointerover', () => {
            this.soundButton.setFillStyle(0x444444, 0.7);
        });
        
        this.soundButton.on('pointerout', () => {
            this.soundButton.setFillStyle(0x000000, 0.5);
        });
        
        this.soundButton.on('pointerdown', () => {
            this.toggleSound();
        });
        
        // Pencere yeniden boyutlandırıldığında butonun pozisyonunu güncelle
        this.scale.on('resize', this.updateSoundButtonPosition, this);
    }
    
    // Ses açma/kapama işlevi
    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        
        // Sesi güncelle
        this.sound.mute = !this.isSoundOn;
        
        // Simgeyi güncelle
        this.soundIcon.setText(this.isSoundOn ? '🔊' : '🔇');
        
        // Tercihi localStorage'e kaydet
        localStorage.setItem('isSoundOn', this.isSoundOn);
    }
    
    // Pencere boyutu değiştiğinde buton pozisyonunu güncelle
    updateSoundButtonPosition() {
        if (this.soundButton && this.soundIcon) {
            const newX = this.cameras.main.width - 50;
            const newY = 50;
            
            this.soundButton.setPosition(newX, newY);
            this.soundIcon.setPosition(newX, newY);
        }
    }
    
    // Mermilerin upgrade adası ile çarpışma kontrolü
    hitUpgradeIsland(projectile, island) {
        // Güvenlik kontrolü - mermi hala aktifse
        if (projectile && projectile.active) {
            // Mermiyi yok et
            projectile.destroy();
            
            // Küçük çarpma efekti - isteğe bağlı, daha görsel bir geri bildirim için
            const smallSplash = this.add.sprite(projectile.x, projectile.y, 'water-particle')
                .setScale(0.5)
                .setAlpha(0.8);
                
            // Sıçrama efekti - büyüt ve kaybol
            this.tweens.add({
                targets: smallSplash,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => {
                    smallSplash.destroy();
                }
            });
        }
        
        // Ada etkilenmez ve yok olmaz
        return false;
    }

    createMobileControls() {
        // Kontrol durumu
        this.mobileControls = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        const buttonRadius = 50;
        const buttonAlpha = 0.5;

        // JOYSTİCK KONTROLÜ
        const leftPadX = 200;
        const leftPadY = this.cameras.main.height - 200;

        
        // Joystick arka planı (sabit daire)
        this.joystickBase = this.add.circle(leftPadX, leftPadY, buttonRadius * 2, 0x888888, 0.4)
            .setScrollFactor(0)
            .setDepth(99);
        
        // Joystick arka plan çerçevesi
        this.joystickBaseBorder = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(99);
        this.joystickBaseBorder.lineStyle(3, 0xffffff, 0.8);
        this.joystickBaseBorder.strokeCircle(leftPadX, leftPadY, buttonRadius * 2);
        
        // Joystick topuzu (hareketli kısım)
        this.joystickThumb = this.add.circle(leftPadX, leftPadY, buttonRadius, 0xffffff, 0.7)
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive({ draggable: true, useHandCursor: true });
        
        // Joystick topuz çerçevesi
        this.joystickThumbBorder = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(100);
        this.joystickThumbBorder.lineStyle(3, 0x33aaff, 1);
        this.joystickThumbBorder.strokeCircle(leftPadX, leftPadY, buttonRadius);
        
        // Joystick orta nokta işareti
        this.add.circle(leftPadX, leftPadY, 5, 0xffffff, 1)
            .setScrollFactor(0)
            .setDepth(101);
        
        // Joystick kontrol değişkenleri
        this.joystickActive = false;
        this.joystickBaseX = leftPadX;
        this.joystickBaseY = leftPadY;
        this.joystickRadius = buttonRadius * 2; // Maksimum hareket yarıçapı
        
        // Joystick olayları
        this.joystickThumb.on('pointerdown', (pointer) => {
            this.joystickActive = true;
            this.joystickThumb.setAlpha(0.9);
        });
        
        this.joystickThumb.on('pointermove', (pointer) => {
            if (this.joystickActive) {
                const deltaX = pointer.x - this.joystickBaseX;
                const deltaY = pointer.y - this.joystickBaseY;
                
                // Mesafeyi hesapla
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Maksimum yarıçapı aşmayacak şekilde sınırlandır
                const maxRadius = this.joystickRadius;
                const limitedDistance = Math.min(distance, maxRadius);
                
                // Normalizasyon faktörü
                const normalizationFactor = distance > 0 ? limitedDistance / distance : 0;
                
                // Yeni pozisyon
                const newX = this.joystickBaseX + deltaX * normalizationFactor;
                const newY = this.joystickBaseY + deltaY * normalizationFactor;
                
                // Topuzu hareket ettir
                this.joystickThumb.x = newX;
                this.joystickThumb.y = newY;
                
                // Joystick çerçevesini güncelle
                this.joystickThumbBorder.clear();
                this.joystickThumbBorder.lineStyle(3, 0x33aaff, 1);
                this.joystickThumbBorder.strokeCircle(newX, newY, buttonRadius);
                
                // Geminin hareket yönünü belirle
                // Sınır değerleri: joystick aralığının en az %30'unu aşan hareketler yön değişimi sağlar
                const threshold = maxRadius * 0.3;
                
                // Hareket yönlerini güncelle
                this.mobileControls.up = deltaY < -threshold;
                this.mobileControls.down = deltaY > threshold;
                this.mobileControls.left = deltaX < -threshold;
                this.mobileControls.right = deltaX > threshold;
            }
        });
        
        const endJoystickMovement = () => {
            this.joystickActive = false;
            this.joystickThumb.x = this.joystickBaseX;
            this.joystickThumb.y = this.joystickBaseY;
            this.joystickThumb.setAlpha(0.7);
            
            // Joystick çerçevesini güncelle
            this.joystickThumbBorder.clear();
            this.joystickThumbBorder.lineStyle(3, 0x33aaff, 1);
            this.joystickThumbBorder.strokeCircle(this.joystickBaseX, this.joystickBaseY, buttonRadius);
            
            // Hareket yönlerini sıfırla
            this.mobileControls.up = false;
            this.mobileControls.down = false;
            this.mobileControls.left = false;
            this.mobileControls.right = false;
        };
        
        this.joystickThumb.on('pointerup', endJoystickMovement);
        this.joystickThumb.on('pointerout', endJoystickMovement);

        // Sağ alt köşede ateş tuşu
        const fireButtonX = this.cameras.main.width - 150;
        const fireButtonY = this.cameras.main.height - 150;
        
        this.fireButton = this.add.circle(fireButtonX, fireButtonY, buttonRadius + 15, 0xff0000, buttonAlpha)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);

        // Ateş simgesi
        this.fireButtonIcon = this.add.text(fireButtonX, fireButtonY, '🔥', { 
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);
        
        // Ateş tuşu çerçevesi
        this.fireButtonBorder = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(99);
        this.fireButtonBorder.lineStyle(3, 0xffffff, 0.8);
        this.fireButtonBorder.strokeCircle(fireButtonX, fireButtonY, buttonRadius + 15);

        // Etkileşim butonu (E tuşu)
        const interactButtonX = this.cameras.main.width - 300;
        const interactButtonY = this.cameras.main.height - 150;
        
        this.interactButton = this.add.circle(interactButtonX, interactButtonY, buttonRadius + 15, 0x00ff00, buttonAlpha)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);

        // Etkileşim butonu metni
        this.interactButtonText = this.add.text(interactButtonX, interactButtonY, 'E', { 
            fontSize: '36px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            fontStyle: 'bold'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);

        // Etkileşim butonu çerçevesi
        this.interactButtonBorder = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(99);
        this.interactButtonBorder.lineStyle(3, 0xffffff, 0.8);
        this.interactButtonBorder.strokeCircle(interactButtonX, interactButtonY, buttonRadius + 15);

        // Ateş tuşu olayları
        this.fireButton.on('pointerdown', () => {
            if (!this.gameOver) {
                this.player.fire();
                
                // Basılma efekti
                this.tweens.add({
                    targets: this.fireButton,
                    scaleX: 0.9,
                    scaleY: 0.9,
                    duration: 100,
                    yoyo: true
                });
            }
        });
        
        this.fireButton.on('pointerover', () => {
            this.fireButton.setAlpha(0.7);
        });
        
        this.fireButton.on('pointerout', () => {
            this.fireButton.setAlpha(0.5);
        });

        // Etkileşim tuşu olayları
        this.interactButton.on('pointerdown', () => {
            console.log("Etkileşim butonuna tıklandı!");
            if (!this.gameOver) {
                // E tuşuna basılmış gibi davran
                this.input.keyboard.emit('keydown-E');
                
                // Basılma efekti
                this.tweens.add({
                    targets: this.interactButton,
                    scaleX: 0.9,
                    scaleY: 0.9,
                    duration: 100,
                    yoyo: true
                });
            }
        });

        this.interactButton.on('pointerover', () => {
            this.interactButton.setAlpha(0.7);
        });

        this.interactButton.on('pointerout', () => {
            this.interactButton.setAlpha(0.5);
        });

        // Pencere yeniden boyutlandırıldığında kontrolleri yeniden konumlandır
        this.scale.on('resize', this.resizeMobileControls, this);
    }

    resizeMobileControls() {
        if (!this.mobileControls) return;

        const buttonRadius = 50;
        const leftPadX = 120;
        const leftPadY = this.cameras.main.height - 120;

        // Joystick pozisyonlarını güncelle
        this.joystickBaseX = leftPadX;
        this.joystickBaseY = leftPadY;
        
        // Joystick arka planı
        this.joystickBase.setPosition(leftPadX, leftPadY);
        
        // Joystick topuzu
        this.joystickThumb.setPosition(leftPadX, leftPadY);
        
        // Joystick çerçeveleri
        this.joystickBaseBorder.clear();
        this.joystickBaseBorder.lineStyle(3, 0xffffff, 0.8);
        this.joystickBaseBorder.strokeCircle(leftPadX, leftPadY, buttonRadius * 2);
        
        this.joystickThumbBorder.clear();
        this.joystickThumbBorder.lineStyle(3, 0x33aaff, 1);
        this.joystickThumbBorder.strokeCircle(leftPadX, leftPadY, buttonRadius);

        // Ateş tuşunu yeniden konumlandır
        const fireButtonX = this.cameras.main.width - 100;
        const fireButtonY = this.cameras.main.height - 100;
        
        this.fireButton.setPosition(fireButtonX, fireButtonY);
        this.fireButtonIcon.setPosition(fireButtonX, fireButtonY);
        
        // Ateş tuşu çerçevesi
        if (this.fireButtonBorder) {
            this.fireButtonBorder.clear();
            this.fireButtonBorder.lineStyle(3, 0xffffff, 0.8);
            this.fireButtonBorder.strokeCircle(fireButtonX, fireButtonY, buttonRadius + 15);
        }

        // Etkileşim tuşunu yeniden konumlandır
        const interactButtonX = this.cameras.main.width - 240;
        const interactButtonY = this.cameras.main.height - 100;
        
        this.interactButton.setPosition(interactButtonX, interactButtonY);
        this.interactButtonText.setPosition(interactButtonX, interactButtonY);
        
        // Etkileşim butonu çerçevesi
        if (this.interactButtonBorder) {
            this.interactButtonBorder.clear();
            this.interactButtonBorder.lineStyle(3, 0xffffff, 0.8);
            this.interactButtonBorder.strokeCircle(interactButtonX, interactButtonY, buttonRadius + 15);
        }
    }

    shutdown() {
        // Tüm zamanlayıcıları temizle
        if (this.enemyTimer) this.enemyTimer.destroy();
        if (this.treasureTimer) this.treasureTimer.destroy();
        if (this.healthBoxTimer) this.healthBoxTimer.destroy();

        // Tüm grupları temizle
        if (this.enemies) this.enemies.clear(true, true);
        if (this.projectiles) this.projectiles.clear(true, true);
        if (this.enemyProjectiles) this.enemyProjectiles.clear(true, true);
        if (this.treasures) this.treasures.clear(true, true);
        if (this.healthBoxes) this.healthBoxes.clear(true, true);

        // Event listener'ları temizle
        this.input.keyboard.removeAllListeners();
        this.scale.removeAllListeners();

        // Ses ve müzikleri durdur
        this.sound.stopAll();

        // Oyuncu ve diğer önemli nesneleri temizle
        if (this.player) this.player.destroy();
        if (this.upgradeIsland) this.upgradeIsland.destroy();

        // Parçacık efektlerini temizle
        if (this.waterParticles) this.waterParticles.destroy();
        if (this.enemyEmitters) this.enemyEmitters.clear();

        // Oyun durumunu sıfırla
        this.score = 0;
        this.gameOver = false;
        this.gamePaused = false;
    }
} 