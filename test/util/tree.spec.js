const expect = require('chai').expect;
const objectScan = require("object-scan");
const tree = require("../../src/util/tree");

describe("Testing tree.js", () => {
  describe("Testing tree.build()", () => {
    const result = tree.build([["a", 1, "b", 2], ["a", 1, "c", 0], ["a", 1]]);
    expect(result).to.deep.equal({ a: { 1: { b: { 2: {} }, c: { 0: {} } } } });
    expect(tree.isLeaf(result)).to.equal(false);
    expect(tree.isLeaf(result.a)).to.equal(false);
    expect(tree.isLeaf(result.a["1"])).to.equal(true);
    expect(tree.isLeaf(result.a["1"].b)).to.equal(false);
    expect(tree.isLeaf(result.a["1"].b["2"])).to.equal(true);
    expect(tree.isLeaf(result.a["1"].c)).to.equal(false);
    expect(tree.isLeaf(result.a["1"].c["0"])).to.equal(true);
  });

  describe("Testing tree.prune()", () => {
    it("Testing object excluded", () => {
      const excluded = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
      const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { c: {} } } } };
      tree.prune(data, excluded, objectScan(["**"], { joined: false })(data));
      expect(data).to.deep.equal({ 1: { a: { 2: { c: {} }, 1: { c: {} } } } });
    });

    it("Testing object retained", () => {
      const retained = [[1, "a", 2, "b"], [1, "a", 1, "b"]];
      const data = { 1: { a: { 2: { b: {}, c: {} }, 1: { b: {}, c: {} } } } };
      tree.prune(data, [], retained);
      expect(data).to.deep.equal({ 1: { a: { 2: { b: {} }, 1: { b: {} } } } });
    });

    it("Testing array excluded", () => {
      const excluded = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
      const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
      tree.prune(data, excluded, objectScan(["**"], { joined: false })(data));
      expect(data).to.deep.equal([{ a: [{ c: {} }, { c: {} }] }]);
    });

    it("Testing array retained", () => {
      const retained = [[0, "a", 1, "b"], [0, "a", 0, "b"]];
      const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
      tree.prune(data, [], retained);
      expect(data).to.deep.equal([{ a: [{ b: {} }, {}] }]);
    });

    it("Testing object parent excluded", () => {
      const excluded = [[0, "a"]];
      const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
      tree.prune(data, excluded, objectScan(["**"], { joined: false })(data));
      expect(data).to.deep.equal([{}]);
    });

    it("Testing object parent retained", () => {
      const retained = [[0, "a"]];
      const data = [{ a: [{ b: {}, c: {} }, { c: {} }] }];
      tree.prune(data, [], retained);
      expect(data).to.deep.equal([{ a: [] }]);
    });
  });
});
