// PARAMS NEEDED [{Model, query, data}]
exports.updateSideEffects = async (updateObjectArgs) => {
  try {
    for (let { Model, query, data } of updateObjectArgs)
      await Model.updateMany(query, data);
  } catch (error) {
    console.error(error.message);
  }
};

// PARAMS NEEDED [{ model, query, _refField, callback?, callbackArgs? }]
exports.referenceIdCleanup = async (ModelAndProps, docId) => {
  for (let MP of ModelAndProps) {
    const documents = await MP.model.find(MP.query);

    if (documents.length) {
      for (let document of documents) {
        const _arrRefField = [...document[MP._refField]];

        if (Array.isArray(_arrRefField) && _arrRefField.length) {
          document[MP._refField] = _arrRefField.filter(
            (id) => id.toString() !== docId.toString()
          );

          await document.save();
        }
      }
    }

    if (MP.callback) await callbackAsync(MP.callback, ...MP.callbackArgs);
  }
};
