import fs from 'fs-extra';

export const checkDirOrSymlinkExistence = async (
  dirPath: string,
  assertion: boolean
) => {
  try {
    const stats = await fs.lstat(dirPath);
    return assertion === (stats.isSymbolicLink() || stats.isDirectory());
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getSymlinkType = () =>
  process.platform === 'win32' || /^(msys|cygwin)$/.test(Bun.env.OSTYPE ?? '')
    ? 'junction'
    : 'dir';
