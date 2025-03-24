document.addEventListener('DOMContentLoaded', () => {
    // Kontrol tuşları
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const fireButton = document.getElementById('fireButton');

    // Oyun durumu
    const gameState = {
        up: false,
        down: false,
        left: false,
        right: false,
        fire: false
    };

    // Dokunma ve fare olayları için yardımcı fonksiyon
    function handleTouch(element, keyState, startEvent, endEvent) {
        // Dokunmatik olaylar
        element.addEventListener(startEvent, (e) => {
            e.preventDefault();
            gameState[keyState] = true;
            
            // Phaser sahnesini bul ve tuş durumunu güncelle
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene) {
                scene.cursors[keyState].isDown = true;
            }
        });

        element.addEventListener(endEvent, (e) => {
            e.preventDefault();
            gameState[keyState] = false;
            
            // Phaser sahnesini bul ve tuş durumunu güncelle
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene) {
                scene.cursors[keyState].isDown = false;
            }
        });

        // Fare olayları
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            gameState[keyState] = true;
            
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene) {
                scene.cursors[keyState].isDown = true;
            }
        });

        element.addEventListener('mouseup', (e) => {
            e.preventDefault();
            gameState[keyState] = false;
            
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene) {
                scene.cursors[keyState].isDown = false;
            }
        });

        // Mouse leave olayı için
        element.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            gameState[keyState] = false;
            
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene) {
                scene.cursors[keyState].isDown = false;
            }
        });
    }

    // Yön tuşları için olayları ekle
    handleTouch(upButton, 'up', 'touchstart', 'touchend');
    handleTouch(downButton, 'down', 'touchstart', 'touchend');
    handleTouch(leftButton, 'left', 'touchstart', 'touchend');
    handleTouch(rightButton, 'right', 'touchstart', 'touchend');

    // Ateş tuşu için özel işleyici
    function handleFireButton(event, isStart) {
        event.preventDefault();
        gameState.fire = isStart;
        
        if (isStart) {
            const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
            if (scene && scene.player) {
                scene.player.fire();
            }
        }
    }

    // Ateş tuşu için dokunmatik olaylar
    fireButton.addEventListener('touchstart', (e) => handleFireButton(e, true));
    fireButton.addEventListener('touchend', (e) => handleFireButton(e, false));

    // Ateş tuşu için fare olaylar
    fireButton.addEventListener('mousedown', (e) => handleFireButton(e, true));
    fireButton.addEventListener('mouseup', (e) => handleFireButton(e, false));
    fireButton.addEventListener('mouseleave', (e) => handleFireButton(e, false));
}); 