exports.callback = async (cb, ...params) => await cb.bind(this, ...params)();
