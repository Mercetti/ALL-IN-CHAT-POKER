import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export default function useNotifications() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(n => console.log(n));
    return () => subscription.remove();
  }, []);

  const sendNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({ 
      content: { title, body }, 
      trigger: null 
    });
  };

  return { sendNotification };
}
