const path = require('path');
const Koa = require('koa');
const serve = require('koa-static');
const views = require('koa-views');
const slash = require('koa-slash');
const router = require('./routes');
const ImageManager = require('./lib/ImageManager');

const app = new Koa();

app
	.use(slash())
	.use(views(path.join(__dirname, 'views'), {
		extension: 'pug',
		// Using "options" object to set local variables in templates
		options: {ImageManager}
	}))
	.use(router.routes())
	.use(router.allowedMethods())
	.use(serve('./public'))
	.use(serve('./public-dist'))
	.listen(3000);
