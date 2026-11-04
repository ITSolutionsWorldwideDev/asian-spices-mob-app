import { Alert, Platform } from "react-native";

export function showAlert(
  title: string,
  message?: string,
  buttons?: Array<{ text: string; onPress?: () => void }>,
) {
  if (Platform.OS === "web") {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    window.alert(fullMessage);
    if (buttons && buttons.length > 0) {
      const confirmBtn =
        buttons.find((b) => b.text.toLowerCase() !== "cancel") || buttons[0];
      confirmBtn?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}

