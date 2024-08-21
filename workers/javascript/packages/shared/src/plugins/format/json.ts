import { EJSON } from 'bson';
import JSON5 from 'json5';
import P from 'pino';

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function safeJSONParse(json: string, logger?: P.Logger): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedJSON: any = json;
  try {
    parsedJSON = JSON5.parse(json);
  } catch (e) {
    if (logger) {
      logger.debug(`Could not parse JSON, returning original input: ${json}`);
    }
  }
  return parsedJSON;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function safeEJSONParse(json: string, logger: P.Logger): Record<string, any> | string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedEJSON: any = json;
  try {
    // EJSON doesn't support JSON5 so we have to JSON5 -> JSON -> EJSON -> Object
    const parsedJSONString = JSON.stringify(safeJSONParse(json, logger));
    parsedEJSON = EJSON.parse(parsedJSONString);
  } catch (e) {
    logger.debug(`Could not parse EJSON, returning original input: ${json}`);
  }
  return parsedEJSON;
}
