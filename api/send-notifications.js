import notificationService from '../src/services/notificationService.js';
import { supabase } from '../src/lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, userId, data } = req.body;

  if (!type || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let result;

    switch (type) {
      case 'welcome':
        result = await notificationService.sendWelcomeNotification(
          userId,
          data.email,
          data.firstName
        );
        break;

      case 'new-job':
        result = await notificationService.sendNewJobAlert(userId, data.job);
        break;

      case 'job-saved':
        result = await notificationService.sendJobSavedNotification(userId, data.job);
        break;

      case 'weekly-digest':
        // Fetch user's job preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('job_categories, locations')
          .eq('user_id', userId)
          .single();

        // Fetch relevant jobs
        let query = supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (preferences?.job_categories) {
          query = query.in('category', preferences.job_categories);
        }
        if (preferences?.locations) {
          query = query.in('location', preferences.locations);
        }

        const { data: jobs } = await query;
        
        if (jobs && jobs.length > 0) {
          result = await notificationService.sendWeeklyDigest(userId, jobs);
        }
        break;

      case 'batch':
        result = await notificationService.batchSendNotifications(data.notifications);
        break;

      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}