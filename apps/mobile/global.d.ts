// Global type declarations for React Native environment
// This file provides type definitions for globals that are available in React Native

/// <reference types="react-native" />
/// <reference types="expo" />

// Declare Node.js globals that are available in React Native environment
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: string;
  };
};

// Declare Promise constructor for async/await support
declare const Promise: {
  prototype: Promise<any>;
  new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
  all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>;
  race<T>(values: Iterable<T | PromiseLike<T>>): Promise<T>;
  reject(reason?: any): Promise<never>;
  resolve<T>(value: T | PromiseLike<T>): Promise<T>;
};

// Declare missing Expo modules
declare module 'expo-av' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  
  export class Audio {
    static Sound: any;
    static Recording: any;
    static setAudioModeAsync: (mode: any) => Promise<void>;
    static requestPermissionsAsync: () => Promise<any>;
    static getPermissionsAsync: () => Promise<any>;
  }
  
  export class Video extends Component<ViewProps> {
    static displayName: string;
  }
}

// Declare missing wagmi/connectors module
declare module 'wagmi/connectors' {
  export const walletConnect: any;
  export const injected: any;
  export const coinbaseWallet: any;
}

// Declare missing viem module (partial)
declare module 'viem' {
  export const createWalletClient: any;
  export const custom: any;
  export const parseEther: any;
  export const formatEther: any;
  export const parseUnits: any;
  export const formatUnits: any;
  export const http: any;
  export type Chain = any;
  export type Transport = any;
}

// Declare missing AsyncStorage for web compatibility
declare module '@react-native-async-storage/async-storage' {
  export default {
    getItem: (key: string) => Promise<string | null>,
    setItem: (key: string, value: string) => Promise<void>,
    removeItem: (key: string) => Promise<void>,
    clear: () => Promise<void>,
    getAllKeys: () => Promise<string[]>,
    multiGet: (keys: string[]) => Promise<[string, string | null][]>,
    multiSet: (keyValuePairs: [string, string][]) => Promise<void>,
    multiRemove: (keys: string[]) => Promise<void>,
    multiMerge: (keyValuePairs: [string, string][]) => Promise<void>,
  };
}

// Extend JSX IntrinsicElements for React Native components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Extend with any custom components if needed
    }
  }
  interface Window {
    // Add any window extensions needed for your app
  }
}