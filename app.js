// Enhanced Main application logic with backend integration
class ToothBrushingApp {
    constructor() {
        this.currentScreen = 'loading';
        this.init();
    }

    async init() {
        // Show loading screen briefly
        await this.delay(1500);
        
        // Check if user is registered
        const user = dataManager.getUser();
        if (user) {
            this.showScreen('dashboard');
            this.updateDashboard();
        } else {
            this.showScreen('auth');
        }
        
        this.bindEvents();
        this.setupNotifications();
        this.updateSyncStatus();
        
        // Set up periodic sync status updates
        setInterval(() => this.updateSyncStatus(), 30000); // Every 30 seconds
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    bindEvents() {
        // Registration form
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleRegistration());
        }

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Brushing buttons
        const morningBtn = document.getElementById('morningBtn');
        const eveningBtn = document.getElementById('eveningBtn');
        
        if (morningBtn) {
            morningBtn.addEventListener('click', () => this.startBrushing('morning'));
        }
        
        if (eveningBtn) {
            eveningBtn.addEventListener('click', () => this.startBrushing('evening'));
        }

        // Timer back button
        const timerBackBtn = document.getElementById('timerBackBtn');
        if (timerBackBtn) {
            timerBackBtn.addEventListener('click', () => {
                brushingTimer.reset();
                this.showScreen('dashboard');
            });
        }

        // Settings and profile
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showScreen('profile'));
        }

        // Profile actions
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testBackendConnection());
        }

        // Stats period buttons
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                periodBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateStats(e.currentTarget.dataset.period);
            });
        });

        // Avatar selection
        this.setupAvatarSelection();
        
        // Backend URL input in auth screen
        const backendUrlInput = document.getElementById('backendUrl');
        if (backendUrlInput) {
            backendUrlInput.addEventListener('change', (e) => {
                if (e.target.value) {
                    apiService.baseURL = e.target.value;
                    localStorage.setItem('backendUrl', e.target.value);
                }
            });
            
            // Load saved backend URL
            const savedUrl = localStorage.getItem('backendUrl');
            if (savedUrl) {
                backendUrlInput.value = savedUrl;
                apiService.baseURL = savedUrl;
            }
        }
    }

    showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Update navigation
            this.updateNavigation(screenName);
            
            // Update screen content
            this.updateScreenContent(screenName);
        }
    }

    updateNavigation(screenName) {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });
    }

    updateScreenContent(screenName) {
        switch (screenName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'stats':
                this.updateStats('week');
                break;
            case 'profile':
                this.updateProfile();
                break;
        }
    }

    async handleRegistration() {
        const parentName = document.getElementById('parentName').value.trim();
        const parentPhone = document.getElementById('parentPhone').value.trim();
        const childName = document.getElementById('childName').value.trim();
        const childAge = document.getElementById('childAge').value;
        const backendUrl = document.getElementById('backendUrl').value.trim();

        // Validation
        if (!parentName || !parentPhone || !childName || !childAge) {
            alert('Lütfen tüm alanları doldurun!');
            return;
        }

        if (parentPhone.length < 10) {
            alert('Lütfen geçerli bir telefon numarası girin!');
            return;
        }

        // Set backend URL if provided
        if (backendUrl) {
            apiService.baseURL = backendUrl;
            localStorage.setItem('backendUrl', backendUrl);
        }

        // Show loading
        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn.textContent;
        registerBtn.textContent = 'Kaydediliyor...';
        registerBtn.disabled = true;

        try {
            // Register user (will try backend first, fallback to local)
            const user = await dataManager.registerUser(parentName, parentPhone, childName, childAge);
            
            if (user) {
                this.showScreen('dashboard');
                this.updateDashboard();
                this.showWelcomeMessage();
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            registerBtn.textContent = originalText;
            registerBtn.disabled = false;
        }
    }

    showWelcomeMessage() {
        // Create welcome modal or toast
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-toast';
        welcomeMsg.innerHTML = `
            <div class="toast-content">
                <h3>🎉 Hoş Geldin ${dataManager.getUser().childName}!</h3>
                <p>Sağlıklı dişler için maceraya başlayalım!</p>
            </div>
        `;
        
        document.body.appendChild(welcomeMsg);
        
        setTimeout(() => {
            welcomeMsg.remove();
        }, 4000);
    }

    async updateDashboard() {
        const user = dataManager.getUser();
        if (!user) return;

        // Update user info
        document.getElementById('userName').textContent = `Merhaba ${user.childName}!`;
        document.getElementById('userStreak').textContent = `🔥 ${user.currentStreak} gün seri`;
        document.getElementById('userAvatar').textContent = dataManager.getSettings().selectedAvatar;

        // Update today's brushing status
        await this.updateTodaysBrushing();
        
        // Update badges
        this.updateBadgesDisplay();
        
        // Update week stats
        await this.updateWeekStatsPreview();
    }

    async updateTodaysBrushing() {
        const morningDone = dataManager.hasBrushedToday('morning');
        const eveningDone = dataManager.hasBrushedToday('evening');

        // Morning card
        const morningCard = document.getElementById('morningCard');
        const morningStatus = document.getElementById('morningStatus');
        const morningBtn = document.getElementById('morningBtn');

        if (morningDone) {
            morningCard.classList.add('completed');
            morningStatus.textContent = 'Tamamlandı! ✅';
            morningStatus.classList.add('completed');
            morningBtn.textContent = 'Tamamlandı';
            morningBtn.disabled = true;
        } else {
            morningCard.classList.remove('completed');
            morningStatus.textContent = 'Henüz fırçalanmadı';
            morningStatus.classList.remove('completed');
            morningBtn.textContent = 'Fırçala!';
            morningBtn.disabled = false;
        }

        // Evening card
        const eveningCard = document.getElementById('eveningCard');
        const eveningStatus = document.getElementById('eveningStatus');
        const eveningBtn = document.getElementById('eveningBtn');

        if (eveningDone) {
            eveningCard.classList.add('completed');
            eveningStatus.textContent = 'Tamamlandı! ✅';
            eveningStatus.classList.add('completed');
            eveningBtn.textContent = 'Tamamlandı';
            eveningBtn.disabled = true;
        } else {
            eveningCard.classList.remove('completed');
            eveningStatus.textContent = 'Henüz fırçalanmadı';
            eveningStatus.classList.remove('completed');
            eveningBtn.textContent = 'Fırçala!';
            eveningBtn.disabled = false;
        }
    }

    updateBadgesDisplay() {
        const badgesGrid = document.getElementById('badgesGrid');
        if (!badgesGrid) return;

        const badges = dataManager.getBadges();
        badgesGrid.innerHTML = '';

        badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge-item ${badge.status}`;
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            `;
            
            // Add tooltip
            badgeElement.title = badge.description;
            
            badgesGrid.appendChild(badgeElement);
        });
    }

    async updateWeekStatsPreview() {
        const weekStatsElement = document.getElementById('weekStats');
        if (!weekStatsElement) return;

        const weekStats = await dataManager.getWeekStats();
        weekStatsElement.innerHTML = '';

        weekStats.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = `day-stat ${day.status}`;
            dayElement.innerHTML = `
                <div class="day-name">${day.dayName}</div>
                <div class="day-status">
                    ${day.status === 'completed' ? '✅' : 
                      day.status === 'partial' ? '⚠️' : '❌'}
                </div>
            `;
            weekStatsElement.appendChild(dayElement);
        });
    }

    startBrushing(type) {
        brushingTimer.setType(type);
        this.showScreen('timer');
    }

    async updateStats(period) {
        const currentStreakElement = document.getElementById('currentStreak');
        const totalBadgesElement = document.getElementById('totalBadges');
        const totalTimeElement = document.getElementById('totalTime');
        const calendarViewElement = document.getElementById('calendarView');

        const user = dataManager.getUser();
        if (!user) return;

        // Update summary stats
        if (currentStreakElement) {
            currentStreakElement.textContent = user.currentStreak;
        }
        
        if (totalBadgesElement) {
            totalBadgesElement.textContent = dataManager.getEarnedBadgesCount();
        }
        
        if (totalTimeElement) {
            const totalMinutes = Math.floor(await dataManager.getTotalBrushingTime() / 60);
            totalTimeElement.textContent = totalMinutes;
        }

        // Update calendar view
        if (calendarViewElement) {
            await this.updateCalendarView(calendarViewElement, period);
        }
    }

    async updateCalendarView(container, period) {
        const days = period === 'week' ? 7 : 30;
        const records = await dataManager.getBrushingRecords(days);
        const dailyRecords = dataManager.groupRecordsByDate(records);

        container.innerHTML = '<h4>Fırçalama Geçmişi</h4>';
        
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        calendarGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
            margin-top: 1rem;
        `;

        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const dayRecords = dailyRecords[dateString] || [];
            const hasMorning = dayRecords.some(r => r.type === 'morning');
            const hasEvening = dayRecords.some(r => r.type === 'evening');
            
            let status = 'missed';
            if (hasMorning && hasEvening) status = 'completed';
            else if (hasMorning || hasEvening) status = 'partial';

            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${status}`;
            dayElement.style.cssText = `
                aspect-ratio: 1;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: 500;
                ${status === 'completed' ? 'background: #10B981; color: white;' :
                  status === 'partial' ? 'background: #F59E0B; color: white;' :
                  'background: #F3F4F6; color: #6B7280;'}
            `;
            dayElement.textContent = date.getDate();
            dayElement.title = `${date.toLocaleDateString('tr-TR')} - ${
                status === 'completed' ? 'Tam tamamlandı' :
                status === 'partial' ? 'Kısmen tamamlandı' :
                'Tamamlanmadı'
            }`;
            
            calendarGrid.appendChild(dayElement);
        }

        container.appendChild(calendarGrid);
    }

    updateProfile() {
        const user = dataManager.getUser();
        const settings = dataManager.getSettings();
        
        if (!user) return;

        // Update profile info
        document.getElementById('profileName').textContent = user.childName;
        document.getElementById('profileAge').textContent = `${user.childAge} yaş`;
        document.getElementById('profileAvatar').textContent = settings.selectedAvatar;

        // Update settings
        document.getElementById('morningReminder').value = settings.morningReminder;
        document.getElementById('eveningReminder').value = settings.eveningReminder;
        document.getElementById('notificationsToggle').checked = settings.notifications;
        
        // Update backend URL
        const savedUrl = localStorage.getItem('backendUrl');
        if (savedUrl) {
            document.getElementById('profileBackendUrl').value = savedUrl;
        }

        // Update avatar selection
        this.updateAvatarSelection();
    }

    setupAvatarSelection() {
        const avatarsGrid = document.getElementById('avatarsGrid');
        if (!avatarsGrid) return;

        const avatars = dataManager.data.avatars;
        avatarsGrid.innerHTML = '';

        avatars.forEach(avatar => {
            const avatarElement = document.createElement('div');
            avatarElement.className = 'avatar-option';
            avatarElement.textContent = avatar;
            
            avatarElement.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.avatar-option').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Select current avatar
                avatarElement.classList.add('selected');
                
                // Update profile avatar display
                document.getElementById('profileAvatar').textContent = avatar;
            });
            
            avatarsGrid.appendChild(avatarElement);
        });
    }

    updateAvatarSelection() {
        const currentAvatar = dataManager.getSettings().selectedAvatar;
        const avatarOptions = document.querySelectorAll('.avatar-option');
        
        avatarOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.textContent === currentAvatar) {
                option.classList.add('selected');
            }
        });
    }

    async saveProfile() {
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        const morningReminder = document.getElementById('morningReminder').value;
        const eveningReminder = document.getElementById('eveningReminder').value;
        const notifications = document.getElementById('notificationsToggle').checked;
        const backendUrl = document.getElementById('profileBackendUrl').value.trim();

        const newSettings = {
            selectedAvatar: selectedAvatar ? selectedAvatar.textContent : dataManager.getSettings().selectedAvatar,
            morningReminder,
            eveningReminder,
            notifications
        };

        // Update backend URL if changed
        if (backendUrl && backendUrl !== apiService.baseURL) {
            apiService.baseURL = backendUrl;
            localStorage.setItem('backendUrl', backendUrl);
        }

        try {
            await dataManager.updateSettings(newSettings);
            
            // Update dashboard avatar
            document.getElementById('userAvatar').textContent = newSettings.selectedAvatar;
            
            // Show success message
            this.showToast('Profil başarıyla kaydedildi! ✅');
            
            // Update notifications
            if (notifications) {
                this.scheduleNotifications(morningReminder, eveningReminder);
            }
        } catch (error) {
            console.error('Profile save error:', error);
            this.showToast('Profil kaydedilirken hata oluştu ❌', 'error');
        }
    }

    async testBackendConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const backendUrl = document.getElementById('profileBackendUrl').value.trim();
        
        if (!backendUrl) {
            this.showToast('Lütfen backend URL girin', 'error');
            return;
        }
        
        testBtn.textContent = 'Test ediliyor...';
        testBtn.disabled = true;
        
        try {
            // Temporarily set the URL for testing
            const originalUrl = apiService.baseURL;
            apiService.baseURL = backendUrl;
            
            // Try to make a simple request
            const response = await fetch(`${backendUrl}/health`);
            
            if (response.ok) {
                this.showToast('Backend bağlantısı başarılı! ✅');
                localStorage.setItem('backendUrl', backendUrl);
            } else {
                throw new Error('Backend yanıt vermiyor');
            }
        } catch (error) {
            console.error('Backend test failed:', error);
            this.showToast('Backend bağlantısı başarısız ❌', 'error');
            // Restore original URL
            const originalUrl = localStorage.getItem('backendUrl');
            if (originalUrl) {
                apiService.baseURL = originalUrl;
            }
        } finally {
            testBtn.textContent = 'Test Et';
            testBtn.disabled = false;
        }
    }

    exportData() {
        try {
            const data = dataManager.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dis-fircalama-verileri-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Veriler başarıyla dışa aktarıldı! 📥');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Veri dışa aktarımında hata oluştu ❌', 'error');
        }
    }

    logout() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz? Tüm verileriniz silinecek.')) {
            dataManager.clearAllData();
            location.reload();
        }
    }

    updateSyncStatus() {
        const syncStatus = document.getElementById('syncStatus');
        if (!syncStatus) return;
        
        const syncIcon = syncStatus.querySelector('.sync-icon');
        const syncText = syncStatus.querySelector('.sync-text');
        
        if (navigator.onLine) {
            syncIcon.textContent = '📶';
            syncText.textContent = 'Çevrimiçi';
            syncStatus.className = 'sync-status online';
        } else {
            syncIcon.textContent = '📵';
            syncText.textContent = 'Çevrimdışı';
            syncStatus.className = 'sync-status offline';
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#EF4444' : '#10B981'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    setupNotifications() {
        // Request notification permission
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.registerServiceWorker();
                }
            });
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }

    scheduleNotifications(morningTime, eveningTime) {
        // This would typically be handled by the service worker
        // For now, we'll just store the preferences
        console.log('Notifications scheduled for:', morningTime, eveningTime);
    }
}

// Add enhanced styles
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
    .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .sync-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        font-size: 0.8rem;
    }
    
    .sync-status.offline {
        background: rgba(239, 68, 68, 0.2);
    }
    
    .backend-config {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #E5E7EB;
    }
    
    .backend-config details {
        cursor: pointer;
    }
    
    .backend-config summary {
        color: #6B7280;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .backend-config small {
        display: block;
        color: #6B7280;
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }
    
    .backend-url-input {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .backend-url-input input {
        flex: 1;
    }
    
    .toast.error {
        background: #EF4444 !important;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .welcome-toast {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideUp 0.5s ease-out;
        text-align: center;
        max-width: 300px;
    }
    
    .toast-content h3 {
        color: #4F46E5;
        margin-bottom: 1rem;
    }
    
    .toast-content p {
        color: #6B7280;
    }
    
    .brush-card.completed {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
    }
    
    .brush-card.completed .card-icon {
        filter: brightness(1.2);
    }
`;
document.head.appendChild(enhancedStyle);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ToothBrushingApp();
});

// Make app globally available
window.ToothBrushingApp = ToothBrushingApp;