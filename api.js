// API Service for Backend Integration
class APIService {
    constructor() {
        // Backend API URL - replace with your Render deployment URL
        this.baseURL = 'https://your-render-app.onrender.com/api';
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            
            // If offline or network error, use local storage
            if (!this.isOnline || error.name === 'TypeError') {
                return this.handleOfflineRequest(endpoint, options);
            }
            
            throw error;
        }
    }

    // Handle offline requests
    handleOfflineRequest(endpoint, options) {
        console.log('Offline mode: using local storage');
        
        // Store request for later sync
        const offlineRequest = {
            endpoint,
            options,
            timestamp: Date.now()
        };
        
        const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        offlineQueue.push(offlineRequest);
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
        
        // Return local data if available
        return dataManager.getLocalData(endpoint);
    }

    // Sync offline data when back online
    async syncOfflineData() {
        const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        
        if (offlineQueue.length === 0) return;
        
        console.log('Syncing offline data...');
        
        for (const request of offlineQueue) {
            try {
                await this.request(request.endpoint, request.options);
            } catch (error) {
                console.error('Failed to sync request:', error);
            }
        }
        
        // Clear offline queue
        localStorage.removeItem('offlineQueue');
        console.log('Offline data synced successfully');
    }

    // Parent registration
    async registerParent(parentData) {
        return await this.request('/parents', {
            method: 'POST',
            body: JSON.stringify(parentData)
        });
    }

    // Child registration
    async registerChild(childData) {
        return await this.request('/children', {
            method: 'POST',
            body: JSON.stringify(childData)
        });
    }

    // Get child by ID
    async getChild(childId) {
        return await this.request(`/children/${childId}`);
    }

    // Update child
    async updateChild(childId, childData) {
        return await this.request(`/children/${childId}`, {
            method: 'PUT',
            body: JSON.stringify(childData)
        });
    }

    // Add brushing record
    async addBrushingRecord(recordData) {
        return await this.request('/brushing-records', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    }

    // Get brushing records for a child
    async getBrushingRecords(childId, days = 30) {
        return await this.request(`/brushing-records/child/${childId}?days=${days}`);
    }

    // Get child statistics
    async getChildStats(childId) {
        return await this.request(`/children/${childId}/stats`);
    }

    // Update child settings
    async updateChildSettings(childId, settings) {
        return await this.request(`/children/${childId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Get all children for a parent
    async getParentChildren(parentId) {
        return await this.request(`/parents/${parentId}/children`);
    }

    // Get parent dashboard data
    async getParentDashboard(parentId) {
        return await this.request(`/parents/${parentId}/dashboard`);
    }

    // Add reward
    async addReward(rewardData) {
        return await this.request('/rewards', {
            method: 'POST',
            body: JSON.stringify(rewardData)
        });
    }

    // Get child rewards
    async getChildRewards(childId) {
        return await this.request(`/rewards/child/${childId}`);
    }

    // Update reward status
    async updateRewardStatus(rewardId, status) {
        return await this.request(`/rewards/${rewardId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
}

// Initialize API service
const apiService = new APIService();