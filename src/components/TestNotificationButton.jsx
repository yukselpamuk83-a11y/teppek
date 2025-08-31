import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

const TestNotificationButton = ({ userId = '68b3af7a3c95e3a7907d87cb' }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const sendTestNotification = async () => {
    setLoading(true);
    setStatus(null);

    try {
      // Novu API'ye direkt istek gönder
      const response = await fetch('https://api.novu.co/v1/events/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${import.meta.env.VITE_NOVU_API_KEY || ''}`
        },
        body: JSON.stringify({
          name: 'test-notification',
          to: {
            subscriberId: userId,
            timezone: 'Europe/Istanbul'
          },
          payload: {
            title: 'Test Bildirimi',
            message: 'Novu Inbox başarıyla çalışıyor! 🎉'
          }
        })
      });

      if (response.ok) {
        setStatus('success');
        console.log('Test notification sent successfully');
      } else {
        const error = await response.json();
        console.error('Failed to send notification:', error);
        setStatus('error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus('error');
    } finally {
      setLoading(false);
      // Reset status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={sendTestNotification}
        disabled={loading}
        variant={status === 'success' ? 'success' : status === 'error' ? 'destructive' : 'primary'}
        size="sm"
        className="transition-all"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Gönderiliyor...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Gönderildi!
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Hata!
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Test Bildirimi Gönder
          </>
        )}
      </Button>
      
      {status === 'error' && (
        <span className="text-sm text-red-500">
          API anahtarını kontrol edin
        </span>
      )}
    </div>
  );
};

export default TestNotificationButton;