const mongoose = require('mongoose');

const dbConfig = process.env.NODE_ENV === 'development' ? {} : {
    ssl: false,
// useNewUrlParser: true, 
// useUnifiedTopology: true,
//   ssl: true,
//   tlsAllowInvalidCertificates: false,
//   tlsCAFile: '/root/.ssh/rds-combined-ca-bundle.pem'
}

exports.connect = (uri) => {
  mongoose.connect(uri, dbConfig).then(() => {

    console.log('Connected to DB');

  }).catch(err => {

    console.error('mongoose error:' + err.message, err.stack)
  })
};