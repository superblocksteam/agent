import { default as pino } from 'pino';
import { SUPERBLOCKS_WORKER_SANDBOX_LOG_LEVEL as level } from './env';

export default pino({
  level,
  formatters: {
    level(level) {
      return { level };
    },
    bindings() {
      return {};
    }
  },
  timestamp() {
    return `,"ts":${Date.now()}`;
  }
}).child({ component: 'javascript-plugins-sandbox' });
