import { getLinkDir, removeSymlink } from './foundryLink.utils.js';

const linkDir = getLinkDir();
removeSymlink(linkDir);
