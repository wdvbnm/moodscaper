import { registerRootComponent } from 'expo';

import App from './App';

// 在 React 组件树挂载之前，确保后台任务已在全局作用域中定义
import './src/services/backgroundTaskService';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
