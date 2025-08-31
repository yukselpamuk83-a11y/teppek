import { Novu } from '@novu/api';

// Initialize Novu with your API key
const novu = new Novu(import.meta.env.VITE_NOVU_API_KEY || '');

// Notification types
export const NotificationTypes = {
  NEW_JOB: 'new-job-alert',
  JOB_APPLICATION: 'job-application',
  JOB_SAVED: 'job-saved',
  JOB_EXPIRED: 'job-expired',
  WELCOME: 'welcome-email',
  WEEKLY_DIGEST: 'weekly-digest'
};

// Send notification helper
export async function sendNotification(subscriberId, templateId, payload = {}) {
  try {
    const result = await novu.trigger(templateId, {
      to: {
        subscriberId: subscriberId
      },
      payload: payload
    });
    
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Create or update subscriber
export async function createSubscriber(userId, email, firstName = '', lastName = '') {
  try {
    const subscriber = await novu.subscribers.identify(userId, {
      email: email,
      firstName: firstName,
      lastName: lastName
    });
    
    console.log('Subscriber created/updated:', subscriber);
    return subscriber;
  } catch (error) {
    console.error('Error creating subscriber:', error);
    throw error;
  }
}

// Update subscriber preferences
export async function updateSubscriberPreferences(subscriberId, channelType, enabled) {
  try {
    const result = await novu.subscribers.updatePreference(subscriberId, {
      channel: channelType,
      enabled: enabled
    });
    
    return result;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

// Get subscriber preferences
export async function getSubscriberPreferences(subscriberId) {
  try {
    const preferences = await novu.subscribers.getPreference(subscriberId);
    return preferences;
  } catch (error) {
    console.error('Error getting preferences:', error);
    throw error;
  }
}

// Delete subscriber
export async function deleteSubscriber(subscriberId) {
  try {
    const result = await novu.subscribers.delete(subscriberId);
    return result;
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    throw error;
  }
}

export default novu;