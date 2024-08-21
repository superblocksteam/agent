import { JavaScriptValue } from 'google-protobuf/google/protobuf/struct_pb';
import { Client } from '../client';
import { ApiConfig, Result, Mock, Params } from '../types';
import { merge } from '../utils/merge';

export class Api {
  private readonly id: string;
  private readonly apiConfig?: ApiConfig;

  public constructor(id: string, config?: ApiConfig) {
    this.id = id;
    this.apiConfig = config;
  }

  /**
   * Run the api
   * @param inputs  Api inputs
   * @param mocks  Optional for mocking the step output
   * @param superblocks  Superblocks client
   */
  public async run(
    {
      inputs = {},
      mocks = []
    }: {
      inputs?: object;
      mocks?: Mock[];
    },
    superblocks: Client
  ): Promise<Result> {
    let executorService = superblocks.getExecutorService();
    const retries = superblocks.getRetries();

    const mergedApiConfig = merge(superblocks.getDefaultApiConfig(), this.apiConfig ?? {});

    return await executorService.execute({
      apiId: this.id,
      inputs: inputs,
      mocks: mocks,
      apiConfig: mergedApiConfig,
      retries: retries
    });
  }
}

// these are the names that we want to use for these fields in the SDK
export function mapParams(params: JavaScriptValue): Params[] {
  if (!Array.isArray(params)) {
    throw new Error('expected params to be an array');
  }
  const mappedParams: Params[] = [];
  for (const p of params) {
    mappedParams.push({ configuration: p.configuration, integrationType: p.integration, stepName: p.name } as Params);
  }
  return mappedParams;
}
