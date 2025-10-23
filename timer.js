// Timer functionality for tooth brushing
class BrushingTimer {
    constructor() {
        this.duration = 120; // 2 minutes in seconds
        this.currentTime = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.currentType = null; // 'morning' or 'evening'
        
        this.tips = [
            'Dişlerini yumuşak hareketlerle fırçala!',
            'Dişlerinin ön ve arka yüzeylerini unutma!',
            'Diş etlerini de nazikçe fırçala!',
            'Çiğneme yüzeylerini iyice temizle!',
            'Dilini de fırçalamayı unutma!',
            'Dairesel hareketler yap!',
            'Çok sert basma, nazik ol!',
            'Her dişini eşit süre fırçala!',
            'Ağzının her köşesine ulaş!',
            'Harika gidiyorsun, devam et!'
        ];
        
        this.currentTipIndex = 0;
        this.tipInterval = null;
        
        this.bindEvents();
    }

    bindEvents() {
        // Timer control buttons
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        const stopBtn = document.getElementById('stopTimerBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
    }

    start() {
        if (this.isPaused) {
            this.resume();
            return;
        }
        
        this.isRunning = true;
        this.currentTime = this.duration;
        this.updateDisplay();
        this.updateButtons();
        this.startTipRotation();
        
        this.interval = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.currentTime <= 0) {
                this.complete();
            }
        }, 1000);
        
        // Start brushing animation
        this.startBrushingAnimation();
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.interval);
            this.stopTipRotation();
            this.updateButtons();
            this.stopBrushingAnimation();
        }
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.start();
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = this.duration;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.stopTipRotation();
        this.updateDisplay();
        this.updateProgress();
        this.updateButtons();
        this.stopBrushingAnimation();
    }

    complete() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.stopTipRotation();
        this.stopBrushingAnimation();
        
        // Record the brushing session
        if (this.currentType) {
            dataManager.addBrushingRecord(this.currentType, this.duration);
        }
        
        // Show completion message
        this.showCompletionMessage();
        
        // Update buttons
        this.updateButtons();
        
        // Auto-navigate back to dashboard after 3 seconds
        setTimeout(() => {
            this.navigateBack();
        }, 3000);
    }

    updateDisplay() {
        const timerTimeElement = document.getElementById('timerTime');
        if (timerTimeElement) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = this.currentTime % 60;
            timerTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateProgress() {
        const progressElement = document.getElementById('timerProgress');
        if (progressElement) {
            const progress = ((this.duration - this.currentTime) / this.duration) * 360;
            progressElement.style.transform = `rotate(${progress}deg)`;
        }
    }

    updateButtons() {
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        const stopBtn = document.getElementById('stopTimerBtn');
        
        if (startBtn && pauseBtn && stopBtn) {
            if (!this.isRunning && !this.isPaused) {
                // Initial state
                startBtn.style.display = 'block';
                pauseBtn.style.display = 'none';
                stopBtn.style.display = 'none';
                startBtn.textContent = 'Başla';
            } else if (this.isRunning && !this.isPaused) {
                // Running state
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'block';
                stopBtn.style.display = 'block';
            } else if (this.isPaused) {
                // Paused state
                startBtn.style.display = 'block';
                pauseBtn.style.display = 'none';
                stopBtn.style.display = 'block';
                startBtn.textContent = 'Devam Et';
            }
        }
    }

    startTipRotation() {
        this.updateTip();
        this.tipInterval = setInterval(() => {
            this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
            this.updateTip();
        }, 10000); // Change tip every 10 seconds
    }

    stopTipRotation() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    updateTip() {
        const tipElement = document.getElementById('timerTip');
        if (tipElement) {
            tipElement.textContent = this.tips[this.currentTipIndex];
            tipElement.style.animation = 'none';
            setTimeout(() => {
                tipElement.style.animation = 'fadeIn 0.5s ease-in-out';
            }, 10);
        }
    }

    startBrushingAnimation() {
        const animationElement = document.getElementById('brushingAnimation');
        if (animationElement) {
            animationElement.style.animation = 'brushing 1s infinite';
        }
    }

    stopBrushingAnimation() {
        const animationElement = document.getElementById('brushingAnimation');
        if (animationElement) {
            animationElement.style.animation = 'none';
        }
    }

    showCompletionMessage() {
        const tipElement = document.getElementById('timerTip');
        const animationElement = document.getElementById('brushingAnimation');
        
        if (tipElement) {
            tipElement.innerHTML = '🎉 Tebrikler! Dişlerini mükemmel fırçaladın! 🎉';
            tipElement.style.color = '#10B981';
            tipElement.style.fontWeight = 'bold';
        }
        
        if (animationElement) {
            animationElement.innerHTML = '🎉 🦷 ✨ 🎉';
            animationElement.style.animation = 'bounce 1s infinite';
        }
        
        // Play success sound (if available)
        this.playSuccessSound();
        
        // Show confetti effect
        this.showConfetti();
    }

    playSuccessSound() {
        // Create a simple success sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    showConfetti() {
        // Simple confetti effect using CSS animations
        const timerContainer = document.querySelector('.timer-container');
        if (timerContainer) {
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.innerHTML = ['🎉', '⭐', '✨', '🏆', '🎊'][Math.floor(Math.random() * 5)];
                confetti.style.position = 'absolute';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '0%';
                confetti.style.fontSize = '1.5rem';
                confetti.style.animation = `fall ${2 + Math.random() * 2}s linear forwards`;
                confetti.style.zIndex = '1000';
                
                timerContainer.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 4000);
            }
        }
    }

    navigateBack() {
        // Navigate back to dashboard and refresh data
        if (window.app) {
            window.app.showScreen('dashboard');
            window.app.updateDashboard();
        }
    }

    setType(type) {
        this.currentType = type;
        const titleElement = document.getElementById('timerTitle');
        if (titleElement) {
            titleElement.textContent = type === 'morning' ? 'Sabah Fırçalama' : 'Akşam Fırçalama';
        }
    }

    reset() {
        this.stop();
        this.currentType = null;
    }
}

// Add CSS for confetti animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize global timer
const brushingTimer = new BrushingTimer();