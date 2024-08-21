export const SuperblocksOcrPluginVersions = {
  V1: '0.0.1'
};
export enum SUPERBLOCKS_OCR_ACTION {
  FROM_FILE = 'From File',
  FROM_URL = 'From URL'
}

export const SUPERBLOCKS_OCR_ACTION_AND_DESCRIPTION = {
  [SUPERBLOCKS_OCR_ACTION.FROM_FILE]: 'Given an image or PDF file, convert to text',
  [SUPERBLOCKS_OCR_ACTION.FROM_URL]: 'Given a URL to an image or PDF file, convert to text'
};
