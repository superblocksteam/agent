import { InvalidConfigurationError } from '../errors/configuration-error';

export type Env = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  regex?: string;
};

export class EnvStore {
  private vars: Record<string, Env>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private values: Record<string, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(values: Record<string, any>) {
    this.vars = {};
    this.values = values;
  }

  add(env: Env): void {
    const name = env.name;
    const value = this.values[name];
    if (env.defaultValue === undefined && value == null) {
      throw new InvalidConfigurationError(`Env variable ${name} is missing`);
    }
    // TODO validate env var with regex
    this.vars[name] = env;
  }

  addAll(envs: Env[]): void {
    for (const env of envs) {
      this.add(env);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): any {
    const env = this.vars[name];
    if (env === undefined) {
      throw new InvalidConfigurationError(`Env variable ${name} is missing, use addEnv to add it first`);
    }
    if (env.regex) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchedKeys: Record<string, any> = {};
      Object.entries(this.values).forEach(([key, value]) => {
        if (key.match(env.regex ?? '')) {
          matchedKeys[key] = value;
        }
      });
      return matchedKeys;
    }
    const value = this.values[name];
    if (value == null) {
      return env.defaultValue;
    }
    return value;
  }
}
