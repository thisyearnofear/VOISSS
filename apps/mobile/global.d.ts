// Global type declarations for React Native environment
// This file provides type definitions for globals that are available in React Native

/// <reference types="react-native" />

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

// Extend global scope with additional types needed for React Native
declare global {
  interface Window {
    // Add any window extensions needed for your app
  }
}