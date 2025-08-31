import React from 'react';
import NotificationInbox from './NotificationInbox';

// Example component showing how to use Novu Inbox
const ExampleUsage = () => {
  // You can use the provided subscriber ID for testing
  const testSubscriberId = '68b3af7a3c95e3a7907d87cb';
  const testUserEmail = 'test@example.com';

  // Or get the actual user ID from your auth system
  // const { user } = useAuth();
  // const subscriberId = user?.id;
  // const userEmail = user?.email;

  return (
    <div className="flex items-center justify-end p-4">
      <NotificationInbox 
        userId={testSubscriberId} 
        userEmail={testUserEmail} 
      />
    </div>
  );
};

export default ExampleUsage;