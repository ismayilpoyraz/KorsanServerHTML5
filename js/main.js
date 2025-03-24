/**
 * Korsan - Ana Oyun Başlatma Dosyası
 */

// Ekran yönlendirmesini kontrol et
async function checkOrientation() {
    try {
        const orientationMessage = document.getElementById('orientation-message');
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait) {
            orientationMessage.style.display = 'flex';
            if (window.game && window.game.scene.getScenes(true)[0]) {
                window.game.scene.pause(window.game.scene.getScenes(true)[0]);
            }
        } else {
            orientationMessage.style.display = 'none';
            if (window.game && window.game.scene.getScenes(true)[0]) {
                window.game.scene.resume(window.game.scene.getScenes(true)[0]);
            }
        }
    } catch (error) {
        console.error('Ekran yönlendirmesi kontrolünde hata:', error);
    }
}

// Oyunu başlat
const initGame = async () => {
    try {
        // Oyun yapılandırmasını al
        const config = await getGameConfig();
        
        // Oyun örneğini oluştur
        window.game = new Phaser.Game(config);
        
        // Sahneleri ekle
        window.game.scene.add('Boot', Boot);
        window.game.scene.add('Preload', Preload);
        window.game.scene.add('MainMenu', MainMenu);
        window.game.scene.add('GameScene', GameScene);
        
        // İlk ekran yönü kontrolü
        await checkOrientation();
        
        // Ekran yönü değişikliğini dinle
        window.addEventListener('resize', checkOrientation);
        
        // Boot sahnesiyle başla
        window.game.scene.start('Boot');
    } catch (error) {
        console.error("Oyun başlatılırken bir hata oluştu:", error);
        alert("Oyun başlatılırken bir hata oluştu: " + error.message);
    }
};

// Oyunu başlat
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initGame();
    } catch (error) {
        console.error("Oyun başlatılırken bir hata oluştu:", error);
        alert("Oyun başlatılırken bir hata oluştu: " + error.message);
    }
}); 