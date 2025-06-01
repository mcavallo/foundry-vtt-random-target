import { createSymlink, getLinkDir } from './foundryLink.utils.js';

const linkDir = getLinkDir();
createSymlink(linkDir);
