const expect = require('chai').expect;
const index = require("../src/index");

describe("Testing Rewrite", () => {
  it("Testing Simple Exclude", () => {
    const input = { test: 123 };
    index({ exclude: { test: () => true } }).rewrite(input);
    expect(input).to.deep.equal({});
  });

  it("Testing Array Exclude", () => {
    const input = { test: [{ test: "" }] };
    index({ exclude: { test: () => true } }).rewrite(input);
    expect(input).to.deep.equal({ test: [] });
  });

  it("Testing Nested Array Exclude Object", () => {
    const input = { test: [[{ test: "" }]] };
    index({ exclude: { test: () => true } }).rewrite(input);
    expect(input).to.deep.equal({ test: [[]] });
  });

  it("Testing Nested Array Exclude Object Content", () => {
    const input = { test: [[{ test: "" }]] };
    index({ exclude: { "test.test": () => true } }).rewrite(input);
    expect(input).to.deep.equal({ test: [[{}]] });
  });

  it("Testing Partial Exclude", () => {
    const input = { test: [{ test: "a" }, { test: "b" }] };
    index({ exclude: { test: (key, value) => value.test === "a" } }).rewrite(input);
    expect(input).to.deep.equal({ test: [{ test: "b" }] });
  });
});
