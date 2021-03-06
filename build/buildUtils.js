'use strict';

const { promisify } = require('util');
const fs = require('fs-extra');
const glob = promisify(require('glob'));
const ProgressBar = require('progress');
const mapLimit = promisify(require('async').mapLimit);
const chalk = require('chalk');
const { root, relativeToRoot } = require('../lib/pathUtils');
const { toFixedTrimmed } = require('../lib/numberUtils');

const PUBLIC_SRC_REGEX = new RegExp('/publicSrc/.*?/');
const FILEPATH_MEDIA_JSON = root('./data/generated/media.json');
const MAX_FILES_PROCESS_CONCURRENTLY = 8;


/**
 * Create the corresponding output path for any file that is in the
 * "publicSrc" directory, waiting to be processed.
 *
 * The output path will be in the "public" directory, so that it is
 * accessible to the user.
 *
 * createWebPath('/path/to/this/repo/publicSrc/process/media/foo.jpg');
 * // '/path/to/this/repo/public/media/foo.jpg'
 *
 * @param {String} filepath
 * @returns {String}
 */
exports.createOutputPath = filepath => filepath
	.replace(PUBLIC_SRC_REGEX, '/public/');

/**
 * Create the corresponding web path for any file that is in the
 * "publicSrc" directory OR an already processed file in the "public"
 * directory.
 *
 * The web path is the relative path that can be appended to the
 * site hostname to access the resource.
 *
 * createWebPath('/path/to/this/repo/publicSrc/process/media/foo.jpg');
 * // '/media/foo.jpg'
 *
 * @param {String} filepath
 * @returns {String}
 */
exports.createWebPath = filepath => `/${relativeToRoot(filepath)}`
	.replace('/public/', '/')
	.replace(PUBLIC_SRC_REGEX, '/');

/**
 * Get the CSS padding-bottom value needed to perform the padding-bottom
 * hack for maintaining the height of an element while it is loading.
 *
 * As described in:
 * http://andyshora.com/css-image-container-padding-hack.html
 *
 * @param {Number} width
 * @param {Number} height
 * @returns {String}
 */
exports.getPaddingBottom = (width, height) =>
	`${toFixedTrimmed(((height / width) * 100), 4)}%`;

/**
 * A wrapper around console.log.
 *
 * The provided `name` is prepended to all messages.
 *
 * Extra methods are added, like `.success()`, which affects
 * the color of the logged message.
 *
 * @param {String} name
 * @returns {Object}
 */
const createLogger = name => new Proxy(console, {
	get(obj, logLevel) {
		return (...args) => {
			let method = logLevel;
			let messages = args;
			let color;

			if (logLevel === 'success') {
				method = 'log';
				color = 'green';
			}

			if (color) {
				messages = messages.map(message => chalk[color](message));
			}

			obj[method](
				chalk.cyan(`[${name}]`),
				...messages,
			);
		};
	},
});

/**
 * Get the existing meta JSON object from file, or an empty object if it
 * doesn't exist.
 *
 * @returns {Promise.<Object>}
 */
const getMedia = async () => {
	try {
		return await fs.readJson(FILEPATH_MEDIA_JSON);
	} catch (err) {
		return {};
	}
};

/**
 * Process all files that match `globPattern` by passing them through
 * `processFile`, which must return a promise that resolves to an
 * object with meta data about any output files that may have been
 * produced from the input file.
 *
 * This meta data is added to a JSON file for reference later.
 *
 * Example of an object `processFile` may return:
 * {
 *     type: 'image',
 *     versions: {
 *         default: { 'src': '/foo.jpg', width: 400, height: 300 },
 *         large: { 'src': '/foo-large.jpg', width: 600, height: 450 },
 *     },
 * }
 *
 * @param {String} fileType
 * @param {Function} processFile
 * @param {String} globPattern
 */
exports.addMedia = async (fileType, processFile, globPattern) => {
	const logger = createLogger(fileType);
	const media = await getMedia();
	const allFilepaths = await glob(globPattern);
	const filepaths = allFilepaths.filter((filepath) => {
		const webPath = exports.createWebPath(filepath);
		return media[webPath] === undefined;
	});
	const progress = new ProgressBar('[:bar] :percent', {
		total: filepaths.length,
		clear: true,
	});

	logger.log(`${allFilepaths.length} files found`);
	logger.log(`${filepaths.length} files are new`);

	if (!filepaths.length) {
		logger.success('No action taken');
		return;
	}

	logger.log('Processing new files');

	const newMedia = await mapLimit(
		filepaths,
		MAX_FILES_PROCESS_CONCURRENTLY,
		async (filepath) => {
			const outputData = await processFile(filepath);
			progress.tick();
			return {
				[exports.createWebPath(filepath)]: outputData,
			};
		},
	);

	await fs.writeJson(
		FILEPATH_MEDIA_JSON,
		Object.assign(
			{},
			media,
			...newMedia,
		),
		{ spaces: '\t' },
	);

	logger.success(`${filepaths.length} files successfully processed`);
};
