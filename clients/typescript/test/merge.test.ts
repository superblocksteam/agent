import {merge} from "../src/utils/merge";

describe('merge', () => {
  it('merge two', () => {
    const target = {"profile": "staging", "commit": "14141414"};
    const source = {"profile": "production", "viewMode": "deployed"};
    const merged = merge(target, source);
    expect(merged).toEqual({"profile": "production", commit: "14141414", "viewMode": "deployed"})
  })

  it('merge to empty', () => {
    const target = {};
    const source = {"profile": "production"};
    const merged = merge(target, source);
    expect(merged).toEqual({"profile": "production"})
  })

  it('merge two empty', () => {
    const target = {};
    const source = {};
    const merged = merge(target, source);
    expect(merged).toEqual({})
  })
})