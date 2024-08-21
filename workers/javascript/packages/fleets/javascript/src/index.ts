import { run } from '@superblocks/worker.js';
import sb_javascript from '@superblocksteam/javascript';

(async () => run({ 'sb-javascript': new sb_javascript() }))();
