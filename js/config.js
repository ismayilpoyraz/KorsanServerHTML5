const getGameConfig = async () => {
    // Sabit oyun çözünürlüğü (16:9)
    const GAME_WIDTH = 1280;
    const GAME_HEIGHT = 720;

    return {
        type: Phaser.AUTO,
        parent: 'game-container',
        backgroundColor: '#0a0a23',
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.EXACT_FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            orientation: Phaser.Scale.LANDSCAPE
        },
        input: {
            activePointers: 3,
            touch: {
                target: document.querySelector('#game-container'),
                capture: true
            }
        },
        dom: {
            createContainer: true
        },
        scene: []
    };
};