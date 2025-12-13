import 'react-native-get-random-values';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

// Polyfill web crypto immediately
polyfillWebCrypto();

// Mock window for wagmi/viem/connectors that assume browser env
if (typeof window === 'undefined') {
    // @ts-ignore
    global.window = {};
}

if (!global.window.addEventListener) {
    global.window.addEventListener = () => { };
}

if (!global.window.removeEventListener) {
    global.window.removeEventListener = () => { };
}

if (!global.window.location) {
    // @ts-ignore
    global.window.location = {
        protocol: 'https:',
        host: 'localhost',
        origin: 'https://localhost',
    };
}
