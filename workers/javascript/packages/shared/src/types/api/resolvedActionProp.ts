export type TokenLocation = { startOffset: number; length: number };

export interface PlaceholderInfo {
  /** the same placeholder (such as $1) might be used in multiple places so we need an array of locations here */
  locations: TokenLocation[];
  /** a textual representation of the bound value, possibly truncated (if it is too big) */
  value: string;
}

export type PlaceholdersInfo = Record<string, PlaceholderInfo>;

export interface ResolvedActionConfigurationProperty {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolved: string | any[] | Buffer;
  placeholdersInfo?: PlaceholdersInfo;
}
