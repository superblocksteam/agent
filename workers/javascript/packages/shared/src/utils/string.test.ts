import { camelCaseToDisplay, getNextEntityName, validateEmail } from './string';

describe('camel case to display', () => {
  test('can convert camel case to display', () => {
    expect(camelCaseToDisplay('testCamelCase')).toBe('Test Camel Case');
  });
});

describe('validate email', () => {
  test('can validate email', () => {
    expect(validateEmail('somebody@domain.com')).toBe(true);
    expect(validateEmail('somebody+test@domain.com')).toBe(true);
    expect(validateEmail('some-body_123@domain.com')).toBe(true);
    expect(validateEmail('somebody@domain.another.com')).toBe(true);
    expect(validateEmail('somebody@place@domain.com')).toBe(false);
    expect(validateEmail('some<>body@domain.com')).toBe(false);
  });
});

describe('getNextEntityName', () => {
  test('get next name with underscore', async () => {
    expect(getNextEntityName('Tabs_', ['Tabs_1', 'Tabs_2', 'Tabs_3'])).toEqual('Tabs_4');
    expect(getNextEntityName('Tabs_', ['Tabs_1', 'Tabs_2', 'Tabs_5'])).toEqual('Tabs_6');
    expect(getNextEntityName('Tabs_', [])).toEqual('Tabs_1');
    expect(getNextEntityName('Tabs_', ['Tabs_____1', 'Tabs__2', 'Tabs___3'])).toEqual('Tabs_4');
  });

  test('get next name with space', async () => {
    expect(getNextEntityName('Tabs ', ['Tabs 1', 'Tabs 2', 'Tabs 3'], ' ')).toEqual('Tabs 4');
    expect(getNextEntityName('Tabs ', ['Tabs 1', 'Tabs 2', 'Tabs 5'], ' ')).toEqual('Tabs 6');
    expect(getNextEntityName('Tabs ', [], ' ')).toEqual('Tabs 1');
    expect(getNextEntityName('Tabs ', ['Tabs     1', 'Tabs  2', 'Tabs   3'], ' ')).toEqual('Tabs 4');
    expect(getNextEntityName('Tabs ', ['Tabs 1', 'Tabs 2      ', 'Tabs 3  '], ' ')).toEqual('Tabs 4');
  });
});
