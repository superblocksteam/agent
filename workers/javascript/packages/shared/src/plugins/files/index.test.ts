import axios from 'axios';
import { ExecutionContext } from '../../types/api';
import { getFileStream } from './index';

jest.mock('fs');
jest.mock('axios');
axios.get = jest.fn().mockImplementation(() => Promise.resolve({ data: 'mock data' }));

const fileServerUrl = 'http://localhost:8080/files';
const location = 'location_with_+_character';
const context = new ExecutionContext();
context.addGlobalVariable('$agentKey', 'fake-key');
context.addGlobalVariable('$fileServerUrl', fileServerUrl);

describe('getFileStream', () => {
  it('Test encoded query', async () => {
    context.addGlobalVariable('$flagWorker', true);
    await getFileStream(context, location);

    const encodedLocation = 'location_with_%2B_character';
    const expectedUrl = `${context.globals['$fileServerUrl']}?location=${encodedLocation}`;
    const expectedHeader = {
      headers: {
        'x-superblocks-agent-key': 'fake-key'
      },
      responseType: 'stream'
    };

    expect(axios.get).toHaveBeenCalledWith(expectedUrl, expectedHeader);
  });
});
