/**
 * React Native Entry Point
 * Main entry for the All-In Chat Poker mobile app
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => App);
