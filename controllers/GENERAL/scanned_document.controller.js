const ScannedDocument = require('../../models/GENERAL/scanned_document.model');
const Document = require('../../models/GENERAL/document.model');

const catchAsync = require('../../utils/errors/catchAsync');
const QueryFeatures = require('../../utils/query/queryFeatures');

exports.searchDocument = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const extractWords = search ? search.split(' ') : [];

  const searchedDocuments = await ScannedDocument.find(
    {
      $text: { $search: `${search}` },
      confidentialityLevel: { $lte: req.user.access_level },
      _tenantId: req.user._tenantId,
    },
    { score: { $meta: 'textScore' } },
    { lean: true }
  )
    .sort({ score: { $meta: 'textScore' } })
    .populate({
      path: '_documentId',
      populate: {
        path: '_files',
      },
    });

  for (let document of searchedDocuments) {
    const origText = document.text;

    for (let word of extractWords) {
      const regex = new RegExp(word, 'ig');

      document.text = document.text.replace(regex, `<strong>${word}</strong>`);
    }

    const splitDocText = document.text.split(' ');
    let prev = [];

    for (let [index, text] of splitDocText.entries()) {
      const substr = [];
      const nextValue = splitDocText[index + 1]
        ? splitDocText[index + 1]
        : splitDocText[index];

      if (
        text.includes('<strong>') &&
        !nextValue.includes('<strong>') &&
        index !== splitDocText - 1
      ) {
        const start = index - 6;
        const end = index + 6;
        if (start <= 0) {
          for (let i = index; i >= 0; i--) {
            substr.unshift(splitDocText[i]);
          }
        } else {
          for (let i = index; i >= start; i--) {
            substr.unshift(
              i === start ? '...' + splitDocText[i] : splitDocText[i]
            );
          }
        }

        if (end >= splitDocText.length - 1) {
          for (let i = index + 1; i <= splitDocText.length - 1; i++) {
            substr.push(i === end ? splitDocText[i] + '...' : splitDocText[i]);
          }
        } else {
          for (let i = index + 1; i <= end; i++) {
            substr.push(i === end ? splitDocText[i] + '...' : splitDocText[i]);
          }
        }
      }

      if (substr.length) prev.push(substr.join(' '));
    }

    console.log('PREV', prev.join(' '));

    // console.log(splitDocText);

    document.preview = prev.length
      ? `Page ${document.page} - ${prev.join(' ')}`
      : 'No preview available!';
    // document.preview = `Page ${document.page} - ${document.text}`;
    document.text = origText;
  }

  // // get unique document ids
  // const documentIds = searchedDocuments.map((document) =>
  //   document._documentId.toString()
  // );

  // const queryFeature = new QueryFeatures(
  //   Document.find({ _id: { $in: documentIds } }).populate('_files'),
  //   req.query
  // )
  //   .limitFields()
  //   .populate()
  //   .sort()
  //   .paginate();

  // const documents = await queryFeature.query;

  // console.log(documentIds);

  res.status(200).json({
    status: 'success',
    results: searchedDocuments.length,
    env: {
      documents: searchedDocuments,
    },
  });
});
