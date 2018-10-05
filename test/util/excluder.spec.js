const expect = require('chai').expect;
const excluder = require("./../../src/util/excluder");

describe("Testing excluder.js", () => {
  it("Testing Simple String Exclude (Fail)", () => {
    const input = { string: "string" };
    expect(() => excluder.markExcluded(input.string))
      .to.throw("Object.defineProperty called on non-object");
  });

  it("Testing Simple Integer Exclude (Fail)", () => {
    const input = { int: 123 };
    expect(() => excluder.markExcluded(input.int))
      .to.throw("Object.defineProperty called on non-object");
  });

  it("Testing Simple Object Exclude", () => {
    const input = { obj: {} };
    excluder.markExcluded(input.obj);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({});
  });

  it("Testing Simple Array Exclude", () => {
    const input = { array: [] };
    excluder.markExcluded(input.array);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({});
  });

  it("Testing Nested Object Exclude", () => {
    const input = { parent: { child: {} } };
    excluder.markExcluded(input.parent.child);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({ parent: {} });
  });

  it("Testing Nested Array Exclude", () => {
    const input = { array: [[]] };
    excluder.markExcluded(input.array[0]);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({ array: [] });
  });

  it("Testing Array in Object Exclude", () => {
    const input = { object: { array: [] } };
    excluder.markExcluded(input.object.array);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({ object: {} });
  });

  it("Testing Object in Array Exclude", () => {
    const input = { array: [{ object: {} }] };
    excluder.markExcluded(input.array[0].object);
    excluder.excludeRecursive(input);
    expect(input).to.deep.equal({ array: [{}] });
  });
});
