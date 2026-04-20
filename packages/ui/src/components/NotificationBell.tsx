/**
 * NotificationBell Component
 * ENHANCEMENT FIRST: Reusable notification UI component
 * CLEAN: Minimal dependencies, works on web and native
 */

import React, { useState } from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  className?: string;
  maxDisplay?: number;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onNotificationClick,
  className = '',
  maxDisplay = 5,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  const getPriorityColor = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const displayNotifications = notifications.slice(0, maxDisplay);

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl z-20 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {displayNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                displayNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#2A2A2A] last:border-b-0 ${
                      !notification.read ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority Indicator */}
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(
                          notification.priority
                        )}`}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? 'text-gray-300'
                                : 'text-white'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxDisplay && (
              <div className="px-4 py-3 border-t border-[#2A2A2A] text-center">
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
