'use strict';

const puppeteer = require('puppeteer');
const { URL } = require('url');
const { PAGES, ORIGIN, CREDENTIALS } = require('./testLib/browserTestConstants');
const { fetch, eachLimited } = require('./testLib/browserTestUtils');

let browser;
beforeAll(async (done) => {
	browser = await puppeteer.launch();
	done();
});
afterAll(async (done) => {
	await browser.close();
	done();
});


describe('Links and static resources', () => {
	test('exist and return an OK status code', async () => {
		const ignoreList = [
			// LinkedIn returns status 999 "Request denied" for non-browser
			'https://www.linkedin.com/in/daniellevett/',
		];
		let assets = [];

		await Promise.all(PAGES.UNIQUE.map(async (url) => {
			const page = await browser.newPage();
			await page.authenticate(CREDENTIALS);
			await page.goto(url);
			const newAssets = await page.evaluate(() => {
				const $ = selector => Array.from(document.querySelectorAll(selector));
				const links = []
					.concat($('[href]').map(el => el.getAttribute('href')))
					.concat($('[src]').map(el => el.getAttribute('src')))
					.concat($('[data-href-webp]').map(({ dataset }) => dataset.hrefWebp))
					.concat($('meta').map(({ content }) => content).filter(str => /^(http|\/)/.test(str)));

				$('script[type="application/ld+json"]').forEach(({ innerHTML }) => {
					const regex = /"(https?:\/\/.*?)"/g;
					let match;

					// eslint-disable-next-line no-cond-assign
					while (match = regex.exec(innerHTML)) {
						links.push(match[0]);
					}
				});

				return links;
			});
			assets = assets.concat(newAssets);
		}));

		assets = Array
			// Remove duplicates
			.from(new Set(assets))
			// Remove unwanted URLS
			.filter(url => !url.startsWith('data:'))
			.filter(url => !ignoreList.includes(url));

		expect(assets.every(value => typeof value === 'string')).toBe(true);
		expect(assets.every(value => value.trim() !== '')).toBe(true);
		expect(assets.length).toBeGreaterThan(0);

		// If link is from data attribute instead of "src" or "href",
		// browser does not expand to be an absolute URL. Do this manually.
		assets = assets.map((url) => {
			if (url.startsWith('http')) {
				return url;
			}
			return new URL(url, ORIGIN).toString();
		});

		eachLimited(assets, async (url) => {
			const response = await fetch(url);
			expect(response).toMatchObject({ ok: true });
		});
	}, 60000);
});
