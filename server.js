const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
});

require('dotenv').config();
const app = require('./app');

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', new Date());
    console.error(err.name, err.message);
    process.exit(1); // Exit the app if DB connection fails
  });

const server = app.listen(process.env.PORT, () =>
  console.log(`Server is running at port ${process.env.PORT}`)
);

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
});
