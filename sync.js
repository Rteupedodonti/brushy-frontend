// Global Variables
let currentParent = null;
let currentChild = null;
let children = [];
let currentScreen = 'auth-screen';
let isAdminMode = false;
let debugMode = false;

// Admin Configuration
const ADMIN_PASSWORD = 'admin2024'; // Change this in production
const ADMIN_SESSION_KEY = 'toothbrush_admin_session';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkDebugMode();
    checkAuthStatus();
    checkAdminSession();
});

function initializeApp() {
    // Load data from storage
    loadParentData();
    loadChildrenData();
    
    // Setup avatars
    setupAvatarSelection();
    
    // Setup auth tabs
    setupAuthTabs();
    
    // Initialize sync status
    updateSyncStatus();
}

function checkDebugMode() {
    const adminSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    debugMode = adminSettings.debugMode || false;
    
    if (debugMode) {
        console.log('🐛 DEBUG MODE ACTIVE');
        // Skip auth screen in debug mode
        const parent = getParentData();
        if (!parent) {
            // Create a debug parent automatically
            const debugParent = {
                id: 'debug-parent-' + Date.now(),
                name: 'Debug Veli',
                phone: '05551234567',
                email: 'debug@test.com',
                created_at: new Date().toISOString()
            };
            currentParent = debugParent;
            saveParentData(debugParent);
            console.log('🐛 Debug parent created:', debugParent);
        }
        
        // Load debug children if none exist
        const existingChildren = getChildrenData();
        if (existingChildren.length === 0) {
            const debugChildren = [
                {
                    id: 'debug-child-1',
                    parent_id: currentParent.id,
                    name: 'Test Çocuk 1',
                    age: 5,
                    avatar: 2,
                    current_streak: 3,
                    longest_streak: 7,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'debug-child-2',
                    parent_id: currentParent.id,
                    name: 'Test Çocuk 2',
                    age: 8,
                    avatar: 5,
                    current_streak: 1,
                    longest_streak: 4,
                    created_at: new Date().toISOString()
                }
            ];
            children = debugChildren;
            saveChildrenData(debugChildren);
            console.log('🐛 Debug children created:', debugChildren);
        }
        
        // Show debug info panel
        showDebugPanel();
    }
}

function showDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: #00ff00;
        padding: 10px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        max-width: 300px;
        border: 2px solid #00ff00;
    `;
    
    debugPanel.innerHTML = `
        <div style="color: #ff6b6b; font-weight: bold; margin-bottom: 5px;">🐛 DEBUG MODE</div>
        <div>Parent: ${currentParent?.name || 'None'}</div>
        <div>Children: ${children.length}</div>
        <div>Screen: <span id="debug-screen">${currentScreen}</span></div>
        <div>Backend: <span id="debug-backend">${getBackendUrl() || 'Local'}</span></div>
        <button onclick="toggleDebugDetails()" style="margin-top: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 2px 6px; border-radius: 3px; cursor: pointer;">Details</button>
        <div id="debug-details" style="display: none; margin-top: 5px; font-size: 10px;">
            <div>LocalStorage Keys:</div>
            <div style="margin-left: 10px;">
                ${Object.keys(localStorage).filter(k => k.startsWith('toothbrush_')).map(k => `• ${k}`).join('<br>')}
            </div>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
}

function toggleDebugDetails() {
    const details = document.getElementById('debug-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

function updateDebugPanel() {
    if (!debugMode) return;
    
    const screenSpan = document.getElementById('debug-screen');
    const backendSpan = document.getElementById('debug-backend');
    
    if (screenSpan) screenSpan.textContent = currentScreen;
    if (backendSpan) backendSpan.textContent = getBackendUrl() || 'Local';
}

function setupEventListeners() {
    // Auth forms
    document.getElementById('parent-register-form').addEventListener('submit', handleParentRegister);
    document.getElementById('parent-login-form').addEventListener('submit', handleParentLogin);
    document.getElementById('child-form').addEventListener('submit', handleChildAdd);
    
    // Settings
    document.getElementById('notifications-enabled').addEventListener('change', saveSettings);
    document.getElementById('morning-reminder').addEventListener('change', saveSettings);
    document.getElementById('evening-reminder').addEventListener('change', saveSettings);
    
    // Back buttons
    setupBackButtons();
}

function setupBackButtons() {
    // Timer back button
    const timerBackBtn = document.querySelector('#timer-screen .back-btn');
    if (timerBackBtn) {
        timerBackBtn.addEventListener('click', () => {
            showScreen('dashboard-screen');
        });
    }
    
    // Child detail back button
    const childDetailBackBtn = document.querySelector('#child-detail-screen .back-btn');
    if (childDetailBackBtn) {
        childDetailBackBtn.addEventListener('click', () => {
            showScreen('dashboard-screen');
        });
    }
    
    // Stats back button
    const statsBackBtn = document.querySelector('#stats-screen .back-btn');
    if (statsBackBtn) {
        statsBackBtn.addEventListener('click', () => {
            showScreen('dashboard-screen');
        });
    }
    
    // Profile back button
    const profileBackBtn = document.querySelector('#profile-screen .back-btn');
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => {
            showScreen('dashboard-screen');
        });
    }
}

function setupAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding form
            const tabType = tab.dataset.tab;
            document.getElementById(`${tabType}-form`).classList.add('active');
        });
    });
}

// Admin Access Functions
function showAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'flex';
    document.getElementById('admin-password').focus();
    
    // Add enter key listener
    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyAdminAccess();
        }
    });
}

function hideAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
    document.getElementById('admin-password').value = '';
}

function verifyAdminAccess() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdminMode = true;
        localStorage.setItem(ADMIN_SESSION_KEY, Date.now().toString());
        
        // Show advanced settings
        document.getElementById('advanced-settings').style.display = 'block';
        hideAdminLogin();
        
        // Show success message
        showNotification('Admin erişimi başarılı! 👨‍💼', 'success');
        
        // Load saved admin settings
        loadAdminSettings();
    } else {
        showNotification('Hatalı admin şifresi! ❌', 'error');
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }
}

function hideAdvancedSettings() {
    document.getElementById('advanced-settings').style.display = 'none';
    isAdminMode = false;
    localStorage.removeItem(ADMIN_SESSION_KEY);
    showNotification('Admin modundan çıkıldı', 'info');
}

function checkAdminSession() {
    const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (adminSession) {
        const sessionTime = parseInt(adminSession);
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - sessionTime < sessionDuration) {
            isAdminMode = true;
            // Show admin settings in profile if logged in
            if (currentParent) {
                showAdminProfileSettings();
            }
        } else {
            localStorage.removeItem(ADMIN_SESSION_KEY);
        }
    }
}

function showAdminProfileSettings() {
    const adminSettings = document.getElementById('admin-profile-settings');
    if (adminSettings && isAdminMode) {
        adminSettings.style.display = 'block';
        loadAdminProfileSettings();
    }
}

function loadAdminSettings() {
    // Load backend URL
    const savedBackendUrl = localStorage.getItem('backend_url');
    if (savedBackendUrl) {
        document.getElementById('backend-url').value = savedBackendUrl;
    }
    
    // Load other admin settings
    const adminSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    document.getElementById('debug-mode').checked = adminSettings.debugMode || false;
    document.getElementById('analytics-enabled').checked = adminSettings.analytics || false;
    
    if (adminSettings.adminEmail) {
        document.getElementById('admin-email').value = adminSettings.adminEmail;
    }
}

function loadAdminProfileSettings() {
    const savedBackendUrl = localStorage.getItem('backend_url');
    if (savedBackendUrl) {
        document.getElementById('profile-backend-url').value = savedBackendUrl;
    }
    
    const adminSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    document.getElementById('profile-debug-mode').checked = adminSettings.debugMode || false;
    document.getElementById('profile-analytics').checked = adminSettings.analytics || false;
}

function saveAdminSettings() {
    if (!isAdminMode) return;
    
    const adminSettings = {
        debugMode: document.getElementById('debug-mode')?.checked || document.getElementById('profile-debug-mode')?.checked || false,
        analytics: document.getElementById('analytics-enabled')?.checked || document.getElementById('profile-analytics')?.checked || false,
        adminEmail: document.getElementById('admin-email')?.value || ''
    };
    
    localStorage.setItem('admin_settings', JSON.stringify(adminSettings));
    
    // Save backend URL
    const backendUrl = document.getElementById('backend-url')?.value || document.getElementById('profile-backend-url')?.value;
    if (backendUrl) {
        localStorage.setItem('backend_url', backendUrl);
        setBackendUrl(backendUrl);
    }
    
    // Update debug mode
    const wasDebugMode = debugMode;
    debugMode = adminSettings.debugMode;
    
    if (debugMode && !wasDebugMode) {
        showNotification('Debug modu etkinleştirildi! Sayfa yenileniyor...', 'info');
        setTimeout(() => location.reload(), 1500);
    } else if (!debugMode && wasDebugMode) {
        showNotification('Debug modu kapatıldı! Sayfa yenileniyor...', 'info');
        setTimeout(() => location.reload(), 1500);
    } else {
        showNotification('Admin ayarları kaydedildi', 'success');
    }
}

function checkAuthStatus() {
    // Skip auth in debug mode
    if (debugMode) {
        showScreen('dashboard-screen');
        loadDashboard();
        return;
    }
    
    const parent = getParentData();
    if (parent && parent.id) {
        currentParent = parent;
        showScreen('dashboard-screen');
        loadDashboard();
        
        // Show admin settings in profile if admin mode is active
        if (isAdminMode) {
            showAdminProfileSettings();
        }
    } else {
        showScreen('auth-screen');
    }
}

async function handleParentRegister(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('parent-name').value,
        phone: document.getElementById('parent-phone').value,
        email: document.getElementById('parent-email').value || null
    };
    
    // Save admin settings if in admin mode
    if (isAdminMode) {
        saveAdminSettings();
    }
    
    try {
        // Try to register with backend first
        const parent = await registerParent(formData);
        
        if (parent) {
            currentParent = parent;
            saveParentData(parent);
            showScreen('dashboard-screen');
            loadDashboard();
            showNotification('Kayıt başarılı!', 'success');
        }
    } catch (error) {
        // Fallback to local storage
        const localParent = {
            id: generateId(),
            ...formData,
            created_at: new Date().toISOString()
        };
        
        currentParent = localParent;
        saveParentData(localParent);
        showScreen('dashboard-screen');
        loadDashboard();
        showNotification('Çevrimdışı kayıt yapıldı', 'info');
    }
    
    // Show admin settings in profile if admin mode is active
    if (isAdminMode) {
        showAdminProfileSettings();
    }
}

async function handleParentLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('login-phone').value;
    const name = document.getElementById('login-name').value;
    
    try {
        // Try to login with backend
        const parent = await loginParent({ phone, name });
        
        if (parent) {
            currentParent = parent;
            saveParentData(parent);
            
            // Load children from backend
            const backendChildren = await getChildrenByParent(parent.id);
            if (backendChildren && backendChildren.length > 0) {
                children = backendChildren;
                saveChildrenData(children);
            }
            
            showScreen('dashboard-screen');
            loadDashboard();
            showNotification('Giriş başarılı!', 'success');
        }
    } catch (error) {
        // Fallback to local storage
        const localParent = getParentData();
        if (localParent && localParent.phone === phone && localParent.name === name) {
            currentParent = localParent;
            showScreen('dashboard-screen');
            loadDashboard();
            showNotification('Çevrimdışı giriş yapıldı', 'info');
        } else {
            showNotification('Giriş bilgileri hatalı', 'error');
        }
    }
    
    // Show admin settings in profile if admin mode is active
    if (isAdminMode) {
        showAdminProfileSettings();
    }
}

function loadDashboard() {
    // Update parent name display
    document.getElementById('parent-name-display').textContent = currentParent.name;
    
    // Load children for current parent
    children = getChildrenData().filter(child => child.parent_id === currentParent.id);
    renderChildren();
    
    // Update profile info
    updateProfileInfo();
    
    // Load stats
    loadStats();
    
    // Setup reminders
    setupReminders();
    
    if (debugMode) {
        console.log('🐛 Dashboard loaded:', {
            parent: currentParent,
            children: children.length,
            screen: currentScreen
        });
    }
}

function renderChildren() {
    const container = document.getElementById('children-list');
    
    if (children.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👶</div>
                <h3>Henüz çocuk eklenmemiş</h3>
                <p>İlk çocuğunuzu eklemek için "Çocuk Ekle" butonuna tıklayın</p>
                ${debugMode ? '<small style="color: #666; margin-top: 10px;">🐛 Debug modunda test çocukları otomatik oluşturuldu</small>' : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = children.map(child => `
        <div class="child-card" onclick="showChildDetail('${child.id}')">
            <div class="child-avatar">${getAvatarEmoji(child.avatar)}</div>
            <div class="child-info">
                <h3>${child.name} ${debugMode ? '<span style="font-size: 0.7em; color: #666;">[ID: ' + child.id.substring(0, 8) + ']</span>' : ''}</h3>
                <p>${child.age} yaşında</p>
                <div class="child-streak">
                    <span class="streak-badge">${child.current_streak || 0} gün</span>
                </div>
            </div>
            <div class="child-actions">
                <button class="quick-timer" onclick="event.stopPropagation(); quickTimer('${child.id}', 'morning')">🌅</button>
                <button class="quick-timer" onclick="event.stopPropagation(); quickTimer('${child.id}', 'evening')">🌙</button>
            </div>
        </div>
    `).join('');
    
    if (debugMode) {
        console.log('🐛 Rendered children:', children);
    }
}

function showAddChildForm() {
    document.getElementById('add-child-form').style.display = 'flex';
    setupAvatarSelection();
}

function hideAddChildForm() {
    document.getElementById('add-child-form').style.display = 'none';
    document.getElementById('child-form').reset();
}

async function handleChildAdd(e) {
    e.preventDefault();
    
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    if (!selectedAvatar) {
        showNotification('Lütfen bir avatar seçin', 'error');
        return;
    }
    
    const childData = {
        parent_id: currentParent.id,
        name: document.getElementById('child-name').value,
        age: parseInt(document.getElementById('child-age').value),
        avatar: selectedAvatar.dataset.avatar,
        current_streak: 0,
        longest_streak: 0
    };
    
    if (debugMode) {
        console.log('🐛 Adding child:', childData);
    }
    
    try {
        // Try to add child to backend
        const child = await addChild(childData);
        
        if (child) {
            children.push(child);
            // Save all children (including other parents' children)
            const allChildren = getChildrenData();
            allChildren.push(child);
            saveChildrenData(allChildren);
            renderChildren();
            hideAddChildForm();
            showNotification('Çocuk başarıyla eklendi!', 'success');
        }
    } catch (error) {
        // Fallback to local storage
        const localChild = {
            id: generateId(),
            ...childData,
            created_at: new Date().toISOString()
        };
        
        children.push(localChild);
        // Save all children (including other parents' children)
        const allChildren = getChildrenData();
        allChildren.push(localChild);
        saveChildrenData(allChildren);
        renderChildren();
        hideAddChildForm();
        showNotification('Çocuk çevrimdışı eklendi', 'info');
        
        if (debugMode) {
            console.log('🐛 Child added locally:', localChild);
        }
    }
}

function setupAvatarSelection() {
    const avatars = [
        '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔',
        '👱', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁',
        '🙋', '🧏', '🙇', '🤦', '🤷', '👨‍⚕️', '👩‍⚕️', '👨‍🎓'
    ];
    
    const container = document.getElementById('avatar-selection');
    container.innerHTML = avatars.map((avatar, index) => `
        <div class="avatar-option" data-avatar="${index}" onclick="selectAvatar(this)">
            ${avatar}
        </div>
    `).join('');
}

function selectAvatar(element) {
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
}

function getAvatarEmoji(avatarIndex) {
    const avatars = [
        '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔',
        '👱', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁',
        '🙋', '🧏', '🙇', '🤦', '🤷', '👨‍⚕️', '👩‍⚕️', '👨‍🎓'
    ];
    return avatars[avatarIndex] || '👶';
}

function showChildDetail(childId) {
    const child = children.find(c => c.id === childId);
    if (!child) return;
    
    currentChild = child;
    
    if (debugMode) {
        console.log('🐛 Showing child detail:', child);
    }
    
    // Update child detail display
    document.getElementById('child-detail-name').textContent = child.name;
    document.getElementById('child-detail-name-display').textContent = child.name;
    document.getElementById('child-detail-age').textContent = `${child.age} yaşında`;
    document.getElementById('child-detail-avatar').textContent = getAvatarEmoji(child.avatar);
    document.getElementById('current-streak').textContent = child.current_streak || 0;
    document.getElementById('longest-streak').textContent = child.longest_streak || 0;
    
    // Load child's rewards and recent activity
    loadChildRewards(child.id);
    loadRecentActivity(child.id);
    
    showScreen('child-detail-screen');
}

function quickTimer(childId, sessionType) {
    const child = children.find(c => c.id === childId);
    if (!child) return;
    
    currentChild = child;
    startTimer(sessionType);
}

function startTimer(sessionType) {
    if (!currentChild) {
        showNotification('Lütfen önce bir çocuk seçin', 'error');
        return;
    }
    
    if (debugMode) {
        console.log('🐛 Starting timer:', { child: currentChild.name, session: sessionType });
    }
    
    // Set session type
    document.getElementById('session-type-display').textContent = 
        sessionType === 'morning' ? 'Sabah' : 'Akşam';
    
    showScreen('timer-screen');
    initializeTimer(sessionType);
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Update navigation
    updateNavigation(screenId);
    
    // Update debug panel
    updateDebugPanel();
    
    if (debugMode) {
        console.log('🐛 Screen changed to:', screenId);
    }
}

function updateNavigation(screenId) {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Map screen IDs to navigation buttons
    const screenNavMap = {
        'dashboard-screen': 0,
        'timer-screen': 1,
        'stats-screen': 2,
        'profile-screen': 3
    };
    
    const navIndex = screenNavMap[screenId];
    if (navIndex !== undefined && navBtns[navIndex]) {
        navBtns[navIndex].classList.add('active');
    }
}

function loadChildRewards(childId) {
    const rewards = getChildRewards(childId);
    const container = document.getElementById('child-rewards');
    
    const rewardTypes = [
        { type: 'first_brush', name: 'İlk Fırçalama', icon: '🦷' },
        { type: 'week_streak', name: '7 Gün Seri', icon: '📅' },
        { type: 'month_streak', name: '30 Gün Seri', icon: '🗓️' },
        { type: 'perfect_week', name: 'Mükemmel Hafta', icon: '⭐' },
        { type: 'early_bird', name: 'Erken Kuş', icon: '🌅' },
        { type: 'night_owl', name: 'Gece Kuşu', icon: '🌙' },
        { type: 'speed_demon', name: 'Hız Canavarı', icon: '⚡' },
        { type: 'patience_master', name: 'Sabır Ustası', icon: '🧘' },
        { type: 'consistency_king', name: 'Tutarlılık Kralı', icon: '👑' },
        { type: 'champion', name: 'Şampiyon', icon: '🏆' }
    ];
    
    container.innerHTML = rewardTypes.map(reward => {
        const earned = rewards.find(r => r.type === reward.type);
        const status = earned ? (earned.status === 'lost' ? 'lost' : 'earned') : 'not-earned';
        
        return `
            <div class="reward-badge ${status}">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-name">${reward.name}</div>
                ${debugMode ? '<div style="font-size: 0.6em; color: #666;">' + status + '</div>' : ''}
            </div>
        `;
    }).join('');
}

function loadRecentActivity(childId) {
    const records = getBrushingRecords(childId);
    const container = document.getElementById('recent-brushing');
    
    if (records.length === 0) {
        container.innerHTML = `
            <p class="no-activity">Henüz fırçalama kaydı yok</p>
            ${debugMode ? '<small style="color: #666;">🐛 Debug modunda test verileri oluşturulabilir</small>' : ''}
        `;
        return;
    }
    
    const recent = records.slice(0, 5);
    container.innerHTML = recent.map(record => `
        <div class="activity-item">
            <div class="activity-icon">${record.session_type === 'morning' ? '🌅' : '🌙'}</div>
            <div class="activity-info">
                <div class="activity-title">${record.session_type === 'morning' ? 'Sabah' : 'Akşam'} Fırçalama</div>
                <div class="activity-details">
                    ${formatDate(record.brush_time)} - ${Math.floor(record.duration / 60)}:${(record.duration % 60).toString().padStart(2, '0')}
                    ${debugMode ? '<br><small style="color: #666;">ID: ' + record.id?.substring(0, 8) + '</small>' : ''}
                </div>
            </div>
            <div class="activity-score">${'⭐'.repeat(record.quality_score || 3)}</div>
        </div>
    `).join('');
}

function loadStats() {
    const allRecords = getAllBrushingRecords();
    
    // Update stats overview
    document.getElementById('total-brushings').textContent = allRecords.length;
    
    const avgDuration = allRecords.length > 0 
        ? Math.round(allRecords.reduce((sum, r) => sum + r.duration, 0) / allRecords.length)
        : 0;
    document.getElementById('avg-duration').textContent = `${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, '0')}`;
    
    const bestStreak = Math.max(...children.map(c => c.longest_streak || 0), 0);
    document.getElementById('best-streak').textContent = bestStreak;
    
    // Update child filter
    const filter = document.getElementById('stats-child-filter');
    filter.innerHTML = '<option value="all">Tüm Çocuklar</option>' +
        children.map(child => `<option value="${child.id}">${child.name}</option>`).join('');
    
    // Render charts
    renderWeeklyChart();
    renderDailyDistribution();
    
    if (debugMode) {
        console.log('🐛 Stats loaded:', {
            totalRecords: allRecords.length,
            avgDuration,
            bestStreak,
            children: children.length
        });
    }
}

function renderWeeklyChart() {
    const container = document.getElementById('weekly-chart');
    const records = getAllBrushingRecords();
    
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    
    const chartData = days.map(day => {
        const dayRecords = records.filter(r => {
            const recordDate = new Date(r.brush_time);
            return recordDate.toDateString() === day.toDateString();
        });
        
        return {
            day: day.toLocaleDateString('tr-TR', { weekday: 'short' }),
            count: dayRecords.length
        };
    });
    
    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    
    container.innerHTML = chartData.map(data => `
        <div class="chart-bar">
            <div class="bar" style="height: ${(data.count / maxCount) * 100}%"></div>
            <div class="bar-label">${data.day}</div>
            <div class="bar-value">${data.count}</div>
        </div>
    `).join('');
}

function renderDailyDistribution() {
    const container = document.getElementById('daily-distribution');
    const records = getAllBrushingRecords();
    
    const morningCount = records.filter(r => r.session_type === 'morning').length;
    const eveningCount = records.filter(r => r.session_type === 'evening').length;
    const total = morningCount + eveningCount;
    
    if (total === 0) {
        container.innerHTML = `
            <p class="no-data">Henüz veri yok</p>
            ${debugMode ? '<small style="color: #666;">🐛 Timer kullanarak test verisi oluşturun</small>' : ''}
        `;
        return;
    }
    
    const morningPercent = (morningCount / total) * 100;
    const eveningPercent = (eveningCount / total) * 100;
    
    container.innerHTML = `
        <div class="distribution-item">
            <div class="distribution-bar">
                <div class="bar-segment morning" style="width: ${morningPercent}%"></div>
                <div class="bar-segment evening" style="width: ${eveningPercent}%"></div>
            </div>
            <div class="distribution-legend">
                <div class="legend-item">
                    <span class="legend-color morning"></span>
                    <span>Sabah (${morningCount})</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color evening"></span>
                    <span>Akşam (${eveningCount})</span>
                </div>
            </div>
            ${debugMode ? '<div style="font-size: 0.8em; color: #666; margin-top: 5px;">🐛 Total: ' + total + ' records</div>' : ''}
        </div>
    `;
}

function updateProfileInfo() {
    document.getElementById('profile-parent-name').textContent = currentParent.name;
    document.getElementById('profile-parent-phone').textContent = currentParent.phone;
    document.getElementById('profile-parent-email').textContent = currentParent.email || 'Belirtilmemiş';
    
    // Load settings
    const settings = getSettings();
    document.getElementById('notifications-enabled').checked = settings.notifications;
    document.getElementById('morning-reminder').value = settings.morningReminder;
    document.getElementById('evening-reminder').value = settings.eveningReminder;
    
    // Show admin settings if in admin mode
    if (isAdminMode) {
        showAdminProfileSettings();
    }
}

function saveSettings() {
    const settings = {
        notifications: document.getElementById('notifications-enabled').checked,
        morningReminder: document.getElementById('morning-reminder').value,
        eveningReminder: document.getElementById('evening-reminder').value
    };
    
    localStorage.setItem('toothbrush_settings', JSON.stringify(settings));
    setupReminders();
    
    // Save admin settings if in admin mode
    if (isAdminMode) {
        saveAdminSettings();
    }
    
    if (debugMode) {
        console.log('🐛 Settings saved:', settings);
    }
}

function setupReminders() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    const settings = getSettings();
    if (settings.notifications) {
        // Setup morning reminder
        scheduleReminder(settings.morningReminder, 'Sabah diş fırçalama zamanı! 🌅');
        // Setup evening reminder
        scheduleReminder(settings.eveningReminder, 'Akşam diş fırçalama zamanı! 🌙');
    }
}

function scheduleReminder(time, message) {
    // This is a simplified reminder system
    // In a real app, you'd use service workers for background notifications
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            new Notification('Diş Fırçalama Hatırlatması', {
                body: message,
                icon: 'icon-192x192.png'
            });
        }
        
        // Schedule for next day
        scheduleReminder(time, message);
    }, timeUntilReminder);
}

function exportData() {
    const data = {
        parent: currentParent,
        children: children,
        brushingRecords: getAllBrushingRecords(),
        rewards: getAllRewards(),
        settings: getSettings(),
        exportDate: new Date().toISOString(),
        debugMode: debugMode
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dis-fircalama-verileri-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Veriler başarıyla dışa aktarıldı', 'success');
    
    if (debugMode) {
        console.log('🐛 Data exported:', data);
    }
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        if (debugMode) {
            console.log('🐛 Logging out, clearing data');
        }
        
        localStorage.removeItem('toothbrush_parent');
        localStorage.removeItem('toothbrush_children');
        localStorage.removeItem('toothbrush_brushing_records');
        localStorage.removeItem('toothbrush_rewards');
        localStorage.removeItem('toothbrush_settings');
        localStorage.removeItem(ADMIN_SESSION_KEY);
        
        currentParent = null;
        currentChild = null;
        children = [];
        isAdminMode = false;
        
        // Remove debug panel
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
        
        showScreen('auth-screen');
        showNotification('Başarıyla çıkış yapıldı', 'info');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
    
    if (debugMode) {
        console.log('🐛 Notification:', type, message);
    }
}

function updateSyncStatus() {
    const indicator = document.getElementById('sync-indicator');
    if (!indicator) return;
    
    const backendUrl = getBackendUrl();
    if (backendUrl) {
        // Test backend connection
        testBackendConnection().then(isOnline => {
            if (isOnline) {
                indicator.textContent = 'Çevrimiçi';
                indicator.className = 'sync-online';
            } else {
                indicator.textContent = 'Bağlantı Hatası';
                indicator.className = 'sync-error';
            }
        });
    } else {
        indicator.textContent = 'Çevrimdışı';
        indicator.className = 'sync-offline';
    }
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Sync status update interval
setInterval(updateSyncStatus, 30000); // Update every 30 seconds

// Debug mode console commands
if (debugMode) {
    window.debugCommands = {
        showData: () => {
            console.log('🐛 Current Data:', {
                parent: currentParent,
                children: children,
                records: getAllBrushingRecords(),
                rewards: getAllRewards(),
                settings: getSettings()
            });
        },
        clearData: () => {
            if (confirm('Clear all debug data?')) {
                localStorage.clear();
                location.reload();
            }
        },
        addTestRecord: (childId, sessionType = 'morning') => {
            const record = {
                id: generateId(),
                child_id: childId || children[0]?.id,
                session_type: sessionType,
                brush_time: new Date().toISOString(),
                duration: 120,
                quality_score: 4
            };
            const records = getAllBrushingRecords();
            records.push(record);
            localStorage.setItem('toothbrush_brushing_records', JSON.stringify(records));
            console.log('🐛 Test record added:', record);
        }
    };
    
    console.log('🐛 Debug commands available:', Object.keys(window.debugCommands));
}
