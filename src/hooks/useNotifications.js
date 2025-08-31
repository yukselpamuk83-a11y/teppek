import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import notificationService from '../services/notificationService.js';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new jobs for notifications
    const subscription = supabase
      .channel('job-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs'
        },
        async (payload) => {
          // Check if user has job alert preferences
          const shouldNotify = await notificationService.shouldSendNotification(
            userId, 
            'new-job-alert'
          );
          
          if (shouldNotify && payload.new) {
            // Send notification for new job
            await notificationService.sendNewJobAlert(userId, payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Function to save a job and trigger notification
  const saveJob = async (jobData) => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_id: jobData.id,
          saved_at: new Date().toISOString()
        });

      if (error) throw error;

      // Send notification
      await notificationService.sendJobSavedNotification(userId, jobData);
      
      return data;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    loading,
    error,
    saveJob,
    markAsRead,
    markAllAsRead
  };
}