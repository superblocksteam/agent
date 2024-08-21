import { isReadableFileConstructor } from './file';

describe('is readable file constructor', () => {
  test('with string conetent', async () => {
    expect(
      isReadableFileConstructor({
        name: 'test_file_name.csv',
        contents: '1,2,3', // plain text csv content
        type: 'text/csv'
      })
    ).toBeTruthy();
  });

  test('with Buffer.toJSON() conetent', async () => {
    expect(
      isReadableFileConstructor({
        name: 'test_file_name.csv',
        contents: Buffer.from('1,2,3').toJSON(), // plain text csv content
        type: 'text/csv'
      })
    ).toBeTruthy();
  });

  test('not readable files', async () => {
    expect(
      isReadableFileConstructor({
        name: 'test_file_name.csv',
        contents: [],
        type: 'text/csv'
      })
    ).toBeFalsy();

    expect(
      isReadableFileConstructor({
        name: 'test_file_name.csv',
        contents: {},
        type: 'text/csv'
      })
    ).toBeFalsy();

    expect(
      isReadableFileConstructor({
        name: 'test_file_name.csv',
        contents: Buffer.from('1,2,3'), // plain text csv content
        type: 'text/csv'
      })
    ).toBeFalsy();
  });
});
