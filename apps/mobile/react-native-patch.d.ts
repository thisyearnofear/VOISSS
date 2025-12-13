import 'react-native';
import React from 'react';

declare module 'react-native' {
    interface NativeMethods {
        refs: {
            [key: string]: React.Component<any, any> | Element;
        };
    }
}
