const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');

// sync codes exception safety net
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

require('dotenv').config();
const app = require('./app');

console.log(process.env.DATABASE);

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB' , new Date());
    console.error(err.name, err.message);
    process.exit(1); // Exit the app if DB connection fails
  });

sgMail.setApiKey(process.env.SEND_GRID_APIKEY);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server is running at port ${process.env.PORT}`)
);

// async code exception safety net
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
