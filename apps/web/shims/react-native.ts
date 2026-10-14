// Build-time stub for `react-native` in web bundles.
// Equivalent of the webpack `resolve.alias: { 'react-native': false }` that
// vinext does not carry over. Only reachable through shared UI components
// that are never rendered on web — exports exist so named ESM imports
// resolve, but nothing here is expected to execute.
export const View = undefined;
export const Text = undefined;
export const ScrollView = undefined;
export const TouchableOpacity = undefined;
export const TouchableHighlight = undefined;
export const Pressable = undefined;
export const Modal = undefined;
export const Image = undefined;
export const TextInput = undefined;
export const FlatList = undefined;
export const ActivityIndicator = undefined;
export const SafeAreaView = undefined;

export const StyleSheet = {
  create: <T>(styles: T): T => styles,
  hairlineWidth: 1,
  absoluteFill: {},
  absoluteFillObject: {},
  flatten: (s: unknown) => s,
};

export const Dimensions = {
  get: () => ({ width: 0, height: 0, scale: 1, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
};

export const Linking = {
  openURL: async () => {},
  canOpenURL: async () => false,
  addEventListener: () => ({ remove: () => {} }),
};

export const Alert = { alert: () => {}, prompt: () => {} };
export const Clipboard = { setString: () => {}, getString: async () => "" };

export const Platform = {
  OS: "web",
  select: <T>(specifics: { default?: T; web?: T; native?: T }): T | undefined =>
    specifics.web ?? specifics.native ?? specifics.default,
};

export const NativeModules = {};
export const DeviceEventEmitter = { addListener: () => ({ remove: () => {} }) };
export const AppState = { currentState: "active", addEventListener: () => ({ remove: () => {} }) };

export default {};
