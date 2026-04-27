// Entry point for the Beral Care Expo app.
// Expo requires this file to exist at the root to bootstrap the application.
import { registerRootComponent } from 'expo';

// main-app.js contains the root navigator with all role-based screen routes
import App from './main-app.js';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
