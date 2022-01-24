export default (keys) => {
  const lookups = keys.reduce((p, c, idx) => {
    const index = Math.max(0, c.lastIndexOf('.'));
    const k = c.slice(0, index);
    if (!(k in p)) {
      // eslint-disable-next-line no-param-reassign
      p[k] = {};
    }
    // eslint-disable-next-line no-param-reassign
    p[k][c.slice(index)] = idx;
    return p;
  }, {});
  return ({ key }) => {
    const k = key.filter((e) => typeof e === 'string').join('.');
    if (!(k in lookups)) {
      return undefined;
    }
    const lookup = lookups[k];
    return (a, b) => lookup[b] - lookup[a];
  };
};
