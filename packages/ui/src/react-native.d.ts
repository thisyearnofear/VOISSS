// Ambient type declaration to allow type checking to pass for cross-platform components
declare module 'react-native' {
  export const Linking: {
    openURL: (url: string) => Promise<void>;
  };
  
  export const Alert: {
    alert: (title: string, message: string, buttons?: any[]) => void;
  };
  
  export const Clipboard: {
    setString: (content: string) => void;
  };
  
  export const StyleSheet: {
    create: <T extends {}>(styles: T) => T;
  };
  
  export const View: any;
  export const Text: any;
  export const TouchableOpacity: any;
  
  export default any;
}