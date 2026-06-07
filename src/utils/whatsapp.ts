import { Linking, Alert } from 'react-native';

export const sendKhataReminder = async (phone: string, name: string, amount: number) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = `Namaste ${name}, pending bill ₹${amount}`;
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;

  // The wa.me web link lets Android's intent resolver decide: WhatsApp if
  // installed, browser otherwise. No need to gate on canOpenURL().
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    Alert.alert('Error', 'Could not open WhatsApp.');
  }
};
