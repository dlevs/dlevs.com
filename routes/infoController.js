'use strict';

const { getLastCommit } = require('../lib/gitUtils');
const { version } = require('../package');

// Get last commit data only once, on server init, so we can be sure that
// the version of the server which is running is the one that is reported.
const lastCommitPromise = getLastCommit();
const serverStartDate = new Date().toString();

module.exports = () => ({
	index: async (ctx) => {
		ctx.body = {
			appVersion: version,
			nodeVersion: process.version,
			date: new Date().toString(),
			serverStartDate,
			environment: process.env.NODE_ENV,
			lastCommit: await lastCommitPromise,
		};
	},
});
