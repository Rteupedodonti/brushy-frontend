// Hybrid Storage System - Local Storage + Backend Sync
class HybridStorage {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSyncTime = localStorage.getItem('last_sync_time') || '0';
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncAllData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Auto sync every 5 minutes when online
        setInterval(() => {
            if (this.isOnline) {
                this.syncAllData();
            }
        }, 5 * 60 * 1000);
    }

    // Save data with automatic sync
    async saveData(key, data, syncToBackend = true) {
        try {
            // Always save to localStorage first
            localStorage.setItem(key, JSON.stringify(data));
            
            if (syncToBackend && this.isOnline) {
                // Try to sync to backend
                await this.syncToBackend(key, data);
            } else if (syncToBackend) {
                // Add to sync queue for later
                this.addToSyncQueue(key, data, 'save');
            }
            
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data with backend fallback
    async loadData(key, syncFromBackend = true) {
        try {
            // First try localStorage
            const localData = localStorage.getItem(key);
            
            if (syncFromBackend && this.isOnline) {
                // Try to get latest from backend
                const backendData = await this.loadFromBackend(key);
                
                if (backendData) {
                    // Compare timestamps and use newer data
                    const localTimestamp = localData ? JSON.parse(localData).timestamp || 0 : 0;
                    const backendTimestamp = backendData.timestamp || 0;
                    
                    if (backendTimestamp > localTimestamp) {
                        // Backend data is newer, update localStorage
                        localStorage.setItem(key, JSON.stringify(backendData));
                        return backendData;
                    }
                }
            }
            
            return localData ? JSON.parse(localData) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to localStorage only
            const localData = localStorage.getItem(key);
            return localData ? JSON.parse(localData) : null;
        }
    }

    // Add operation to sync queue
    addToSyncQueue(key, data, operation) {
        this.syncQueue.push({
            key,
            data: { ...data, timestamp: Date.now() },
            operation,
            timestamp: Date.now()
        });
        
        // Save sync queue to localStorage
        localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    }

    // Sync all pending operations
    async syncAllData() {
        if (!this.isOnline) return;

        try {
            // Load sync queue from localStorage
            const queueData = localStorage.getItem('sync_queue');
            if (queueData) {
                this.syncQueue = JSON.parse(queueData);
            }

            // Process sync queue
            for (const item of this.syncQueue) {
                try {
                    if (item.operation === 'save') {
                        await this.syncToBackend(item.key, item.data);
                    }
                } catch (error) {
                    console.error('Sync error for item:', item.key, error);
                }
            }

            // Clear successful syncs
            this.syncQueue = [];
            localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
            
            // Update last sync time
            this.lastSyncTime = Date.now().toString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            
            // Trigger sync status update
            this.updateSyncStatus();
            
        } catch (error) {
            console.error('Sync all data error:', error);
        }
    }

    // Sync data to backend
    async syncToBackend(key, data) {
        const backendUrl = getBackendUrl();
        if (!backendUrl) return false;

        try {
            const endpoint = this.getEndpointForKey(key);
            if (!endpoint) return false;

            const response = await fetch(`${backendUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: Date.now(),
                    sync_source: 'frontend'
                })
            });

            if (response.ok) {
                console.log(`✅ Synced ${key} to backend`);
                return true;
            } else {
                throw new Error(`Backend sync failed: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Backend sync failed for ${key}:`, error);
            // Add to sync queue for retry
            this.addToSyncQueue(key, data, 'save');
            return false;
        }
    }

    // Load data from backend
    async loadFromBackend(key) {
        const backendUrl = getBackendUrl();
        if (!backendUrl) return null;

        try {
            const endpoint = this.getEndpointForKey(key);
            if (!endpoint) return null;

            const response = await fetch(`${backendUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Loaded ${key} from backend`);
                return data;
            }
        } catch (error) {
            console.error(`❌ Backend load failed for ${key}:`, error);
        }
        
        return null;
    }

    // Get API endpoint for data key
    getEndpointForKey(key) {
        const endpoints = {
            'toothbrush_parent': '/parents',
            'toothbrush_children': '/children',
            'toothbrush_brushing_records': '/brushing-records',
            'toothbrush_rewards': '/rewards',
            'toothbrush_settings': '/settings'
        };
        
        return endpoints[key] || null;
    }

    // Update sync status indicator
    updateSyncStatus() {
        const indicator = document.getElementById('sync-indicator');
        if (!indicator) return;

        if (!this.isOnline) {
            indicator.textContent = 'Çevrimdışı';
            indicator.className = 'sync-offline';
        } else if (this.syncQueue.length > 0) {
            indicator.textContent = 'Senkronize Ediliyor...';
            indicator.className = 'sync-syncing';
        } else {
            indicator.textContent = 'Senkronize';
            indicator.className = 'sync-online';
        }
    }

    // Get sync statistics
    getSyncStats() {
        return {
            isOnline: this.isOnline,
            queueLength: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime,
            lastSyncDate: new Date(parseInt(this.lastSyncTime)).toLocaleString('tr-TR')
        };
    }

    // Force full sync
    async forceSyncAll() {
        if (!this.isOnline) {
            throw new Error('Çevrimdışı - senkronizasyon yapılamıyor');
        }

        // Add all localStorage data to sync queue
        const keys = ['toothbrush_parent', 'toothbrush_children', 'toothbrush_brushing_records', 'toothbrush_rewards', 'toothbrush_settings'];
        
        for (const key of keys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    this.addToSyncQueue(key, parsedData, 'save');
                } catch (error) {
                    console.error(`Error parsing ${key}:`, error);
                }
            }
        }

        // Process sync queue
        await this.syncAllData();
    }

    // Clear sync queue
    clearSyncQueue() {
        this.syncQueue = [];
        localStorage.removeItem('sync_queue');
    }
}

// Initialize hybrid storage
const hybridStorage = new HybridStorage();

// Enhanced data functions with hybrid storage
async function saveParentDataHybrid(parent) {
    return await hybridStorage.saveData('toothbrush_parent', parent);
}

async function loadParentDataHybrid() {
    return await hybridStorage.loadData('toothbrush_parent');
}

async function saveChildrenDataHybrid(children) {
    return await hybridStorage.saveData('toothbrush_children', children);
}

async function loadChildrenDataHybrid() {
    const data = await hybridStorage.loadData('toothbrush_children');
    return data || [];
}

async function saveBrushingRecordHybrid(record) {
    const records = await loadBrushingRecordsHybrid();
    records.push(record);
    return await hybridStorage.saveData('toothbrush_brushing_records', records);
}

async function loadBrushingRecordsHybrid() {
    const data = await hybridStorage.loadData('toothbrush_brushing_records');
    return data || [];
}

async function saveRewardHybrid(childId, rewardType, status) {
    const rewards = await loadRewardsHybrid();
    const existingIndex = rewards.findIndex(r => r.child_id === childId && r.type === rewardType);
    
    const reward = {
        id: existingIndex >= 0 ? rewards[existingIndex].id : generateId(),
        child_id: childId,
        type: rewardType,
        status: status,
        earned_at: new Date().toISOString(),
        timestamp: Date.now()
    };

    if (existingIndex >= 0) {
        rewards[existingIndex] = reward;
    } else {
        rewards.push(reward);
    }

    return await hybridStorage.saveData('toothbrush_rewards', rewards);
}

async function loadRewardsHybrid() {
    const data = await hybridStorage.loadData('toothbrush_rewards');
    return data || [];
}

async function saveSettingsHybrid(settings) {
    return await hybridStorage.saveData('toothbrush_settings', {
        ...settings,
        timestamp: Date.now()
    });
}

async function loadSettingsHybrid() {
    const data = await hybridStorage.loadData('toothbrush_settings');
    return data || {
        notifications: true,
        morningReminder: '08:00',
        eveningReminder: '20:00'
    };
}

// Sync status functions
function getSyncStatus() {
    return hybridStorage.getSyncStats();
}

async function forceSyncAll() {
    try {
        await hybridStorage.forceSyncAll();
        showNotification('Tüm veriler senkronize edildi', 'success');
    } catch (error) {
        showNotification('Senkronizasyon hatası: ' + error.message, 'error');
    }
}

function clearSyncQueue() {
    hybridStorage.clearSyncQueue();
    showNotification('Senkronizasyon kuyruğu temizlendi', 'info');
}

// Auto-update sync status
setInterval(() => {
    hybridStorage.updateSyncStatus();
}, 10000); // Update every 10 seconds

// Export for global use
window.hybridStorage = hybridStorage;
