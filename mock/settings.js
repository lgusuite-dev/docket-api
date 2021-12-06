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
        then: 'C',
      },
      {
        if: '/data/ === "Complaint"',
        then: 'CM',
      },
      {
        if: '/data/ === "Criminal"',
        then: 'CR',
      },
      {
        if: '/data/ === "EPWMD"',
        then: 'E',
      },
      {
        if: '/data/ === "HR"',
        then: 'H',
      },
      {
        if: '/data/ === "LLRB"',
        then: 'LL',
      },
      {
        if: '/data/ === "LRC"',
        then: 'LR',
      },
      {
        if: '/data/ === "Opinion"',
        then: 'O',
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
