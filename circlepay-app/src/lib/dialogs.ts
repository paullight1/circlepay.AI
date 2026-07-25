import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert/confirm — RN's Alert.alert is a silent no-op on
 * react-native-web, so web falls back to window.alert / window.confirm.
 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'OK',
  destructive = false
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
