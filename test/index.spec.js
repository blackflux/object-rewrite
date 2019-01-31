const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const index = require('../src/index');

describe('Testing Rewrite', () => {
  it('Testing Simple Filter', () => {
    const input = { test: 123 };
    index({ filter: { test: () => false } })(input);
    expect(input).to.deep.equal({});
  });

  describe('Testing Retain Empty List', () => {
    const execTest = (retain, retainEmptyParents) => {
      const input = { test: [] };
      index({ retain, retainEmptyParents })(input);
      return input;
    };

    it('Testing Retain Empty List (Exact Match), retainEmptyParents = true', () => {
      expect(execTest(['test'], true)).to.deep.equal({ test: [] });
    });

    it('Testing Retain Empty List (Exact Match), retainEmptyParents = false', () => {
      expect(execTest(['test'], false)).to.deep.equal({ test: [] });
    });

    it('Testing Retain Empty List (Child Match), retainEmptyParents = true', () => {
      expect(execTest(['test.id'], true)).to.deep.equal({ test: [] });
    });

    it('Testing Retain Empty List (Child Match), retainEmptyParents = false', () => {
      expect(execTest(['test.id'], false)).to.deep.equal({});
    });

    it('Testing Retain Empty List (No Match), retainEmptyParents = true', () => {
      expect(execTest(['unknown'], true)).to.deep.equal({});
    });

    it('Testing Retain Empty List (No Match), retainEmptyParents = false', () => {
      expect(execTest(['unknown'], false)).to.deep.equal({});
    });
  });

  describe('Testing Nothing Retained, but overwrite matching', () => {
    const execTest = (retain, retainEmptyParents) => {
      const input = { test: [{ id: 1 }] };
      index({ retain, overwrite: { 'test.id': () => 3 }, retainEmptyParents })(input);
      return input;
    };

    it('Testing Retain List (No Match) with overwrite, retainEmptyParents = true', () => {
      expect(execTest(['unknown'], true)).to.deep.equal({});
    });

    it('Testing Retain List (No Match) with overwrite, retainEmptyParents = false', () => {
      expect(execTest(['unknown'], false)).to.deep.equal({});
    });
  });

  it('Testing Array Filter', () => {
    const input = { test: [{ test: '' }] };
    index({ filter: { test: () => false } })(input);
    expect(input).to.deep.equal({ test: [] });
  });

  it('Testing Nested Array Filter Object', () => {
    const input = { test: [[{ test: '' }]] };
    index({ filter: { test: () => false } })(input);
    expect(input).to.deep.equal({ test: [[]] });
  });

  it('Testing Nested Array Filter Object Content', () => {
    const input = { test: [[{ test: '' }]] };
    index({ filter: { 'test.test': () => false } })(input);
    expect(input).to.deep.equal({ test: [[{}]] });
  });

  it('Testing Partial Filter', () => {
    const input = { test: [{ test: 'a' }, { test: 'b' }] };
    index({ filter: { test: (key, value) => value.test !== 'a' } })(input);
    expect(input).to.deep.equal({ test: [{ test: 'b' }] });
  });

  it('Test Inject', () => {
    const input = { test: {} };
    index({ inject: { test: () => ({ key: 'value' }) } })(input);
    expect(input).to.deep.equal({ test: { key: 'value' } });
  });

  describe('Test Overwrite', () => {
    it('Test Object Overwrite', () => {
      const input = { test: [{ key: 'before' }] };
      index({ overwrite: { 'test.key': () => 'after' } })(input);
      expect(input).to.deep.equal({ test: [{ key: 'after' }] });
    });

    it('Test Array Overwrite', () => {
      const input = { test: [{ key: 'before' }] };
      index({ overwrite: { test: () => 'after' } })(input);
      expect(input).to.deep.equal({ test: ['after'] });
    });
  });

  it('Test Complex Use Case', () => {
    const purchases = [{
      id: 1,
      client: {
        version: '1.2.3'
      },
      tags: ['toy', 'lego'],
      timestamp: '2017-04-03T10:00:00+04:00'
    }, {
      id: 2,
      client: {
        version: '1.2.4'
      },
      tags: ['phone', 'electronics'],
      timestamp: '2015-06-10T10:00:00+04:00'
    }];
    const rewriter = index({
      filter: {
        '': (key, value) => value.client.version !== '1.2.3'
      },
      inject: {
        '': (key, value) => ({
          age: `${new Date('2018-01-10T10:00:00+04:00') - new Date(value.timestamp)} ms`
        })
      },
      retain: ['id', 'client.version', 'tags', 'age']
    });
    rewriter(purchases);
    expect(purchases).to.deep.equal([{
      id: 2,
      client: { version: '1.2.4' },
      tags: ['phone', 'electronics'],
      age: '81648000000 ms'
    }]);
  });

  it('Testing User Rewrite', () => {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'users-sample.json')));
    const rewriter = index({
      filter: {
        '': (key, value) => value.isActive === true,
        friends: (key, value, parents) => parents[parents.length - 1].age <= 25
      },
      inject: {
        '': (key, value) => ({
          // eslint-disable-next-line no-underscore-dangle
          id: value._id,
          accountAge: `${Math
            .ceil((new Date('2018-01-10T10:00:00+04:00') - new Date(value.registered)) / (1000 * 60 * 60 * 24))} days`
        })
      },
      retain: ['id', 'accountAge', 'friends.id', 'age']
    });
    rewriter(users);
    expect(users).to.deep.equal([
      {
        age: 26,
        friends: [],
        id: '5bb8088b9934a34e92095fc0',
        accountAge: '3699 days'
      },
      {
        age: 24,
        friends: [
          { id: 0 },
          { id: 1 },
          { id: 2 }
        ],
        id: '5bb8088bd415a8d887a44ca7',
        accountAge: '2357 days'
      }
    ]);
  });

  it('Testing Readme Example', () => {
    const data = [{
      guid: 'aad8b948-a3de-4bff-a50f-3d59e9510aa9',
      count: 3,
      active: 'yes',
      tags: [{ id: 1 }, { id: 2 }, { id: 3 }]
    }, {
      guid: '4409fb72-36e3-4385-b3da-b4944d028dcb',
      count: 4,
      active: 'yes',
      tags: [{ id: 2 }, { id: 3 }, { id: 4 }]
    }, {
      guid: '96067a3c-caa2-4018-bcec-6969a874dad9',
      count: 5,
      active: 'no',
      tags: [{ id: 3 }, { id: 4 }, { id: 5 }]
    }];
    const rewriter = index({
      filter: {
        '': (key, value, parents) => value.active === 'yes',
        tags: (key, value, parents) => value.id === 4
      },
      inject: {
        '': (key, value, parents) => ({ countNext: value.count + 1 })
      },
      overwrite: {
        active: (key, value) => value === 'yes'
      },
      retain: ['count', 'countNext', 'active', 'tags.id']
    });
    rewriter(data);
    expect(data).to.deep.equal([{
      count: 3,
      countNext: 4,
      active: true,
      tags: []
    }, {
      count: 4,
      countNext: 5,
      active: true,
      tags: [{ id: 4 }]
    }]);
  });
});
