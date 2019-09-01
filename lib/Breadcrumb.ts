'use strict';

const assert = require('assert');
const last = require('lodash/last');

interface BreadCrumbItemSource {
	slug: string
	name: string
}

/**
 * Takes an array of objects with a slug property, and adds
 * the cumulative URL path to each object.
 */
const expandBreadcrumb = (breadcrumb: BreadCrumbItemSource[]) => {
	const currentSlugs: string[] = [];

	return breadcrumb.map(({ slug, ...otherProps }) => {
		currentSlugs.push(slug);

		return {
			...otherProps,
			slug,
			path: currentSlugs.join('/') || '/',
		};
	});
};

class Breadcrumb {
	parts: ReturnType<typeof expandBreadcrumb>

	constructor(parts: BreadCrumbItemSource[]) {
		this.parts = expandBreadcrumb(parts);
	}

	append(parts: BreadCrumbItemSource[]) {
		return new Breadcrumb([...this.parts, ...parts]);
	}

	get currentPage() {
		return last(this.parts);
	}

	get path() {
		return this.currentPage.path;
	}
}

module.exports = Breadcrumb;