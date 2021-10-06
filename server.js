const mongoose = require('mongoose');

// sync codes exception safety net
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

require('dotenv').config();
const app = require('./app');

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('Connected to DB'));

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
