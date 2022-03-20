// R-100-1121-100-A
// R-005-0222-100-A

exports.CLASSIFICATION_LOGIC = [
  {
    if: '"/type/" === "Incoming"',
    then: 'R',
  },
  {
    if: '"/type/" === "Outgoing"',
    then: 'O',
  },
  {
    if: '"/type/" === "Internal"',
    then: 'I',
  },
  {
    if: '"/type/" === "Archived"',
    then: 'A',
  },
  {
    if: '"/classification/" === "Admin"',
    then: 'D',
  },
  {
    if: '"/classification/" === "Civil"',
    then: 'B',
  },
  {
    if: '"/classification/" === "Complaint"',
    then: 'H',
  },
  {
    if: '"/classification/" === "Criminal"',
    then: 'K',
  },
  {
    if: '"/classification/" === "EPWMD"',
    then: 'P',
  },
  {
    if: '"/classification/" === "HR"',
    then: 'R',
  },
  {
    if: '"/classification/" === "LLRB"',
    then: 'L',
  },
  {
    if: '"/classification/" === "LRC"',
    then: 'C',
  },
  {
    if: '"/classification/" === "Opinion"',
    then: 'A',
  },
  {
    if: '"/classification/" === "Supplies"',
    then: 'S',
  },
  {
    if: '"/classification/" === "Ombudsman Cases"',
    then: 'E',
  },
];

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
        then: 'D',
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
      {
        if: '/data/ === "Ombudsman Cases"',
        then: 'E',
      },
    ],
  },
  sequence: {
    default: 1,
    increment: 1,
    padStart: {
      length: 3,
      string: '0',
    },
    separate: true,
    queries: {
      type: {
        collection: 'Document',
        find: '{ "type": "/data/", "dateClassified": { "$gte": "/from/", "$lte": "/to/" }, "controlNumber": { "$regex": "`^${dataRegex}.*`" }, "migrated": false }',
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
      classification: {
        collection: 'Document',
        find: '{ "classification": "/data/", "dateClassified": { "$gte": "/from/", "$lte": "/to/" }, "controlNumber": { "$regex": "`${dataRegex}$`" }, "migrated": false }',
        dataRegex: [
          {
            if: '/data/ === "Admin"',
            then: 'D',
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
          {
            if: '/data/ === "Ombudsman Cases"',
            then: 'E',
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
