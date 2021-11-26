exports.callbackAsync = async (cb, ...cbArgs) =>
  await cb.bind(this, ...cbArgs)();

exports.callbackSync = (cb, ...cbArgs) => cb.bind(this, ...cbArgs)();
