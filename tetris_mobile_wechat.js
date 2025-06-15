function debugLog(message) {}
function SoundManager() {
    var self = this;
    this.enabled = true;
    this.volume = 0.8;
    this.bgMusicVolume = 0.4;
    this.bgMusicEnabled = true;
    this.volumeSettings = {bgMusic: 0.4, move: 0.8, score: 1.0};
    this.soundUrls = {
        bgMusic: 'https://hansang623.github.io/work_2025/background.mp3',
        move: 'https://hansang623.github.io/work_2025/move.mp3',
        score: 'https://hansang623.github.io/work_2025/score.mp3'
    };
    this.fallbackSounds = {};
    this.sounds = {};
    this.bgMusicAudio = null;
    this.waitingForUserInteraction = false;
    this.audioInitialized = false;
    this.useFallbackSounds = false;

    this.generateBeepSound = function(frequency, duration) {
        try {
            if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
                return null;
            }
            
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = audioContext.createOscillator();
            var gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            return {
                play: function() {
                    try {
                        var newOscillator = audioContext.createOscillator();
                        var newGainNode = audioContext.createGain();
                        
                        newOscillator.connect(newGainNode);
                        newGainNode.connect(audioContext.destination);
                        
                        newOscillator.frequency.value = frequency;
                        newOscillator.type = 'sine';
                        
                        newGainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        newGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                        newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                        
                        newOscillator.start(audioContext.currentTime);
                        newOscillator.stop(audioContext.currentTime + duration);

                    } catch (error) {}
                }
            };
        } catch (error) {
            return null;
        }
    };
    
    this.initializeFallbackSounds = function() {
        try {
            this.fallbackSounds = {
                move: this.generateBeepSound(200, 0.1),
                score: this.generateBeepSound(400, 0.2),
                bgMusic: null
            };
        } catch (error) {
            this.fallbackSounds = {};
        }
    };

    this.initialize = function() {
        try {
            for (var key in this.soundUrls) {
                this.sounds[key] = new Audio();
                this.sounds[key].preload = 'metadata';
                var specificVolume = this.volumeSettings[key] || this.volume;
                this.sounds[key].volume = specificVolume;
                this.sounds[key].src = this.soundUrls[key];
                if (key === 'bgMusic') {
                    this.bgMusicAudio = this.sounds[key];
                    this.bgMusicAudio.loop = true;
                    this.bgMusicAudio.volume = this.bgMusicVolume;
                }
                (function(soundKey, audio) {
                    audio.addEventListener('error', function(e) {
                        self.useFallbackSounds = true;
                    });
                })(key, this.sounds[key]);
            }
            
            this.startBackgroundMusic();
            this.showAudioStatusIndicator();
            this.initializeFallbackSounds();
        } catch (error) {
            this.enabled = false;
        }
    };

    this.startBackgroundMusic = function() {
        if (!this.bgMusicEnabled || !this.bgMusicAudio) return;
        
        try {
            var playPromise = this.bgMusicAudio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function(error) {
                    self.waitingForUserInteraction = true;
                    self.showAudioStatusIndicator();
                });
            }
        } catch (error) {
            self.waitingForUserInteraction = true;
            self.showAudioStatusIndicator();
        }
    };
    this.resumeBackgroundMusic = function() {
        if (this.bgMusicEnabled && this.bgMusicAudio && this.bgMusicAudio.paused) {
            try {
                this.bgMusicAudio.play();
            } catch (error) {}
        }
    };
    this.initializeAudioOnUserInteraction = function() {
        if (this.audioInitialized) return;
        try {
            if (this.waitingForUserInteraction && this.bgMusicEnabled && this.bgMusicAudio) {
                var bgPlayPromise = this.bgMusicAudio.play();
                if (bgPlayPromise && typeof bgPlayPromise.then === 'function') {
                    bgPlayPromise.then(function() {}).catch(function(error) {});
                }
            }
            this.audioInitialized = true;
            this.waitingForUserInteraction = false;
            this.hideAudioStatusIndicator();
        } catch (error) {}
    };
    this.showAudioStatusIndicator = function() {
        var indicator = document.getElementById('audioStatus');
        var testBtn = document.getElementById('audioTest');
        if (indicator && this.waitingForUserInteraction) {
            indicator.style.display = 'block';
        }
        if (testBtn) {
            testBtn.style.display = 'block';
        }
    };
    this.hideAudioStatusIndicator = function() {
        var indicator = document.getElementById('audioStatus');
        var testBtn = document.getElementById('audioTest');
        if (indicator) indicator.style.display = 'none';
        if (testBtn) testBtn.style.display = 'none';
    };
    this.testAudio = function() {
        try {
            this.initializeAudioOnUserInteraction();
            setTimeout(function() {
                if (self.sounds.move) {
                    self.sounds.move.volume = 0.5;
                    self.sounds.move.currentTime = 0;
                    self.sounds.move.play();
                }
            }, 300);
            setTimeout(function() {
                if (self.sounds.score) {
                    self.sounds.score.volume = 0.5;
                    self.sounds.score.currentTime = 0;
                    self.sounds.score.play();
                }
            }, 600);
        } catch (error) {}
    };
    this.pauseBackgroundMusic = function() {
        if (this.bgMusicAudio && !this.bgMusicAudio.paused) {
            this.bgMusicAudio.pause();
        }
    };
    this.play = function(soundKey, volumeMultiplier) {
        if (!this.enabled) return;
        if (soundKey === 'bgMusic') return;
        if (!this.audioInitialized) {
            this.initializeAudioOnUserInteraction();
        }
        var actualSoundKey = soundKey;
        if (soundKey === 'left' || soundKey === 'right' || soundKey === 'down' || 
            soundKey === 'rotate' || soundKey === 'drop' || soundKey === 'place') {
            actualSoundKey = 'move';
        } else if (soundKey === 'clear' || soundKey === 'levelUp' || soundKey === 'gameOver' || soundKey === 'pause') {
            actualSoundKey = 'score';
        }
        try {
            var sound = this.sounds[actualSoundKey];
            if (sound) {
                var baseVolume = this.volumeSettings[actualSoundKey] || this.volume;
                var finalVolume = volumeMultiplier ? baseVolume * volumeMultiplier : baseVolume;
                finalVolume = Math.max(0, Math.min(1, finalVolume));
                sound.volume = finalVolume;
                sound.currentTime = 0;
                var playPromise = sound.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.then(function() {}).catch(function(error) {
                        self.playFallbackSound(actualSoundKey);
                    });
                }
            } else {
                this.playFallbackSound(actualSoundKey);
            }
        } catch (error) {
            this.playFallbackSound(actualSoundKey);
        }
    };
    this.playFallbackSound = function(soundKey) {
        if (!this.enabled) return;
        try {
            if (!this.fallbackSounds || Object.keys(this.fallbackSounds).length === 0) {
                this.initializeFallbackSounds();
            }
            var fallbackSound = this.fallbackSounds[soundKey];
            if (fallbackSound && typeof fallbackSound.play === 'function') {
                fallbackSound.play();
            }
        } catch (error) {}
    };

    this.setVolume = function(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        for (var key in this.sounds) {
            if (this.sounds[key] && key !== 'bgMusic') {
                var specificVolume = this.volumeSettings[key] || this.volume;
                this.sounds[key].volume = specificVolume;
            }
        }
    };
    this.setBgMusicVolume = function(vol) {
        this.bgMusicVolume = Math.max(0, Math.min(1, vol));
        if (this.bgMusicAudio) {
            this.bgMusicAudio.volume = this.bgMusicVolume;
        }
    };
    this.setEnabled = function(enable) {
        this.enabled = enable;
    };

    this.setBgMusicEnabled = function(enable) {
        this.bgMusicEnabled = enable;
        if (enable) {
            this.resumeBackgroundMusic();
        } else {
            this.pauseBackgroundMusic();
        }
    };
    this.stopAll = function() {
        for (var key in this.sounds) {
            if (this.sounds[key]) {
                this.sounds[key].pause();
                this.sounds[key].currentTime = 0;
            }
        }
    };
}
var soundManager;
function TetrisGame() {
    var self = this;
    this.gameState = {
        score: 0,
        level: 1,
        lines: 0,
        isPaused: false,
        isGameOver: false,
        dropSpeed: 500,
        currentStage: 1,
        maxStage: 6,
        stageCompleted: false,
        coins: 0,
        mvpEarned: false
    };
    this.stageConfig = {
        1: { target: 1000,  speed: 500, name: "新手村" },
        2: { target: 3000,  speed: 400, name: "初级挑战" },
        3: { target: 6000,  speed: 300, name: "中级考验" },
        4: { target: 10000, speed: 200, name: "高级竞技" },
        5: { target: 15000, speed: 150, name: "专家模式" },
        6: { target: 25000, speed: 100, name: "大师殿堂" }
    };
    this.GRID_WIDTH = 10;
    this.GRID_HEIGHT = 20;
    this.CELL_SIZE = 25;
    this.canvas = null;
    this.ctx = null;
    this.nextCanvas = null;
    this.nextCtx = null;
    this.grid = [];
    this.shapes = {};
    this.currentPiece = null;
    this.nextPiece = null;
    this.lastTime = 0;
    this.accumulator = 0;
    this.animationId = null;
    this.createEmptyGrid = function() {
        var grid = [];
        for (var i = 0; i < this.GRID_HEIGHT; i++) {
            var row = [];
            for (var j = 0; j < this.GRID_WIDTH; j++) {
                row.push(0);
            }
            grid.push(row);
        }
        return grid;
    };

    this.initializeShapes = function() {
        return {
            I: {
                shape: [
                    [[1,1,1,1]],
                    [[1],[1],[1],[1]],
                    [[1,1,1,1]],
                    [[1],[1],[1],[1]]
                ],
                color: '#00ffff'
            },
            O: {
                shape: [
                    [[1,1],[1,1]],
                    [[1,1],[1,1]],
                    [[1,1],[1,1]],
                    [[1,1],[1,1]]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [[0,1,0],[1,1,1]],
                    [[1,0],[1,1],[1,0]],
                    [[1,1,1],[0,1,0]],
                    [[0,1],[1,1],[0,1]]
                ],
                color: '#ff00ff'
            },
            S: {
                shape: [
                    [[0,1,1],[1,1,0]],
                    [[1,0],[1,1],[0,1]],
                    [[0,1,1],[1,1,0]],
                    [[1,0],[1,1],[0,1]]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [[1,1,0],[0,1,1]],
                    [[0,1],[1,1],[1,0]],
                    [[1,1,0],[0,1,1]],
                    [[0,1],[1,1],[1,0]]
                ],
                color: '#ff0000'
            },
            J: {
                shape: [
                    [[1,0,0],[1,1,1]],
                    [[1,1],[1,0],[1,0]],
                    [[1,1,1],[0,0,1]],
                    [[0,1],[0,1],[1,1]]
                ],
                color: '#0000ff'
            },
            L: {
                shape: [
                    [[0,0,1],[1,1,1]],
                    [[1,0],[1,0],[1,1]],
                    [[1,1,1],[1,0,0]],
                    [[1,1],[0,1],[0,1]]
                ],
                color: '#ffa500'
            }
        };
    };
    this.initializeStageSystem = function() {
        try {
            this.loadGameProgress();
            this.initializeLevelGrid();
            this.updateStageDisplay();
        } catch (error) {}
    };
    this.loadGameProgress = function() {
        try {
            var savedCoins = localStorage.getItem('tetris_coins');
            var savedMVP = localStorage.getItem('tetris_mvp');
            if (savedCoins !== null) {
                this.gameState.coins = parseInt(savedCoins) || 0;
            }
            if (savedMVP !== null) {
                this.gameState.mvpEarned = savedMVP === 'true';
            }
        } catch (error) {}
    };

    this.saveGameProgress = function() {
        try {
            localStorage.setItem('tetris_coins', this.gameState.coins.toString());
            localStorage.setItem('tetris_mvp', this.gameState.mvpEarned.toString());
        } catch (error) {}
    };
    this.initializeLevelGrid = function() {
        var levelGrid = document.getElementById('levelGrid');
        if (!levelGrid) return;
        levelGrid.innerHTML = '';
        for (var i = 1; i <= this.gameState.maxStage; i++) {
            var levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            levelItem.id = 'level-' + i;
            var levelNumber = document.createElement('div');
            levelNumber.className = 'level-number';
            levelNumber.textContent = '第' + i + '关';
            var levelTarget = document.createElement('div');
            levelTarget.className = 'level-target';
            levelTarget.textContent = this.stageConfig[i].target + '分';
            levelItem.appendChild(levelNumber);
            levelItem.appendChild(levelTarget);
            levelGrid.appendChild(levelItem);
        }
    };


    this.updateStageDisplay = function() {
        try {
            for (var i = 1; i <= this.gameState.maxStage; i++) {
                var levelItem = document.getElementById('level-' + i);
                if (levelItem) {
                    levelItem.className = 'level-item';
                    if (i < this.gameState.currentStage) {
                        levelItem.classList.add('completed');
                    } else if (i === this.gameState.currentStage) {
                        levelItem.classList.add('current');
                    } else {
                        levelItem.classList.add('locked');
                    }
                }
            }
            var currentStageEl = document.getElementById('currentStage');
            var stageTargetEl = document.getElementById('stageTarget');
            if (currentStageEl) {
                currentStageEl.textContent = this.gameState.currentStage;
            }
            if (stageTargetEl) {
                var currentConfig = this.stageConfig[this.gameState.currentStage];
                stageTargetEl.textContent = currentConfig ? currentConfig.target : '0';
            }
            var topCoinCountEl = document.getElementById('topCoinCount');
            if (topCoinCountEl) {
                topCoinCountEl.textContent = this.gameState.coins;
            }
            var topMvpTrophy = document.getElementById('topMvpTrophy');
            if (topMvpTrophy) {
                if (this.gameState.mvpEarned) {
                    topMvpTrophy.classList.add('earned');
                } else {
                    topMvpTrophy.classList.remove('earned');
                }
            }
        } catch (error) {}
    };


    this.checkStageCompletion = function() {
        var currentConfig = this.stageConfig[this.gameState.currentStage];
        if (!currentConfig) return false;
        if (this.gameState.score >= currentConfig.target && !this.gameState.stageCompleted) {
            this.gameState.stageCompleted = true;
            this.completeCurrentStage();
            return true;
        }
        return false;
    };


    this.completeCurrentStage = function() {
        try {
            this.gameState.isPaused = true;
            if (soundManager) {
                soundManager.pauseBackgroundMusic();
                soundManager.play('levelUp', 1.2);
            }
            this.gameState.coins++;
            var earnedMVP = false;
            if (this.gameState.coins >= 6 && !this.gameState.mvpEarned) {
                this.gameState.mvpEarned = true;
                earnedMVP = true;
            }
            this.saveGameProgress();
            this.showStageCompleteModal(earnedMVP);
        } catch (error) {}
    };


    this.showStageCompleteModal = function(earnedMVP) {
        try {
            var modal = document.getElementById('levelCompleteModal');
            var stageNumEl = document.getElementById('completedStageNum');
            var stageScoreEl = document.getElementById('stageScore');
            var mvpRewardEl = document.getElementById('mvpReward');
            if (stageNumEl) stageNumEl.textContent = this.gameState.currentStage;
            if (stageScoreEl) stageScoreEl.textContent = this.gameState.score;
            if (mvpRewardEl) {
                mvpRewardEl.style.display = earnedMVP ? 'block' : 'none';
            }
            if (modal) {
                modal.style.display = 'flex';
            }
            this.updateStageDisplay();
        } catch (error) {}
    };


    this.continueToNextStage = function() {
        try {
            var modal = document.getElementById('levelCompleteModal');
            if (modal) {
                modal.style.display = 'none';
            }
            if (this.gameState.currentStage < this.gameState.maxStage) {
                this.gameState.currentStage++;
                var nextConfig = this.stageConfig[this.gameState.currentStage];
                this.gameState.dropSpeed = nextConfig.speed;
                this.gameState.stageCompleted = false;
                this.updateStageDisplay();
                this.updateDisplay();
                this.gameState.isPaused = false;
                if (soundManager) {
                    soundManager.resumeBackgroundMusic();
                }
                this.gameLoop();
            } else {
                this.showFinalVictory();
            }
        } catch (error) {}
    };


    this.showFinalVictory = function() {
        try {
            var levelModal = document.getElementById('levelCompleteModal');
            if (levelModal) {
                levelModal.style.display = 'none';
            }
            var gameOverModal = document.getElementById('gameOverModal');
            var modalContent = gameOverModal.querySelector('.modal-content h2');
            if (modalContent) {
                modalContent.textContent = '🏆 恭喜通关全部关卡！';
                modalContent.style.color = '#ffd700';
            }
            this.showGameOver();
        } catch (error) {}
    };


    this.initialize = function() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            this.nextCanvas = document.getElementById('nextCanvas');
            if (!this.canvas || !this.nextCanvas) {
                throw new Error('无法找到画布元素');
            }
            this.ctx = this.canvas.getContext('2d');
            this.nextCtx = this.nextCanvas.getContext('2d');
            if (!this.ctx || !this.nextCtx) {
                throw new Error('无法获取画布上下文');
            }
            this.grid = this.createEmptyGrid();
            this.shapes = this.initializeShapes();
            this.initializeStageSystem();
            var currentConfig = this.stageConfig[this.gameState.currentStage];
            if (currentConfig) {
                this.gameState.dropSpeed = currentConfig.speed;
            }
            this.setupEventListeners();
            this.generateNewPiece();
            this.generateNewPiece();
            this.updateDisplay();
            this.gameLoop();
        } catch (error) {
            alert('游戏初始化失败，请刷新页面重试');
        }
    };


    this.setupEventListeners = function() {
        var self = this;
        function addUserInteractionListener() {
            function handleUserInteraction(eventType) {
                if (soundManager && !soundManager.audioInitialized) {
                    soundManager.initializeAudioOnUserInteraction();
                }
            }
            document.addEventListener('touchstart', function() { handleUserInteraction('touchstart'); }, { once: false });
            document.addEventListener('touchend', function() { handleUserInteraction('touchend'); }, { once: false });
            document.addEventListener('click', function() { handleUserInteraction('click'); }, { once: false });
            document.addEventListener('keydown', function() { handleUserInteraction('keydown'); }, { once: false });
            document.addEventListener('mousedown', function() { handleUserInteraction('mousedown'); }, { once: false });
            var audioTestBtn = document.getElementById('audioTest');
            if (audioTestBtn) {
                audioTestBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (soundManager) {
                        soundManager.testAudio();
                    }
                });
            }
        }
        addUserInteractionListener();
        function addTouchListener(elementId, action) {
            var element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    action.call(self);
                }, false);
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    action.call(self);
                }, false);
            }
        }
        
        addTouchListener('leftBtn', function() { this.movePiece(-1, 0); });
        addTouchListener('rightBtn', function() { this.movePiece(1, 0); });
        addTouchListener('downBtn', function() { this.movePiece(0, 1); });
        addTouchListener('rotateBtn', function() { this.rotatePiece(); });
        addTouchListener('pauseBtn', function() { this.togglePause(); });
        addTouchListener('dropBtn', function() { this.hardDrop(); });
        document.addEventListener('keydown', function(e) {
            if (self.gameState.isPaused || self.gameState.isGameOver) return;
            
            switch(e.key || e.keyCode) {
                case 'ArrowLeft':
                case 37:
                    self.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 39:
                    self.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 40:
                    self.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case 38:
                    self.rotatePiece();
                    break;
                case ' ':
                case 32:
                    self.hardDrop();
                    break;
            }
            e.preventDefault();
        }, false);
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    };


    this.generateNewPiece = function() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        }
        var shapeKeys = Object.keys(this.shapes);
        var randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        this.nextPiece = {
            type: randomKey,
            x: Math.floor(this.GRID_WIDTH / 2) - 1,
            y: 0,
            rotation: 0,
            shape: this.shapes[randomKey].shape[0],
            color: this.shapes[randomKey].color
        };
        if (!this.currentPiece) {
            this.currentPiece = this.nextPiece;
            this.generateNewPiece();
        }
        if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameState.isGameOver = true;
            this.showGameOver();
        }
    };


    this.movePiece = function(dx, dy, isUserAction) {
        if (this.gameState.isPaused || this.gameState.isGameOver) return false;
        if (typeof isUserAction === 'undefined') {
            isUserAction = true;
        }
        var newX = this.currentPiece.x + dx;
        var newY = this.currentPiece.y + dy;
        if (!this.checkCollision(this.currentPiece, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            if (isUserAction && soundManager) {
                if (dx < 0) {
                    soundManager.play('left');
                } else if (dx > 0) {
                    soundManager.play('right');
                } else if (dy > 0) {
                    soundManager.play('down');
                }
            }
            return true;
        }
        if (dy > 0) {
            if (soundManager) {
                soundManager.play('place');
            }
            this.placePiece();
            this.clearLines();
            this.generateNewPiece();
        }
        return false;
    };


    this.rotatePiece = function() {
        if (this.gameState.isPaused || this.gameState.isGameOver) return;

        var currentRotation = this.currentPiece.rotation;
        var newRotation = (currentRotation + 1) % 4;
        var newShape = this.shapes[this.currentPiece.type].shape[newRotation];

        var tempPiece = {
            type: this.currentPiece.type,
            x: this.currentPiece.x,
            y: this.currentPiece.y,
            rotation: newRotation,
            shape: newShape,
            color: this.currentPiece.color
        };

        var kickTests = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];

        for (var i = 0; i < kickTests.length; i++) {
            var testX = this.currentPiece.x + kickTests[i][0];
            var testY = this.currentPiece.y + kickTests[i][1];

            if (!this.checkCollision(tempPiece, testX, testY)) {
                this.currentPiece.rotation = newRotation;
                this.currentPiece.shape = newShape;
                this.currentPiece.x = testX;
                this.currentPiece.y = testY;
                if (soundManager) {
                    soundManager.play('rotate');
                }
                return;
            }
        }
    };
    this.hardDrop = function() {
        if (this.gameState.isPaused || this.gameState.isGameOver) return;
        if (soundManager) {
            soundManager.play('drop');
        }
        var dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        this.gameState.score += dropDistance * 2;
        this.updateDisplay();
    };
    this.checkCollision = function(piece, x, y) {
        for (var row = 0; row < piece.shape.length; row++) {
            for (var col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    var gridX = x + col;
                    var gridY = y + row;

                    if (gridX < 0 || gridX >= this.GRID_WIDTH || gridY >= this.GRID_HEIGHT) {
                        return true;
                    }

                    if (gridY >= 0 && this.grid[gridY][gridX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    this.placePiece = function() {
        for (var row = 0; row < this.currentPiece.shape.length; row++) {
            for (var col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    var gridY = this.currentPiece.y + row;
                    var gridX = this.currentPiece.x + col;
                    
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
    };
    this.clearLines = function() {
        var linesCleared = 0;
        for (var y = this.GRID_HEIGHT - 1; y >= 0; y--) {
            var isComplete = true;
            for (var x = 0; x < this.GRID_WIDTH; x++) {
                if (this.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                this.grid.splice(y, 1);
                var newRow = [];
                for (var i = 0; i < this.GRID_WIDTH; i++) {
                    newRow.push(0);
                }
                this.grid.unshift(newRow);
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            if (soundManager) {
                var clearVolumeMultiplier = Math.min(1.5, 1 + (linesCleared - 1) * 0.2);
                soundManager.play('clear', clearVolumeMultiplier);
            }
            var scores = [0, 40, 100, 300, 1200];
            this.gameState.score += scores[linesCleared] * this.gameState.level;
            this.gameState.lines += linesCleared;
            if (soundManager) {
                var scoreVolumeMultiplier = Math.min(1.3, 1 + (linesCleared - 1) * 0.15);
                soundManager.play('score', scoreVolumeMultiplier);
            }
            var newLevel = Math.floor(this.gameState.lines / 10) + 1;
            if (newLevel > this.gameState.level) {
                this.gameState.level = newLevel;
                this.gameState.dropSpeed = Math.max(50, 500 - (this.gameState.level - 1) * 45);
                if (soundManager) {
                    soundManager.play('levelUp');
                }
            }
            this.updateDisplay();
            this.checkStageCompletion();
        }
    };
    this.gameLoop = function(currentTime) {
        if (self.gameState.isGameOver) return;
        currentTime = currentTime || 0;
        var deltaTime = currentTime - self.lastTime;
        self.lastTime = currentTime;
        self.accumulator += deltaTime;

        if (!self.gameState.isPaused && self.accumulator >= self.gameState.dropSpeed) {
            self.movePiece(0, 1, false);
            self.accumulator = 0;
        }
        self.render();
        if (window.requestAnimationFrame) {
            self.animationId = requestAnimationFrame(function(time) {
                self.gameLoop(time);
            });
        } else {
            setTimeout(function() {
                self.gameLoop(Date.now());
            }, 16);
        }
    };
    this.render = function() {
        try {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrid();
            this.drawPlacedPieces();
            if (this.currentPiece) {
                this.drawPiece(this.currentPiece, this.ctx);
            }
            this.drawNextPiece();
        } catch (error) {}
    };
    this.drawGrid = function() {
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        this.ctx.lineWidth = 0.5;
        for (var x = 0; x <= this.GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.CELL_SIZE, 0);
            this.ctx.lineTo(x * this.CELL_SIZE, this.GRID_HEIGHT * this.CELL_SIZE);
            this.ctx.stroke();
        }
        for (var y = 0; y <= this.GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.CELL_SIZE);
            this.ctx.lineTo(this.GRID_WIDTH * this.CELL_SIZE, y * this.CELL_SIZE);
            this.ctx.stroke();
        }
    };
    this.drawPlacedPieces = function() {
        for (var y = 0; y < this.GRID_HEIGHT; y++) {
            for (var x = 0; x < this.GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.drawCell(x * this.CELL_SIZE, y * this.CELL_SIZE, this.grid[y][x], this.ctx);
                }
            }
        }
    };
    this.drawPiece = function(piece, context) {
        for (var row = 0; row < piece.shape.length; row++) {
            for (var col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    var x = (piece.x + col) * this.CELL_SIZE;
                    var y = (piece.y + row) * this.CELL_SIZE;
                    this.drawCell(x, y, piece.color, context);
                }
            }
        }
    };
    this.drawCell = function(x, y, color, context) {
        context.fillStyle = color;
        context.fillRect(x + 1, y + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.strokeRect(x + 1, y + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
    };
    this.drawNextPiece = function() {
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        if (this.nextPiece) {
            var cellSize = 14;
            var centerX = (this.nextCanvas.width - this.nextPiece.shape[0].length * cellSize) / 2;
            var centerY = (this.nextCanvas.height - this.nextPiece.shape.length * cellSize) / 2;

            for (var row = 0; row < this.nextPiece.shape.length; row++) {
                for (var col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        var x = centerX + col * cellSize;
                        var y = centerY + row * cellSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(x, y, cellSize - 2, cellSize - 2);
                        
                        this.nextCtx.strokeStyle = this.nextPiece.color;
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(x, y, cellSize - 2, cellSize - 2);
                    }
                }
            }
        }
    };
    this.updateDisplay = function() {
        try {
            var scoreEl = document.getElementById('score');
            var levelEl = document.getElementById('level');
            var linesEl = document.getElementById('lines');
            var targetEl = document.getElementById('target');
            var speedEl = document.getElementById('speed');
            if (scoreEl) scoreEl.textContent = this.gameState.score;
            if (levelEl) levelEl.textContent = this.gameState.level;
            if (linesEl) linesEl.textContent = this.gameState.lines;
            if (targetEl) targetEl.textContent = this.gameState.level * 10;
            if (speedEl) speedEl.textContent = this.gameState.dropSpeed;
            this.updateStageDisplay();
        } catch (error) {}
    };
    this.togglePause = function() {
        this.gameState.isPaused = !this.gameState.isPaused;
        if (soundManager) {
            soundManager.play('pause');
            if (this.gameState.isPaused) {
                soundManager.pauseBackgroundMusic();
            } else {
                soundManager.resumeBackgroundMusic();
            }
        }
        var pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.gameState.isPaused ? '▶ 继续' : '⏸ 暂停';
        }
        if (!this.gameState.isPaused && !this.gameState.isGameOver) {
            this.gameLoop();
        }
    };
    this.showGameOver = function() {
        try {
            if (soundManager) {
                soundManager.pauseBackgroundMusic();
                soundManager.play('gameOver');
            }
            var finalScoreEl = document.getElementById('finalScore');
            var finalLinesEl = document.getElementById('finalLines');
            var finalLevelEl = document.getElementById('finalLevel');
            var finalStageEl = document.getElementById('finalStage');
            var modalEl = document.getElementById('gameOverModal');
            if (finalScoreEl) finalScoreEl.textContent = this.gameState.score;
            if (finalLinesEl) finalLinesEl.textContent = this.gameState.lines;
            if (finalLevelEl) finalLevelEl.textContent = this.gameState.level;
            if (finalStageEl) finalStageEl.textContent = this.gameState.currentStage;
            if (modalEl) modalEl.style.display = 'flex';
            if (this.animationId) {
                if (window.cancelAnimationFrame) {
                    cancelAnimationFrame(this.animationId);
                } else {
                    clearTimeout(this.animationId);
                }
            }
        } catch (error) {}
    };
    this.reset = function() {
        var savedCoins = this.gameState.coins;
        var savedMVP = this.gameState.mvpEarned;
        this.gameState = {
            score: 0,
            level: 1,
            lines: 0,
            isPaused: false,
            isGameOver: false,
            dropSpeed: 500,
            currentStage: 1,
            maxStage: 6,
            stageCompleted: false,
            coins: savedCoins,
            mvpEarned: savedMVP
        };
        this.grid = this.createEmptyGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.lastTime = 0;
        this.accumulator = 0;
        var firstStageConfig = this.stageConfig[1];
        if (firstStageConfig) {
            this.gameState.dropSpeed = firstStageConfig.speed;
        }
        var modalEl = document.getElementById('gameOverModal');
        var levelModalEl = document.getElementById('levelCompleteModal');
        var pauseBtn = document.getElementById('pauseBtn');
        if (modalEl) modalEl.style.display = 'none';
        if (levelModalEl) levelModalEl.style.display = 'none';
        if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
        if (soundManager) {
            soundManager.resumeBackgroundMusic();
        }
        this.generateNewPiece();
        this.generateNewPiece();
        this.updateDisplay();
        this.gameLoop();
    };
}
var game;
function initSoundControls() {
    var bgMusicToggle = document.getElementById('bgMusicToggle');
    var soundToggle = document.getElementById('soundToggle');
    
    if (bgMusicToggle) {
        bgMusicToggle.addEventListener('click', function() {
            if (soundManager) {
                var isEnabled = soundManager.bgMusicEnabled;
                soundManager.setBgMusicEnabled(!isEnabled);
                updateSoundControlUI();
            }
        });
    }
    if (soundToggle) {
        soundToggle.addEventListener('click', function() {
            if (soundManager) {
                var isEnabled = soundManager.enabled;
                soundManager.setEnabled(!isEnabled);
                updateSoundControlUI();
            }
        });
    }
    updateSoundControlUI();
}
function updateSoundControlUI() {
    var bgMusicToggle = document.getElementById('bgMusicToggle');
    var soundToggle = document.getElementById('soundToggle');
    
    if (soundManager && bgMusicToggle) {
        if (soundManager.bgMusicEnabled) {
            bgMusicToggle.classList.remove('disabled');
            bgMusicToggle.textContent = '🎵 音乐';
        } else {
            bgMusicToggle.classList.add('disabled');
            bgMusicToggle.textContent = '🔇 音乐';
        }
    }
    if (soundManager && soundToggle) {
        if (soundManager.enabled) {
            soundToggle.classList.remove('disabled');
            soundToggle.textContent = '🔊 音效';
        } else {
            soundToggle.classList.add('disabled');
            soundToggle.textContent = '🔇 音效';
        }
    }
}
function initGame() {
    try {
        soundManager = new SoundManager();
        soundManager.initialize();
        initSoundControls();
        game = new TetrisGame();
        game.initialize();
    } catch (error) {
        alert('游戏加载失败，请刷新页面重试');
    }
}
function resetGame() {
    if (game) {
        game.reset();
    }
}
function continueToNextStage() {
    if (game && typeof game.continueToNextStage === 'function') {
        game.continueToNextStage();
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});