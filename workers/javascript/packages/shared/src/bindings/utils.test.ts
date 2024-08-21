import { getDynamicStringSegments } from './utils';

describe.each([
  ['{{A}}', ['{{A}}']],
  ['{{A}}  ', ['{{A}}', '  ']],
  ['  {{A}}  ', ['  ', '{{A}}', '  ']],
  ['A {{B}}', ['A ', '{{B}}']],
  [
    'Hello {{ Customer.Name }}, the status for your order id {{orderId}} is {{status}}',
    ['Hello ', '{{ Customer.Name }}', ', the status for your order id ', '{{orderId}}', ' is ', '{{status}}']
  ],
  ['{{data.map(datum => {return {id: datum}})}}', ['{{data.map(datum => {return {id: datum}})}}']],
  ['{{{ complex: { object: { keys: true}} }}}', ['{{{ complex: { object: { keys: true}} }}}']],
  ['{{{ complex: { object: { keys: true}}}}}', ['{{{ complex: { object: { keys: true}}}}}']],
  ['{{{ a: 1 }}} {{{b: 2}}}', ['{{{ a: 1 }}}', ' ', '{{{b: 2}}}']],
  ['{{}}{{}}}', ['{{}}', '{{}}', '}']],
  ['{{{}}', ['{{{}}']],
  ['{{ {{', ['{{ {{']],
  ['}} }}', ['}} }}']],
  ['}} {{', ['}} ', '{{']],
  [`opening {{"{"}} another`, ['opening ', `{{"{"}} another`]],
  [" extra spaces outside {{ ' but not between bindings ' }} ", [' extra spaces outside ', "{{ ' but not between bindings ' }}", ' ']],
  [
    `
newlines outside {{
  "and inside"
}} `,
    [
      `
newlines outside `,
      `{{
  "and inside"
}}`,
      ' '
    ]
  ],
  [
    `{{
  data.map(datum => { return {id: datum}})
}}`,
    [
      `{{
  data.map(datum => { return {id: datum}})
}}`
    ]
  ],
  [
    // notice mismatched brackets
    `select * where password = {{const foo = { key: "var" }}; return foo}`,
    ['select * where password = ', `{{const foo = { key: "var" }}; return foo}`]
  ],
  [
    // notice closing brackets inside the string
    // TODO: this should be ["select * where password = ", `{{"}}" + "foo" }}]`
    `select * where password = {{"}}" + "foo" }}`,
    ['select * where password = ', `{{"}}`, `" + "foo" }}`]
  ],
  [`select * where password = {{"}" + "foo" }}`, ['select * where password = ', `{{"}" + "foo" }}`]]
])('Parse the dynamic string(%s, %j)', (dynamicString, expected) => {
  test(`returns ${expected}`, () => {
    expect(getDynamicStringSegments(dynamicString as string)).toStrictEqual(expected);
  });
});
