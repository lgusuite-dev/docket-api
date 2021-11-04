const express = require('express');
const cors = require('cors');

const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

const userRouter = require('./routes/GENERAL/user.routes');
const authRouter = require('./routes/GENERAL/auth.routes');
const teamRouter = require('./routes/GENERAL/team.routes');
const roleRouter = require('./routes/GENERAL/role.routes');
const taskRouter = require('./routes/GENERAL/task.routes');
const eventRouter = require('./routes/GENERAL/event.routes');

const errorController = require('./controllers/GENERAL/error.controller');

const AppError = require('./utils/errors/AppError');
const { origin } = require('./utils/security');

const app = express();

app.use(
  cors({
    origin,
    methods: ['POST', 'PATCH', 'PUT', 'DELETE', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json());

app.use(mongoSanitize());
app.use(xss());

app.use('/api/v1/tenants', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/events', eventRouter);

app.get('/api/v1/health', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Up and Running!',
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

module.exports = app;
