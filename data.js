// Enhanced Data Management with Backend Integration
class DataManager {
    constructor() {
        this.storageKey = 'toothBrushingApp';
        this.data = this.loadData();
        this.initializeDefaultData();
        this.currentChildId = null;
        this.currentParentId = null;
    }

    // Load data from localStorage
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading data:', error);
            return {};
        }
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Initialize default data structure
    initializeDefaultData() {
        if (!this.data.user) {
            this.data.user = null;
        }
        
        if (!this.data.brushingRecords) {
            this.data.brushingRecords = [];
        }
        
        if (!this.data.badges) {
            this.data.badges = this.getDefaultBadges();
        }
        
        if (!this.data.settings) {
            this.data.settings = {
                morningReminder: '08:00',
                eveningReminder: '20:00',
                notifications: true,
                selectedAvatar: '👦'
            };
        }
        
        if (!this.data.avatars) {
            this.data.avatars = this.getDefaultAvatars();
        }
        
        this.saveData();
    }

    // Get default badges
    getDefaultBadges() {
        return [
            { id: 'first_brush', name: 'İlk Fırçalama', icon: '🦷', status: 'not_earned', description: 'İlk defa diş fırçala' },
            { id: 'streak_3', name: '3 Gün Seri', icon: '🔥', status: 'not_earned', description: '3 gün üst üste fırçala' },
            { id: 'streak_7', name: '1 Hafta Seri', icon: '⭐', status: 'not_earned', description: '7 gün üst üste fırçala' },
            { id: 'streak_14', name: '2 Hafta Seri', icon: '🌟', status: 'not_earned', description: '14 gün üst üste fırçala' },
            { id: 'streak_30', name: '1 Ay Seri', icon: '👑', status: 'not_earned', description: '30 gün üst üste fırçala' },
            { id: 'morning_champion', name: 'Sabah Şampiyonu', icon: '🌅', status: 'not_earned', description: '7 gün sabah fırçala' },
            { id: 'evening_champion', name: 'Akşam Şampiyonu', icon: '🌙', status: 'not_earned', description: '7 gün akşam fırçala' },
            { id: 'perfect_week', name: 'Mükemmel Hafta', icon: '💎', status: 'not_earned', description: '1 hafta hiç kaçırma' },
            { id: 'time_master', name: 'Zaman Ustası', icon: '⏰', status: 'not_earned', description: '10 kez 2 dakika fırçala' },
            { id: 'consistency_king', name: 'Düzen Kralı', icon: '🏆', status: 'not_earned', description: '21 gün düzenli fırçala' }
        ];
    }

    // Get default avatars
    getDefaultAvatars() {
        return [
            '👦', '👧', '🧒', '👶', '🦸‍♂️', '🦸‍♀️', '🧚‍♂️', '🧚‍♀️', 
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
            '🦁', '🐯', '🐸', '🐵', '🦄', '🐲', '🦖', '🤖'
        ];
    }

    // Enhanced user registration with backend integration
    async registerUser(parentName, parentPhone, childName, childAge) {
        try {
            // First register parent
            const parentData = {
                name: parentName,
                phone: parentPhone,
                email: `${parentPhone}@temp.com` // Temporary email
            };
            
            const parent = await apiService.registerParent(parentData);
            this.currentParentId = parent.id;
            
            // Then register child
            const childData = {
                name: childName,
                age: parseInt(childAge),
                parent_id: parent.id,
                avatar: this.data.settings.selectedAvatar
            };
            
            const child = await apiService.registerChild(childData);
            this.currentChildId = child.id;
            
            // Store user data locally
            this.data.user = {
                parentId: parent.id,
                childId: child.id,
                parentName,
                parentPhone,
                childName,
                childAge: parseInt(childAge),
                registrationDate: new Date().toISOString(),
                currentStreak: 0,
                longestStreak: 0
            };
            
            this.saveData();
            return this.data.user;
            
        } catch (error) {
            console.error('Registration failed, using local storage:', error);
            
            // Fallback to local storage
            this.data.user = {
                parentName,
                parentPhone,
                childName,
                childAge: parseInt(childAge),
                registrationDate: new Date().toISOString(),
                currentStreak: 0,
                longestStreak: 0
            };
            
            this.saveData();
            return this.data.user;
        }
    }

    getUser() {
        return this.data.user;
    }

    async updateUser(updates) {
        if (this.data.user) {
            this.data.user = { ...this.data.user, ...updates };
            this.saveData();
            
            // Update on backend if online
            if (this.currentChildId) {
                try {
                    await apiService.updateChild(this.currentChildId, updates);
                } catch (error) {
                    console.error('Failed to update user on backend:', error);
                }
            }
        }
    }

    // Enhanced brushing record with backend sync
    async addBrushingRecord(type, duration = 120) {
        const today = new Date().toDateString();
        const record = {
            id: Date.now(),
            date: today,
            type, // 'morning' or 'evening'
            duration, // in seconds
            timestamp: new Date().toISOString(),
            completed: true
        };
        
        // Add to local storage
        this.data.brushingRecords.push(record);
        this.updateStreaks();
        this.checkBadges();
        this.saveData();
        
        // Sync with backend
        if (this.currentChildId) {
            try {
                const backendRecord = {
                    child_id: this.currentChildId,
                    brush_time: new Date().toISOString(),
                    duration: duration,
                    session_type: type,
                    quality_score: 5 // Default quality score
                };
                
                await apiService.addBrushingRecord(backendRecord);
                console.log('Brushing record synced with backend');
            } catch (error) {
                console.error('Failed to sync brushing record:', error);
            }
        }
        
        return record;
    }

    async getBrushingRecords(days = 30) {
        // Try to get from backend first
        if (this.currentChildId) {
            try {
                const backendRecords = await apiService.getBrushingRecords(this.currentChildId, days);
                
                // Convert backend format to local format
                const convertedRecords = backendRecords.map(record => ({
                    id: record.id,
                    date: new Date(record.brush_time).toDateString(),
                    type: record.session_type,
                    duration: record.duration,
                    timestamp: record.brush_time,
                    completed: true
                }));
                
                // Update local storage with backend data
                this.data.brushingRecords = convertedRecords;
                this.saveData();
                
                return convertedRecords;
            } catch (error) {
                console.error('Failed to get records from backend, using local:', error);
            }
        }
        
        // Fallback to local storage
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.data.brushingRecords.filter(record => 
            new Date(record.timestamp) >= cutoffDate
        );
    }

    getTodaysBrushing() {
        const today = new Date().toDateString();
        return this.data.brushingRecords.filter(record => record.date === today);
    }

    hasBrushedToday(type) {
        const todayRecords = this.getTodaysBrushing();
        return todayRecords.some(record => record.type === type);
    }

    // Streak calculation
    updateStreaks() {
        const records = this.getBrushingRecords(365); // Last year
        const dailyRecords = this.groupRecordsByDate(records);
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Sort dates in descending order (most recent first)
        const dates = Object.keys(dailyRecords).sort((a, b) => new Date(b) - new Date(a));
        
        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const dayRecords = dailyRecords[date];
            
            // Check if both morning and evening brushing completed
            const hasMorning = dayRecords.some(r => r.type === 'morning');
            const hasEvening = dayRecords.some(r => r.type === 'evening');
            
            if (hasMorning && hasEvening) {
                tempStreak++;
                if (i === 0) currentStreak = tempStreak; // Current streak starts from today
            } else {
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
                tempStreak = 0;
                if (i === 0) currentStreak = 0; // No current streak if today is incomplete
            }
        }
        
        // Check if temp streak is the longest
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        
        // Update user data
        if (this.data.user) {
            this.data.user.currentStreak = currentStreak;
            this.data.user.longestStreak = longestStreak;
        }
    }

    groupRecordsByDate(records) {
        return records.reduce((groups, record) => {
            const date = record.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(record);
            return groups;
        }, {});
    }

    // Badge management with backend sync
    async checkBadges() {
        const records = await this.getBrushingRecords(365);
        const user = this.data.user;
        
        if (!user) return;
        
        // First brush badge
        if (records.length >= 1) {
            await this.earnBadge('first_brush');
        }
        
        // Streak badges
        if (user.currentStreak >= 3) await this.earnBadge('streak_3');
        if (user.currentStreak >= 7) await this.earnBadge('streak_7');
        if (user.currentStreak >= 14) await this.earnBadge('streak_14');
        if (user.currentStreak >= 30) await this.earnBadge('streak_30');
        
        // Champion badges
        const last7Days = await this.getBrushingRecords(7);
        const morningCount = last7Days.filter(r => r.type === 'morning').length;
        const eveningCount = last7Days.filter(r => r.type === 'evening').length;
        
        if (morningCount >= 7) await this.earnBadge('morning_champion');
        if (eveningCount >= 7) await this.earnBadge('evening_champion');
        
        // Perfect week badge
        const dailyRecords = this.groupRecordsByDate(last7Days);
        const perfectDays = Object.values(dailyRecords).filter(dayRecords => {
            const hasMorning = dayRecords.some(r => r.type === 'morning');
            const hasEvening = dayRecords.some(r => r.type === 'evening');
            return hasMorning && hasEvening;
        }).length;
        
        if (perfectDays >= 7) await this.earnBadge('perfect_week');
        
        // Time master badge
        const fullTimeRecords = records.filter(r => r.duration >= 120);
        if (fullTimeRecords.length >= 10) await this.earnBadge('time_master');
        
        // Consistency king badge
        if (user.longestStreak >= 21) await this.earnBadge('consistency_king');
        
        // Check for lost badges (if streak is broken)
        if (user.currentStreak < 3) this.loseBadge('streak_3');
        if (user.currentStreak < 7) this.loseBadge('streak_7');
        if (user.currentStreak < 14) this.loseBadge('streak_14');
        if (user.currentStreak < 30) this.loseBadge('streak_30');
    }

    async earnBadge(badgeId) {
        const badge = this.data.badges.find(b => b.id === badgeId);
        if (badge && badge.status !== 'earned') {
            badge.status = 'earned';
            badge.earnedDate = new Date().toISOString();
            this.saveData();
            
            // Sync with backend
            if (this.currentChildId) {
                try {
                    const rewardData = {
                        child_id: this.currentChildId,
                        type: badgeId,
                        description: badge.description,
                        earned_date: badge.earnedDate
                    };
                    
                    await apiService.addReward(rewardData);
                    console.log('Badge synced with backend:', badgeId);
                } catch (error) {
                    console.error('Failed to sync badge:', error);
                }
            }
            
            return badge;
        }
        return null;
    }

    loseBadge(badgeId) {
        const badge = this.data.badges.find(b => b.id === badgeId);
        if (badge && badge.status === 'earned') {
            badge.status = 'lost';
            badge.lostDate = new Date().toISOString();
            this.saveData();
        }
    }

    getBadges() {
        return this.data.badges;
    }

    getEarnedBadgesCount() {
        return this.data.badges.filter(b => b.status === 'earned').length;
    }

    // Settings management with backend sync
    async updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.saveData();
        
        // Sync with backend
        if (this.currentChildId) {
            try {
                await apiService.updateChildSettings(this.currentChildId, newSettings);
                console.log('Settings synced with backend');
            } catch (error) {
                console.error('Failed to sync settings:', error);
            }
        }
    }

    getSettings() {
        return this.data.settings;
    }

    // Statistics with backend integration
    async getWeekStats() {
        const stats = [];
        const today = new Date();
        const records = await this.getBrushingRecords(7);
        const dailyRecords = this.groupRecordsByDate(records);
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const dayRecords = dailyRecords[dateString] || [];
            const hasMorning = dayRecords.some(r => r.type === 'morning');
            const hasEvening = dayRecords.some(r => r.type === 'evening');
            
            let status = 'missed';
            if (hasMorning && hasEvening) status = 'completed';
            else if (hasMorning || hasEvening) status = 'partial';
            
            stats.push({
                date: dateString,
                dayName: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                status,
                morning: hasMorning,
                evening: hasEvening
            });
        }
        
        return stats;
    }

    async getTotalBrushingTime() {
        const records = await this.getBrushingRecords(365);
        return records.reduce((total, record) => total + record.duration, 0);
    }

    // Get local data for offline mode
    getLocalData(endpoint) {
        // Return appropriate local data based on endpoint
        if (endpoint.includes('brushing-records')) {
            return this.data.brushingRecords;
        } else if (endpoint.includes('children')) {
            return this.data.user;
        } else if (endpoint.includes('settings')) {
            return this.data.settings;
        }
        return null;
    }

    // Data export/import
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = importedData;
            this.saveData();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('offlineQueue');
        this.data = {};
        this.currentChildId = null;
        this.currentParentId = null;
        this.initializeDefaultData();
    }
}

// Initialize global data manager
const dataManager = new DataManager();