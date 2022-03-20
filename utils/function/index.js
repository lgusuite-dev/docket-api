exports.callbackAsync = async (cb, ...cbArgs) =>
  await cb.bind(this, ...cbArgs)();

exports.callbackSync = (cb, ...cbArgs) => cb.bind(this, ...cbArgs)();

exports.evaluateString = (logic, obj) => {
  let tempLogic = logic;
  const regexp = /\/(.*?)\//g;
  const paths = logic.match(regexp);

  if (!paths) return false;
  for (const path of paths) {
    const objPath = path.split('/')[1];
    tempLogic = tempLogic.replace(path, obj[objPath]);
  }

  console.log(tempLogic);

  try {
    return eval(tempLogic);
  } catch {
    return false;
  }
};
