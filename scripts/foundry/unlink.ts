import { getLinkDir, removeSymlink } from './utils';

const linkDir = getLinkDir();
removeSymlink(linkDir);
