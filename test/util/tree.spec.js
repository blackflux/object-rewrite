const expect = require('chai').expect;
const tree = require("../../src/util/tree");

describe("Testing tree.js", () => {
  it("Testing object prune needles", () => {
    const needles = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
    const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { c: {} } } } };
    tree.prune(data, needles, true);
    expect(data).to.deep.equal({ 1: { a: { 2: { c: {} }, 1: { c: {} } } } });
  });

  it("Testing object prune except needles", () => {
    const needles = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
    const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { b: {}, c: {} } } } };
    tree.prune(data, needles, false);
    expect(data).to.deep.equal({ 1: { a: { 2: { b: {} }, 1: { b: {} } } } });
  });

  it("Testing array prune needles", () => {
    const needles = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, needles, true);
    expect(data).to.deep.equal([{ a: [{ c: {} }, { c: {} }] }]);
  });

  it("Testing array prune except needles", () => {
    const needles = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, needles, false);
    expect(data).to.deep.equal([{ a: [{ b: {} }, {}] }]);
  });

  it("Testing object parent needles", () => {
    const needles = [[0, "a"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, needles, true);
    expect(data).to.deep.equal([{}]);
  });

  it("Testing object parent except needles", () => {
    const needles = [[0, "a"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, needles, false);
    expect(data).to.deep.equal([{ a: [] }]);
  });
});
