import path from 'node:path';
import { run } from './checkTranslations';

const rootDir = path.resolve(import.meta.dir, '..', '..');
void run(rootDir);
