import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      const unsubscribe = notificationService.subscribe(() => {
        loadNotifications();
      });
      return unsubscribe;
    }
  }, [isOpen]);

  const loadNotifications = () => {
    try {
      const allNotifications = notificationService.getAllNotifications();
      const notificationStats = notificationService.getStats();
      setNotifications(allNotifications || []);
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      case 'Low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Law Change': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Compliance Alert': return <Info className="w-4 h-4 text-orange-500" />;
      case 'System': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Law Change': return 'text-red-600';
      case 'Compliance Alert': return 'text-orange-600';
      case 'System': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString() === new Date().toLocaleDateString() 
        ? 'Today' 
        : date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on law changes, compliance alerts, and account notifications
          </p>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Type and Priority Badges */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium ${getTypeBadge(notification.type)}`}>
                          {notification.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.timestamp)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-gray-900 text-sm">
                        {notification.title}
                      </h4>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.description}
                      </p>

                      {/* Source Link */}
                      {notification.sourceUrl && (
                        <a 
                          href={notification.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Source
                        </a>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {stats && stats.unread > 0 && (
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={() => {
                notificationService.markAllAsRead();
                loadNotifications();
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read ({stats.unread} unread)
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
