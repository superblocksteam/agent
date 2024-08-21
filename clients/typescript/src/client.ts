import { ExecutorService } from './services/executor';
import { ApiConfig, ClientConfig } from './types';
import { merge } from './utils/merge';
import pino from 'pino';
import { log } from '@grpc/grpc-js/build/src/logging';

const DEFAULT_API_CONFIG: ApiConfig = {
  viewMode: 'editor'
};

export class Client {
  private readonly executorService: ExecutorService;
  private apiConfig: ApiConfig;
  private connectionConfig: ClientConfig;

  public constructor({ config, defaults = {}, logger }: { config: ClientConfig; defaults?: ApiConfig; logger?: pino.Logger }) {
    this.apiConfig = merge(DEFAULT_API_CONFIG, defaults) as ApiConfig;
    this.connectionConfig = config;

    this.connectionConfig.endpoint = this.connectionConfig.endpoint ?? 'agent.superblocks.com:8443';

    this.connectionConfig.retries = this.connectionConfig.retries ?? 3;
    if (this.connectionConfig.retries < 0) {
      throw new Error('retries must be greater or equal to 0');
    }

    this.executorService = new ExecutorService({
      url: this.connectionConfig.endpoint,
      apiKey: this.connectionConfig.token,
      authority: this.connectionConfig.authority,
      insecure: this.connectionConfig.insecure ?? false,
      connectionTimeoutMs: this.connectionConfig.connectionTimeoutMs ?? 10 * 1000,
      logger: logger
    });
  }

  public getExecutorService(forceNew = false): ExecutorService {
    return this.executorService;
  }

  public getDefaultApiConfig(): ApiConfig {
    return {
      profile: this.apiConfig.profile,
      commit: this.apiConfig.commit,
      branch: this.apiConfig.branch,
      viewMode: this.apiConfig.viewMode
    };
  }

  public getRetries(): number {
    return this.connectionConfig.retries;
  }

  public close() {
    this.executorService.close();
  }
}
