const fs = require('fs');
const path = require('path');
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
        "": (key, value) => value.client.version === "1.2.3"
      },
      inject: {
        "": (key, value) => ({
          age: `${new Date("2018-01-10T10:00:00+04:00") - new Date(value.timestamp)} ms`
        })
      },
      include: ["id", "client.version", "tags", "age"]
    });
    rewriter(purchases);
    expect(purchases).to.deep.equal([{
      id: 2,
      client: { version: "1.2.4" },
      tags: ["phone", "electronics"],
      age: "81648000000 ms"
    }]);
  });

  it("Testing User Rewrite", () => {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "resources", "users-sample.json")));
    const rewriter = index({
      exclude: {
        "": (key, value) => value.isActive !== true,
        friends: (key, value, parents) => parents[parents.length - 1].age > 25
      },
      inject: {
        "": (key, value) => ({
          // eslint-disable-next-line no-underscore-dangle
          id: value._id,
          accountAge: `${Math
            .ceil((new Date("2018-01-10T10:00:00+04:00") - new Date(value.registered)) / (1000 * 60 * 60 * 24))} days`
        })
      },
      include: ["id", "accountAge", "friends.id", "age"]
    });
    rewriter(users);
    expect(users).to.deep.equal([
      {
        age: 26,
        friends: [],
        id: "5bb8088b9934a34e92095fc0",
        accountAge: "3699 days"
      },
      {
        age: 24,
        friends: [
          { id: 0 },
          { id: 1 },
          { id: 2 }
        ],
        id: "5bb8088bd415a8d887a44ca7",
        accountAge: "2357 days"
      }
    ]);
  });
});
