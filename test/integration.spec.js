const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const objectRewrite = require('../src/index');

const getEntries = source => fs.readdirSync(source)
  .map(name => [name, path.join(source, name)]);
const getDirectories = source => getEntries(source)
  .filter(([f, p]) => fs.lstatSync(p).isDirectory());

describe('Integration Testing', () => {
  getDirectories(path.join(__dirname, 'integration'))
    .forEach(([dirName, dirPath]) => {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      const input = require(path.join(dirPath, 'input'));
      // eslint-disable-next-line import/no-dynamic-require,global-require
      const retain = require(path.join(dirPath, 'retain'));
      // eslint-disable-next-line import/no-dynamic-require,global-require
      const result = require(path.join(dirPath, 'result'));
      const rewriter = objectRewrite({ retain });
      it(`Testing ${dirName}`, () => {
        rewriter(input);
        expect(input).to.deep.equal(result);
      });
    });
});
