const expect = require('chai').expect;
const objectScan = require("object-scan");
const tree = require("../../src/util/tree");

describe("Testing tree.js", () => {
  it("Testing object excluded", () => {
    const excluded = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
    const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { c: {} } } } };
    tree.prune(data, objectScan(["**"], { joined: false })(data), excluded);
    expect(data).to.deep.equal({ 1: { a: { 2: { c: {} }, 1: { c: {} } } } });
  });

  it("Testing object included", () => {
    const included = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
    const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { b: {}, c: {} } } } };
    tree.prune(data, included, []);
    expect(data).to.deep.equal({ 1: { a: { 2: { b: {} }, 1: { b: {} } } } });
  });

  it("Testing array excluded", () => {
    const excluded = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, objectScan(["**"], { joined: false })(data), excluded);
    expect(data).to.deep.equal([{ a: [{ c: {} }, { c: {} }] }]);
  });

  it("Testing array included", () => {
    const included = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, included, []);
    expect(data).to.deep.equal([{ a: [{ b: {} }, {}] }]);
  });

  it("Testing object parent excluded", () => {
    const excluded = [[0, "a"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, objectScan(["**"], { joined: false })(data), excluded);
    expect(data).to.deep.equal([{}]);
  });

  it("Testing object parent included", () => {
    const included = [[0, "a"]];
    const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
    tree.prune(data, included, []);
    expect(data).to.deep.equal([{ a: [] }]);
  });
});
