import { Middleware } from 'koa';

interface RobotsController {
	index: Middleware;
}

/**
 * Generate robots text with absolute URLs.
 */
const getRobotsText = (origin: string) => `

# Allow crawling of all content
User-agent: *
Disallow:

# XML Sitemaps
Sitemap: ${origin}/sitemap.xml

`.trim();

/*
 * Robots text needs to have an absolute path for the sitemap, therefore,
 * it has its own route to generate this dynamically.
 */
export default (): RobotsController => ({
	index: (ctx) => {
		ctx.body = getRobotsText(ctx.origin);
	},
});
