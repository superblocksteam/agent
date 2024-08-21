// Plugin execution could show the underlying raw request, e.g. curl for RestAPI
// It's controlled by hasRawRequest of the Plugin
export type RawRequest = string | undefined;

export type TokenLocation = { startOffset: number; length: number };

export interface PlaceholderInfo {
  /** the same placeholder (such as $1) might be used in multiple places so we need an array of locations here */
  locations: TokenLocation[];
  /** a textual representation of the bound value, possibly truncated (if it is too big) */
  value: string;
}

export type PlaceholdersInfo = Record<string, PlaceholderInfo>;

export interface StructuredLog {
  msg: string;
  level: 'info' | 'warn' | 'error';
}

export class ExecutionOutput {
  error?: string;
  authError?: boolean;
  children?: string[];
  startTimeUtc?: Date;
  executionTime: number;
  log: string[];
  structuredLog: StructuredLog[];
  output: unknown;
  request: RawRequest;
  placeholdersInfo?: PlaceholdersInfo;

  constructor() {
    this.output = {};
    this.log = [];
    this.structuredLog = [];
  }

  static fromJSONString(json: string): ExecutionOutput {
    const obj = JSON.parse(json);
    const instance = new ExecutionOutput();
    instance.error = obj.error;
    instance.children = obj.children;
    instance.executionTime = obj.executionTime;
    instance.log = obj.log;
    instance.structuredLog = obj.structuredLog;
    instance.output = obj.output;
    instance.request = obj.request;
    instance.startTimeUtc = new Date(obj.startTimeUtc);

    return instance;
  }

  logInfo(msg: string): void {
    if (msg) {
      this.log.push(`${msg}`);
      this.structuredLog.push({ msg, level: 'info' });
    }
  }

  logWarn(msg: string): void {
    if (msg) {
      this.log.push(`[WARN] ${msg}`);
      this.structuredLog.push({ msg, level: 'warn' });
    }
  }

  logError(msg: string, authError?: boolean): void {
    if (msg) {
      this.error = msg;
      this.authError = authError;
      this.log.push(`[ERROR] ${msg}`);
      this.structuredLog.push({ msg, level: 'error' });
    }
  }
}
