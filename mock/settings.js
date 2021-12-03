// R-100-1121-100-A

exports.ALGORITHM = {
  separator: '-',
  path: 'controlNumber',
  fieldBased: {
    default: 'QCLD',
    separate: true,
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
    default: 100,
    increment: 1,
    padding: '3, "0"',
    separate: true,
    queries: {
      type: {
        collection: 'Document',
        find: '{type: data}',
        sort: '-_createdBy',
      },
    },
  },
  month: {
    separate: false,
  },
  year: {
    format: 'YY',
    separate: true,
  },
};
