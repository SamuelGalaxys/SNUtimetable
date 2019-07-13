import ExpressPromiseRouter from 'express-promise-router';
import MonitorRouter = require('./MonitorRouter');
import StaticPageRouter = require('./StaticPageRouter');
import ApiRouter = require('./ApiRouter');

let router = ExpressPromiseRouter();

router.use('/monitor', MonitorRouter);

router.use(function(req, res) {
  req['context'] = {};
  return Promise.resolve('next');
})
router.use('/', StaticPageRouter);
router.use('/', ApiRouter);

export = router;