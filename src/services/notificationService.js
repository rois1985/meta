/**
 * Notification Service
 * Handles law changes, compliance alerts, and account notifications
 * Connected to real-time regulation scraping system
 */

class NotificationService {
  constructor() {
    this.notifications = this.loadNotifications();
    this.listeners = [];
    this.notificationTypes = {
      LAW_CHANGE: 'Law Change',
      COMPLIANCE_ALERT: 'Compliance Alert',
      SYSTEM: 'System',
      ACCOUNT: 'Account'
    };
    this.priorities = {
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low'
    };
    this.updateCheckInterval = null;
    this.isChecking = false;
    this.regulationUpdateService = null;
  }

  /**
   * Initialize notification service with real-time updates
   */
  async init() {
    try {
      // Lazy load regulation update service to avoid circular dependency
      const { regulationUpdateService } = await import('./regulationUpdateService');
      this.regulationUpdateService = regulationUpdateService;
      
      // Start checking for regulation updates every 5 minutes
      this.startRealTimeUpdates();
      
      // Do an initial check (delayed to not block UI)
      setTimeout(() => this.checkForRegulationUpdates(), 2000);
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Start real-time update checking
   */
  startRealTimeUpdates() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    
    // Check for updates every 5 minutes (300000ms)
    this.updateCheckInterval = setInterval(() => {
      this.checkForRegulationUpdates();
    }, 300000);
    
    console.log('Real-time notification updates started');
  }

  /**
   * Stop real-time update checking
   */
  stopRealTimeUpdates() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Load notifications from localStorage
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : this.getDefaultNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
      return this.getDefaultNotifications();
    }
  }

  /**
   * Save notifications to localStorage
   */
  saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Get default notifications
   */
  getDefaultNotifications() {
    return [
      {
        id: 'notif_001',
        type: this.notificationTypes.LAW_CHANGE,
        priority: this.priorities.HIGH,
        title: 'FDA Updates Supplement Advertising Rules',
        description: 'New FDA guidelines for supplement advertising went into effect. Review your health and wellness campaigns to ensure compliance.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        read: false,
        actionRequired: true,
        authority: 'FDA',
        category: 'Health & Wellness',
        relatedRegulations: ['reg_045', 'reg_067']
      },
      {
        id: 'notif_002',
        type: this.notificationTypes.COMPLIANCE_ALERT,
        priority: this.priorities.MEDIUM,
        title: 'Google Ads Policy Update',
        description: 'Google has updated their healthcare advertising policies. Your campaigns may be affected. Review and update targeting criteria.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: false,
        actionRequired: true,
        authority: 'Google',
        category: 'Platform Policy',
        relatedRegulations: ['reg_129', 'reg_130']
      },
      {
        id: 'notif_003',
        type: this.notificationTypes.SYSTEM,
        priority: this.priorities.LOW,
        title: 'Analysis Complete: Q4 Campaign Review',
        description: 'Your compliance analysis for "Q4 Holiday Campaign" has been completed with a score of 85%. Review recommendations.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: false,
        actionRequired: false,
        category: 'Analysis',
        reviewId: 'review_q4_2024'
      },
      {
        id: 'notif_004',
        type: this.notificationTypes.LAW_CHANGE,
        priority: this.priorities.HIGH,
        title: 'EU GDPR Marketing Updates',
        description: 'European Union has updated GDPR requirements for marketing data collection and consent mechanisms.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        read: false,
        actionRequired: true,
        authority: 'EU Commission',
        category: 'Data Privacy',
        relatedRegulations: ['reg_089', 'reg_090']
      }
    ];
  }

  /**
   * Add new notification
   */
  addNotification(notification) {
    const newNotification = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    
    console.log('New notification added:', newNotification.title);
    return newNotification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  /**
   * Get all notifications
   */
  getAllNotifications() {
    return [...this.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Get notifications by priority
   */
  getNotificationsByPriority(priority) {
    return this.notifications.filter(n => n.priority === priority);
  }

  /**
   * Get notifications requiring action
   */
  getActionRequiredNotifications() {
    return this.notifications.filter(n => n.actionRequired && !n.read);
  }

  /**
   * Get notification statistics
   */
  getStats() {
    const total = this.notifications.length;
    const unread = this.getUnreadNotifications().length;
    const highPriority = this.getNotificationsByPriority(this.priorities.HIGH).filter(n => !n.read).length;
    const actionRequired = this.getActionRequiredNotifications().length;

    return {
      total,
      unread,
      highPriority,
      actionRequired,
      byType: {
        [this.notificationTypes.LAW_CHANGE]: this.getNotificationsByType(this.notificationTypes.LAW_CHANGE).length,
        [this.notificationTypes.COMPLIANCE_ALERT]: this.getNotificationsByType(this.notificationTypes.COMPLIANCE_ALERT).length,
        [this.notificationTypes.SYSTEM]: this.getNotificationsByType(this.notificationTypes.SYSTEM).length,
        [this.notificationTypes.ACCOUNT]: this.getNotificationsByType(this.notificationTypes.ACCOUNT).length
      },
      byPriority: {
        [this.priorities.HIGH]: this.getNotificationsByPriority(this.priorities.HIGH).length,
        [this.priorities.MEDIUM]: this.getNotificationsByPriority(this.priorities.MEDIUM).length,
        [this.priorities.LOW]: this.getNotificationsByPriority(this.priorities.LOW).length
      }
    };
  }

  /**
   * Check for regulation updates and create notifications
   * Connected to real-time scraping system
   */
  async checkForRegulationUpdates() {
    if (this.isChecking || !this.regulationUpdateService) return;
    
    this.isChecking = true;
    console.log('Checking for regulation updates from scraping system...');
    
    try {
      // Check if updates are needed
      if (this.regulationUpdateService.needsUpdate()) {
        console.log('Updates needed - fetching from regulation sources...');
        
        const updateResults = await this.regulationUpdateService.updateAllRegulations();
        
        // Create notifications for new regulations
        if (updateResults.newRegulations && updateResults.newRegulations.length > 0) {
          updateResults.newRegulations.forEach(update => {
            // Check if we already have a notification for this authority today
            const existingNotif = this.notifications.find(n => 
              n.authority === update.authority && 
              n.type === this.notificationTypes.LAW_CHANGE &&
              new Date(n.timestamp).toDateString() === new Date().toDateString()
            );
            
            if (!existingNotif) {
              this.addNotification({
                type: this.notificationTypes.LAW_CHANGE,
                priority: this.priorities.HIGH,
                title: `New ${update.authority} Regulations`,
                description: `${update.urls.length} new regulations have been published. Review your campaigns for compliance.`,
                actionRequired: true,
                authority: update.authority,
                category: 'Regulatory Update',
                relatedRegulations: update.urls.map(u => u.url)
              });
            }
          });
        }

        // Create notifications for updated regulations
        if (updateResults.updatedRegulations && updateResults.updatedRegulations.length > 0) {
          updateResults.updatedRegulations.forEach(update => {
            // Check if we already have a notification for this authority today
            const existingNotif = this.notifications.find(n => 
              n.authority === update.authority && 
              n.type === this.notificationTypes.LAW_CHANGE &&
              new Date(n.timestamp).toDateString() === new Date().toDateString()
            );
            
            if (!existingNotif) {
              this.addNotification({
                type: this.notificationTypes.LAW_CHANGE,
                priority: this.priorities.HIGH,
                title: `${update.authority} Policy Updates`,
                description: `Updates have been detected in ${update.authority} regulations. Review affected campaigns.`,
                actionRequired: true,
                authority: update.authority,
                category: 'Policy Update',
                relatedRegulations: update.urls.map(u => u.url)
              });
            }
          });
        }

        // Create notifications for errors
        if (updateResults.errors && updateResults.errors.length > 0) {
          this.addNotification({
            type: this.notificationTypes.SYSTEM,
            priority: this.priorities.MEDIUM,
            title: 'Regulation Update Issues',
            description: `${updateResults.errors.length} authorities could not be updated. Manual review may be required.`,
            actionRequired: false,
            category: 'System Alert'
          });
        }
        
        console.log('Regulation update check completed:', {
          new: updateResults.newRegulations?.length || 0,
          updated: updateResults.updatedRegulations?.length || 0,
          errors: updateResults.errors?.length || 0
        });
      } else {
        console.log('No regulation updates needed at this time');
      }

    } catch (error) {
      console.error('Error checking regulation updates:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Force check for regulation updates (manual trigger)
   */
  async forceCheckUpdates() {
    if (!this.regulationUpdateService) {
      console.log('Regulation update service not initialized');
      return this.getStats();
    }
    console.log('Force checking for regulation updates...');
    await this.regulationUpdateService.forceUpdate();
    await this.checkForRegulationUpdates();
    return this.getStats();
  }

  /**
   * Get last update status from scraping system
   */
  getUpdateStatus() {
    if (!this.regulationUpdateService) return { lastUpdate: null, needsUpdate: true };
    return this.regulationUpdateService.getUpdateStatus();
  }

  /**
   * Create notification for analysis completion
   */
  addAnalysisCompleteNotification(reviewData) {
    const score = reviewData.analysis?.overallScore || reviewData.multiFileAnalysis?.overallScore || 0;
    const status = score >= 80 ? 'passed' : score >= 60 ? 'needs review' : 'failed';
    
    this.addNotification({
      type: this.notificationTypes.SYSTEM,
      priority: this.priorities.LOW,
      title: `Analysis Complete: ${reviewData.title}`,
      description: `Your compliance analysis has been completed with a score of ${score}%. ${status === 'passed' ? 'Campaign meets compliance standards.' : 'Review recommendations for improvement.'}`,
      actionRequired: status !== 'passed',
      category: 'Analysis',
      reviewId: reviewData.id,
      analysisScore: score
    });
  }

  /**
   * Create notification for compliance issues
   */
  addComplianceAlertNotification(issueData) {
    const priority = issueData.severity === 'critical' ? this.priorities.HIGH :
                    issueData.severity === 'high' ? this.priorities.HIGH :
                    issueData.severity === 'medium' ? this.priorities.MEDIUM :
                    this.priorities.LOW;

    this.addNotification({
      type: this.notificationTypes.COMPLIANCE_ALERT,
      priority,
      title: `Compliance Issue: ${issueData.authority}`,
      description: issueData.description || 'A compliance issue has been detected in your content.',
      actionRequired: priority === this.priorities.HIGH,
      authority: issueData.authority,
      category: 'Compliance Issue',
      severity: issueData.severity
    });
  }

  /**
   * Create notification for platform policy changes
   */
  addPlatformPolicyNotification(platformData) {
    this.addNotification({
      type: this.notificationTypes.COMPLIANCE_ALERT,
      priority: this.priorities.MEDIUM,
      title: `${platformData.platform} Policy Update`,
      description: `${platformData.platform} has updated their advertising policies. Review your campaigns to ensure continued compliance.`,
      actionRequired: true,
      authority: platformData.platform,
      category: 'Platform Policy',
      policyChanges: platformData.changes
    });
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  /**
   * Search notifications
   */
  searchNotifications(query) {
    const queryLower = query.toLowerCase();
    return this.notifications.filter(notification =>
      notification.title.toLowerCase().includes(queryLower) ||
      notification.description.toLowerCase().includes(queryLower) ||
      (notification.authority && notification.authority.toLowerCase().includes(queryLower)) ||
      (notification.category && notification.category.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Filter notifications
   */
  filterNotifications(filters) {
    return this.notifications.filter(notification => {
      if (filters.type && notification.type !== filters.type) return false;
      if (filters.priority && notification.priority !== filters.priority) return false;
      if (filters.read !== undefined && notification.read !== filters.read) return false;
      if (filters.actionRequired !== undefined && notification.actionRequired !== filters.actionRequired) return false;
      if (filters.authority && notification.authority !== filters.authority) return false;
      if (filters.category && notification.category !== filters.category) return false;
      if (filters.dateFrom && new Date(notification.timestamp) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(notification.timestamp) > new Date(filters.dateTo)) return false;
      return true;
    });
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  clearOldNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(notification =>
      new Date(notification.timestamp) > thirtyDaysAgo || !notification.read
    );

    const removedCount = initialCount - this.notifications.length;
    if (removedCount > 0) {
      this.saveNotifications();
      console.log(`Cleared ${removedCount} old notifications`);
    }
    
    return removedCount;
  }

  /**
   * Get notification preferences
   */
  getPreferences() {
    try {
      const stored = localStorage.getItem('notificationPreferences');
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences() {
    return {
      enabled: true,
      types: {
        [this.notificationTypes.LAW_CHANGE]: true,
        [this.notificationTypes.COMPLIANCE_ALERT]: true,
        [this.notificationTypes.SYSTEM]: true,
        [this.notificationTypes.ACCOUNT]: true
      },
      priorities: {
        [this.priorities.HIGH]: true,
        [this.priorities.MEDIUM]: true,
        [this.priorities.LOW]: false
      },
      autoMarkRead: false,
      soundEnabled: true,
      browserNotifications: false,
      emailNotifications: false
    };
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences) {
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
