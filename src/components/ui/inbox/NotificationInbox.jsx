import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const NotificationInbox = ({ userId, userEmail }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  
  // Simple notification bell placeholder since @novu/js requires different setup
  // This can be enhanced with proper @novu/js integration later
  
  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unseenCount > 0) {
      setUnseenCount(0); // Mark as seen
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Bildirimler</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Henüz bildirim yok
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  {notification.title}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationInbox;