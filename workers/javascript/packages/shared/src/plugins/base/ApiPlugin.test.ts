import { doesResponseImplementServerSideEvents } from './ApiPlugin';

describe('doesResponseImplementServerSideEvents', () => {
  it.each([
    ['text/event-stream', true],
    ['text/event-stream; charset=utf-8', true],
    ['text/event-stream;charset=utf-8', true],
    ['text/event-stream; charset=utf-8', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['foo , text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-frank; charset=utf-8; foo=bar', false],
    ['charset=utf-8; foo=bar', false],
    ['', false]
  ])('works as expected', (contentType, expected) => {
    expect(doesResponseImplementServerSideEvents(contentType)).toBe(expected);
  });
});
