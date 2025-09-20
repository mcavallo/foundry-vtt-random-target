import path from 'node:path';
import { run } from './foundryRelease';

const rootDir = path.resolve(import.meta.dir, '..', '..');
void run(rootDir);
