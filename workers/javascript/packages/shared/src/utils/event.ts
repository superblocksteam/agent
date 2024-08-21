import rockset, { MainApi as RocksetClient } from '@rockset/client';
import { EnvEnum, RegionEnum, UserEvent } from '../types';
import { sleep } from './time';

const BATCH_MAX_PAYLOAD_SIZE_KB = 500;
const BATCH_MAX_LENGTH = 100;
const DEFAULT_FLUSH_TIMEOUT_MS = 5000;
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 3000;

export enum Collections {
  USER_EVENT = 'user-events'
}

function kilobytes(events: UserEvent[]): number {
  const size = encodeURI(JSON.stringify(events)).split(/%..|./).length - 1;
  return size / 1024;
}

// General logger function interface
interface LogFn {
  /* tslint:disable:no-unnecessary-generics */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends Record<string, unknown>>(obj: T, ...args: any[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (msg: string, ...args: any[]): void;
}

// General logger interface that could be either superblocks/ui logger or superlbocks/server logger
export interface Logger {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
}

export class EventSender {
  private static _instance: EventSender;

  rocksetClient: RocksetClient;
  workspace: string;
  collection: string;
  env: string;
  logger: Logger;
  eventsBuffer: UserEvent[];
  schedule: NodeJS.Timeout | undefined;
  // flush will be triggered after this timeout, all subsequent events will be batched
  flushTimeout: number;
  // flush immediately if the existing batch length reachs this limit
  batchMaxLength: number;
  // flush immediately if the existing batch length reachs this limit
  batchMaxSizeKB: number;

  retryCount: number;
  retryDelayMS: number;
  // region where superblocks is deployed to, e.g. us, eu
  region: RegionEnum;

  private constructor(
    apiKey: string,
    env: EnvEnum,
    region: RegionEnum,
    collection: string,
    logger: Logger,
    flushTimeout?: number,
    batchMaxLength?: number,
    batchMaxSizeKB?: number,
    retryCount?: number,
    retryDelayMS?: number
  ) {
    // Staging and dev share a rockset workspace
    if (new Set([EnvEnum.DEV, EnvEnum.STAGING, EnvEnum.STAGING_VERIFICATION, EnvEnum.DEMO, EnvEnum.CI]).has(env)) {
      this.workspace = 'staging';
    } else if (env === EnvEnum.PROD || env === EnvEnum.PROD_VERIFICATION) {
      this.workspace = 'prod';
    } else {
      throw Error(`Unknown environment: ${env}`);
    }

    if (!Object.values(RegionEnum).includes(region)) {
      throw Error(`Unknown region: ${region}`);
    }
    this.region = region;
    this.rocksetClient = rockset(apiKey);
    this.collection = collection;
    this.env = env;
    this.logger = logger;
    this.eventsBuffer = [];
    this.flushTimeout = flushTimeout ? flushTimeout : DEFAULT_FLUSH_TIMEOUT_MS;
    this.batchMaxLength = batchMaxLength ? batchMaxLength : BATCH_MAX_LENGTH;
    this.batchMaxSizeKB = batchMaxSizeKB ? batchMaxSizeKB : BATCH_MAX_PAYLOAD_SIZE_KB;
    this.retryCount = retryCount ? retryCount : RETRY_COUNT;
    this.retryDelayMS = retryDelayMS ? retryDelayMS : RETRY_DELAY_MS;
  }

  public static configure(
    apiKey: string,
    env: EnvEnum,
    region: RegionEnum,
    collection: string,
    logger: Logger,
    flushTimeout?: number,
    batchMaxLength?: number,
    batchMaxSizeKB?: number,
    retryCount?: number,
    retryDelayMS?: number
  ): void {
    this._instance = new this(
      apiKey,
      env,
      region,
      collection,
      logger,
      flushTimeout,
      batchMaxLength,
      batchMaxSizeKB,
      retryCount,
      retryDelayMS
    );
  }

  private static async flush(): Promise<void> {
    if (this._instance.eventsBuffer.length) {
      const eventsToSend = this._instance.eventsBuffer;
      this._instance.eventsBuffer = [];
      return this.sendEvents(eventsToSend);
    }
  }

  private static approachingMaxSize(events: UserEvent[]): boolean {
    return kilobytes(events) >= this._instance.batchMaxSizeKB - 50;
  }

  public static async sendEvents(events: UserEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    for (let x = 0; x < this._instance.retryCount; x++) {
      try {
        if (this._instance.env === EnvEnum.DEV || this._instance.env === EnvEnum.CI) {
          this._instance.logger.debug(`EventSender event: ${JSON.stringify(events)}`);
          return;
        }

        await this._instance.rocksetClient.documents.addDocuments(this._instance.workspace, this._instance.collection, {
          data: events
        });
        return;
      } catch (err) {
        this._instance.logger.error(
          `EventSender failed to send to Rockset, attempt: ${x + 1}/${this._instance.retryCount}, length: ${
            events.length
          }, payload: ${kilobytes(events)}, error: ${JSON.stringify(err)}`
        );
      }

      await sleep(this._instance.retryDelayMS);
    }
  }

  private static scheduleFlush(): void {
    // there is already a scheduled flush
    if (this._instance.schedule) {
      return;
    }

    // create a new scheduled flush
    this._instance.schedule = setTimeout(() => {
      this._instance.schedule = undefined;
      this.flush().catch((err) => {
        this._instance.logger.error(`scheduled flush failed: ${JSON.stringify(err)}`);
      });
    }, this._instance.flushTimeout);
  }

  public static clearFlushSchedule(): void {
    if (this._instance?.schedule) {
      clearTimeout(this._instance.schedule);
      this._instance.schedule = undefined;
    }
  }

  // This is the main interface that users of this lib will be using and it's non-blocking
  public static async send(event: UserEvent): Promise<void> {
    if (!this._instance) {
      throw Error('RocksetClient not initialized');
    }
    event.region = this._instance.region;

    // if the incoming message is large, flush the existing batch
    if (this.approachingMaxSize([...this._instance.eventsBuffer, event])) {
      try {
        await this.flush();
      } catch (err) {
        this._instance.logger.error(`flush existing batch before incoming large event failed: ${JSON.stringify(err)}`);
      }
    }

    this._instance.eventsBuffer.push(event);
    const overflow =
      this._instance.eventsBuffer.length >= this._instance.batchMaxLength || this.approachingMaxSize(this._instance.eventsBuffer);

    if (overflow) {
      this.flush().catch((err) => {
        this._instance.logger.error(`overflow flush failed: ${JSON.stringify(err)}`);
      });
    } else {
      this.scheduleFlush();
    }
  }
}
