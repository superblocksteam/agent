type FileMetadata = {
  // original name
  name: string;
  extension: string;
  // mime type
  type: string;
  size: number;
  encoding: 'text' | 'base64' | 'binary';
};

export type FileMetadataPrivate = FileMetadata &
  Readonly<{
    $superblocksId: string;
  }>;

export type ReadableFile = FileMetadata &
  Readonly<{
    // only available in the browser, contains image urls like
    // "blob:http://app.superblockshq.com/uuid-uuid-uuid-uuid"
    previewUrl: string;
    readContents: () => string;
  }>;

type FileConstructorArgs = FileMetadata & {
  // We should consider supporting Blobs & Buffers for streaming file
  // contents
  contents: string;
};

export type FileConstructor = (fileDef: FileConstructorArgs) => ReadableFile;

// TODO [ro] the encoding seems wrong.
// The following is an example of readable file from temp location
// This is the file objects returned by FilePicker.files
// {
//  "name": "small.png",
//  "extension": "png",
//  "type": "image/png",
//  "size": 5704,
//  "encoding": "text",
//  "$superblocksId": "uppy-small_png-1e-image_png-5704-1674601389293"
// }
export function isReadableFile(f: unknown): f is FileMetadataPrivate {
  if (!f || typeof f !== 'object' || Array.isArray(f)) {
    return false;
  }
  const entries = Object.entries(f as Record<string, unknown>);
  if (entries.length === 0) {
    return false;
  }
  return Object.entries(f as Record<string, unknown>).every(([key, value]) => {
    switch (key) {
      case 'name':
      case 'extension':
      case 'type':
      case 'encoding':
      case '$superblocksId':
        return typeof value === 'string';
      case 'size':
        return typeof value === 'number';
      case 'previewUrl':
      case 'path':
        return typeof value === 'string' || typeof value === 'undefined';
      default:
        return false;
    }
  });
}

// This is used to determine if the object is a valid custom file object
// it has to have name, contents, and type
export function isReadableFileConstructor(f: unknown): f is FileConstructorArgs {
  if (!f || typeof f !== 'object') {
    return false;
  }
  return Object.entries(f as Record<string, unknown>).every(([key, value]) => {
    switch (key) {
      case 'name':
      case 'contents':
        // @ts-ignore contents might be string or Buffer.toJSON()
        // Buffer.toJSON() is determined by 'type' === 'Buffer'
        // This supports passing Buffer to contents
        // {
        //   name: 'filename',
        //   contents: {{Step2.output}},
        //   type: 'filetype
        // }
        return typeof value === 'string' || value['type'] === 'Buffer';
      case 'type':
        return typeof value === 'string';
      default:
        return false;
    }
  });
}
