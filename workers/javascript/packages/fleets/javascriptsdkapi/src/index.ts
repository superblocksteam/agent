import { run } from '@superblocks/worker.js';
import sb_javascriptsdkapi from '@superblocksteam/javascript-sdk-api';

(async () => run({ 'sb-javascriptsdkapi': new sb_javascriptsdkapi() }))();
