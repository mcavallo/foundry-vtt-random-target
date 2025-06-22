import { createSymlink, getLinkDir } from './utils';

const linkDir = getLinkDir();
createSymlink(linkDir);
