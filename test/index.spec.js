const expect = require('chai').expect;
const index = require("../src/index");

describe("Testing Rewrite", () => {
  it("Testing Simple Exclude", () => {
    const input = { test: 123 };
    index({ exclude: { test: () => true } })(input);
    expect(input).to.deep.equal({});
  });

  it("Testing Array Exclude", () => {
    const input = { test: [{ test: "" }] };
    index({ exclude: { test: () => true } })(input);
    expect(input).to.deep.equal({ test: [] });
  });

  it("Testing Nested Array Exclude Object", () => {
    const input = { test: [[{ test: "" }]] };
    index({ exclude: { test: () => true } })(input);
    expect(input).to.deep.equal({ test: [[]] });
  });

  it("Testing Nested Array Exclude Object Content", () => {
    const input = { test: [[{ test: "" }]] };
    index({ exclude: { "test.test": () => true } })(input);
    expect(input).to.deep.equal({ test: [[{}]] });
  });

  it("Testing Partial Exclude", () => {
    const input = { test: [{ test: "a" }, { test: "b" }] };
    index({ exclude: { test: (key, value) => value.test === "a" } })(input);
    expect(input).to.deep.equal({ test: [{ test: "b" }] });
  });

  it("Test Update", () => {
    const input = { test: {} };
    index({ inject: { test: () => ({ key: "value" }) } })(input);
    expect(input).to.deep.equal({ test: { key: "value" } });
  });

  it("Test Complex Use Case", () => {
    const purchases = [{
      id: 1,
      client: {
        version: "1.2.3"
      },
      tags: ["toy", "lego"],
      timestamp: "2017-04-03T10:00:00+04:00"
    }, {
      id: 2,
      client: {
        version: "1.2.4"
      },
      tags: ["phone", "electronics"],
      timestamp: "2015-06-10T10:00:00+04:00"
    }];
    const rewriter = index({
      exclude: {
        purchases: (key, value, parents) => value.client.version === "1.2.3"
      },
      inject: {
        purchases: (key, value, parents) => ({
          age: `${new Date("2018-01-10T10:00:00+04:00") - new Date(value.timestamp)} ms`
        })
      },
      include: ["purchases.id", "purchases.client.version", "purchases.tags", "purchases.age"]
    });
    rewriter({ purchases });
    expect(purchases).to.deep.equal([{
      id: 2,
      client: { version: "1.2.4" },
      tags: ["phone", "electronics"],
      age: "81648000000 ms"
    }]);
  });
});
