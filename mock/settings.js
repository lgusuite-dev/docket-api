// R-100-1121-100-A

exports.ALGORITHM = {
  fieldBased: {
    separator: '-',
    default: 'QCLD',
    logics: [
      {
        if: '/data/ == "Incoming"',
        then: 'R',
      },
      {
        if: '/data/ !== "Admin"',
        then: 'A',
      },
    ],
  },
  sequence: {
    path: 'type',
    separator: '-',
    increment: 1,
    query: {
      collection: 'Document',
      find: '{type: type}',
    },
  },
  month: {},
  year: {
    format: 'YY',
    separator: '-',
  },
};
