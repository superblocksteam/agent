import { EnvEnum, RegionEnum } from '../types';
import { EventSender, Logger } from './event';

const mockLogger: Logger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
};

afterEach(() => {
  jest.clearAllMocks();
  EventSender.clearFlushSchedule();
});

jest.mock('@rockset/client');
// https://jestjs.io/docs/mock-functions#mocking-modules
// A require is needed here in order to access the default export to override it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rockset = require('@rockset/client');
const mockRocksetInstance = {
  documents: {
    addDocuments: jest.fn()
  }
};
rockset.default.mockReturnValue(mockRocksetInstance);

describe('event sender', () => {
  test('can only configure known environments', () => {
    expect(() => {
      EventSender.configure('api-key', 'foo' as EnvEnum, RegionEnum.US, 'test', mockLogger);
    }).toThrowError();
  });

  test('can only configure known region', () => {
    expect(() => {
      EventSender.configure('api-key', EnvEnum.DEV, 'bad region' as RegionEnum, 'test', mockLogger);
    }).toThrowError();
  });

  test('only logs at dev environments', async () => {
    // config the event sender to flush right after each send
    EventSender.configure('api-key', EnvEnum.DEV, RegionEnum.US, 'test', mockLogger, 100, 1);

    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(mockLogger.debug).toBeCalled();
    expect(mockRocksetInstance.documents.addDocuments).not.toBeCalled();
  });

  test('add rockset documents at prod environments', async () => {
    // config the event sender to flush right after each send
    EventSender.configure('api-key', EnvEnum.PROD, RegionEnum.US, 'test', mockLogger, 100, 1);
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    await new Promise((r) => setTimeout(r, 200));
    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(2);
  });

  test('flushing after timeout', async () => {
    // config the event sender to flush after 100ms timeout
    EventSender.configure('api-key', EnvEnum.PROD, RegionEnum.US, 'test', mockLogger, 100, 50);
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    await new Promise((r) => setTimeout(r, 300));
    expect(mockLogger.error).not.toBeCalled();
    // all 3 events are sent within one batch
    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(1);
  });

  test('flushing at max length', async () => {
    // config the event sender to flush when batch size = 2
    EventSender.configure('api-key', EnvEnum.PROD, RegionEnum.US, 'test', mockLogger, 2000, 2);
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });
    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(1);
  });

  test('flushing at max size', async () => {
    // config the event sender to flush when batch size in kb is > 1kb
    EventSender.configure('api-key', EnvEnum.PROD, RegionEnum.US, 'test', mockLogger, 2000, 100, 1);
    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });

    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(0);
    const payload: string[] = [];
    for (let i = 0; i < 1000; i++) {
      payload.push('a');
    }
    void EventSender.send({
      type: 'test',
      createdAt: new Date(),
      properties: {
        payload
      }
    });
    await new Promise((r) => setTimeout(r, 300));
    // first event is sent in it's own batch
    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(2);
  });

  test('retry', async () => {
    EventSender.configure('api-key', EnvEnum.PROD, RegionEnum.US, 'test', mockLogger, 100, 1, 10, 3, 1);

    // mock the first rockset call failed
    mockRocksetInstance.documents.addDocuments = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });

    void EventSender.send({
      type: 'test',
      createdAt: new Date()
    });

    // wait for retry
    await new Promise((r) => setTimeout(r, 5));

    // this is called by first failure
    expect(mockLogger.error).toBeCalled();
    expect(mockRocksetInstance.documents.addDocuments).toBeCalledTimes(2);
  });
});
