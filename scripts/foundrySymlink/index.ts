import path from 'node:path';
import { run } from './foundrySymlink';

const rootDir = path.resolve(import.meta.dir, '..', '..');
void run(rootDir, process.argv);
