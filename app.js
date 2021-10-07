const express = require('express');

const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

const userRouter = require('./routes/GENERAL/user.routes');
const authRouter = require('./routes/GENERAL/auth.routes');

const errorController = require('./controllers/GENERAL/error.controller');

const AppError = require('./utils/errors/AppError');

const app = express();

app.use(helmet());

app.use(express.json());

app.use(mongoSanitize());
app.use(xss());

app.use('/api/v1/tenants', userRouter);
app.use('/api/v1/auth', authRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

module.exports = app;
