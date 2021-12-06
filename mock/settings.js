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
        if: '/data/ == "Outgoing"',
        then: 'O',
      },
      {
        if: '/data/ == "Internal"',
        then: 'I',
      },
      {
        if: '/data/ == "Archived"',
        then: 'A',
      },
      {
        if: '/data/ === "Admin"',
        then: 'A',
      },
      {
        if: '/data/ === "Civil"',
        then: 'B',
      },
      {
        if: '/data/ === "Complaint"',
        then: 'H',
      },
      {
        if: '/data/ === "Criminal"',
        then: 'K',
      },
      {
        if: '/data/ === "EPWMD"',
        then: 'P',
      },
      {
        if: '/data/ === "HR"',
        then: 'R',
      },
      {
        if: '/data/ === "LLRB"',
        then: 'L',
      },
      {
        if: '/data/ === "LRC"',
        then: 'C',
      },
      {
        if: '/data/ === "Opinion"',
        then: 'A',
      },
      {
        if: '/data/ === "Supplies"',
        then: 'S',
      },
    ],
  },
  sequence: {
    default: 100,
    increment: 1,
    padding: '3, "0"',
    separate: true,
    queries: {
      type: {
        collection: 'Document',
        find: '{ "type": "/data/", "dateClassified": { "$gte": "/from/", "$lte": "/to/" }, "controlNumber": { "$regex": "`^${dataRegex}.*`" } }',
        dataRegex: [
          {
            if: '/data/ == "Incoming"',
            then: 'R',
          },
          {
            if: '/data/ == "Outgoing"',
            then: 'O',
          },
          {
            if: '/data/ == "Internal"',
            then: 'I',
          },
          {
            if: '/data/ == "Archived"',
            then: 'A',
          },
        ],
        sort: '-dateClassified',
      },
      book: {
        collection: 'Book',
        find: '{ "createdAt": { "$gte": "/from/", "$lte": "/to/" }, "controlNumber": { "$regex": "^QCLD.*" } }',
        sort: '-createdAt',
      },
      box: {
        collection: 'Box',
        find: '{ "createdAt": { "$gte": "/from/", "$lte": "/to/" }, "controlNumber": { "$regex": "^QCLD.*" } }',
        sort: '-createdAt',
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
