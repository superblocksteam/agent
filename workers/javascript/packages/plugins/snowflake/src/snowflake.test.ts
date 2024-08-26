import { Snowflake } from './Snowflake';
describe('snowflake lib', () => {
  it('constructor', async () => {
    new Snowflake({ account: 'account', username: 'username', password: 'password' });
  });
});
