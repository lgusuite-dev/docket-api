exports.callback = async (cb, ...cbArgs) => await cb.bind(this, ...cbArgs)();
