import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';

const NotificationDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    const updateDebugInfo = () => {
      const stats = notificationService.getStats();
      const allNotifications = notificationService.getAllNotifications();
      const unreadNotifications = notificationService.getUnreadNotifications();
      
      setDebugInfo({
        totalNotifications: allNotifications.length,
        unreadCount: stats.unread,
        highPriority: stats.highPriority,
        actionRequired: stats.actionRequired,
        notifications: allNotifications.map(n => ({
          id: n.id,
          title: n.title,
          read: n.read,
          priority: n.priority,
          type: n.type
        }))
      });
    };

    updateDebugInfo();
    const unsubscribe = notificationService.subscribe(updateDebugInfo);
    
    return unsubscribe;
  }, []);

  const addTestNotification = () => {
    notificationService.addNotification({
      type: 'Compliance Alert',
      priority: 'High',
      title: 'Test Notification',
      description: 'This is a test notification to check if the system is working.',
      actionRequired: true,
      authority: 'Test Authority',
      category: 'Testing'
    });
  };

  const clearAllNotifications = () => {
    // Clear localStorage
    localStorage.removeItem('notifications');
    // Reload the page to reinitialize
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-bold text-lg mb-3">Notification Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>Total Notifications: <strong>{debugInfo.totalNotifications}</strong></div>
        <div>Unread Count: <strong>{debugInfo.unreadCount}</strong></div>
        <div>High Priority: <strong>{debugInfo.highPriority}</strong></div>
        <div>Action Required: <strong>{debugInfo.actionRequired}</strong></div>
      </div>

      <div className="mt-4 space-y-2">
        <button 
          onClick={addTestNotification}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Add Test Notification
        </button>
        <button 
          onClick={clearAllNotifications}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 ml-2"
        >
          Clear All
        </button>
      </div>

      <div className="mt-4">
        <div className="font-medium text-sm">Recent Notifications:</div>
        <div className="max-h-32 overflow-y-auto text-xs mt-1">
          {debugInfo.notifications?.slice(0, 5).map(n => (
            <div key={n.id} className={`p-1 border-b ${n.read ? 'text-gray-500' : 'font-medium'}`}>
              [{n.type}] {n.title} - {n.priority}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationDebug;
