import { GoogleSheetsActionConfiguration } from '@superblocks/shared';

function isValidInteger(s: string): boolean {
  return Number.isInteger(Number(s));
}

export function validateCreateWorksheet(actionConfiguration: GoogleSheetsActionConfiguration) {
  if (!actionConfiguration?.addSheet?.sheetTitle) {
    throw new Error('sheet name must be given');
  }
  if (actionConfiguration?.addSheet?.columnCount && !isValidInteger(actionConfiguration?.addSheet?.columnCount)) {
    throw new Error('row count must be a valid integer');
  }

  if (actionConfiguration?.addSheet?.rowCount && !isValidInteger(actionConfiguration?.addSheet?.rowCount)) {
    throw new Error('column count must be a valid integer');
  }
}
