import PhotoSwipe from '@dlevs/photoswipe';
import PhotoSwipeUI from './photoswipe-ui';

const getSlideElements = () => Array.prototype.slice.call(
	document.querySelectorAll('.js-photoswipe')
);

const openGallery = (index, disableTransitions) => {
	const pswpElement = document.querySelector('.pswp');
	const elems = getSlideElements();
	// Check first thumbnail format. First image is unlikely to be
	// lazyloaded, so will be populated with webp/ jpg, instead of
	// placeholder data gif src.
	const firstThumbnail = elems[0].getElementsByTagName('img')[0];
	const isWebp = /\.webp$/.test(firstThumbnail.currentSrc);
	const items = elems.map(function (elem) {
		const thumbnail = elem.getElementsByTagName('img')[0];
		const caption = elem.getElementsByTagName('figcaption')[0];

		return {
			src: isWebp ? elem.dataset.hrefWebp : elem.href,
			msrc: thumbnail.currentSrc || thumbnail.src,
			thumbnail: thumbnail,
			w: Number(elem.dataset.width),
			h: Number(elem.dataset.height),
			mapLink: elem.dataset.mapLink,
			title: elem.dataset.caption || (caption && caption.textContent)
		}
	});
	const options = {
		index: index,
		getThumbBoundsFn: (index) => {
			const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
			const rect = items[index].thumbnail.getBoundingClientRect();

			return {
				x: rect.left,
				y: rect.top + pageYScroll,
				w: rect.width
			};
		},
		getDoubleTapZoom: () => {
			const scale = 1 / (window.devicePixelRatio || 1);
			const minScale = 0.5;
			return Math.max(minScale, scale);
		}
	};

	if (disableTransitions) {
		options.hideAnimationDuration = 0;
		options.showAnimationDuration = 0;
	}

	const gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI, items, options);

	gallery.init();

	window.gtag('event', 'gallery_view', {
		page_path: location.pathname + location.search + location.hash,
		event_category: 'engagement',
		event_label: 'open',
		image_src: items[index].src,
		gallery_index: index
	});
	gallery.listen('shareLinkClick', function (e, target) {
		console.log()
		window.gtag('event', 'share', {
			content_type: 'image',
			method: target.dataset.method,
			index: gallery.currItem.index,
			title: gallery.currItem.title
		});
	})
};

/**
 * Opens the photoswipe gallery when clicking a link with the "js-photoswipe"
 * class. All images with class "js-photoswipe" are included in the gallery.
 *
 * The link should have a href for a larger version of the image that it wraps.
 *
 * e.g.
 * <a href="foo_large.jpg" class="js-photoswipe" data-width="1000" data-height="600">
 *     <img src="foo.jpg" alt="Foo" />
 * </a>
 *
 * @param {Object} event
 */
const onImageLinkClick = (event) => {
	const imgLink = event.target.closest('.js-photoswipe');

	if (!imgLink) return;

	event.preventDefault();

	const elems = getSlideElements();
	const index = elems.indexOf(imgLink);

	openGallery(index);
};

const openGalleryFromHash = () => {
	const matches = /pid=(\d+)/.exec(location.hash);

	if (!matches) return;

	const index = Number(matches[1]) - 1;

	openGallery(index, true);
};

export const init = () => {
	document.addEventListener('click', onImageLinkClick);
	openGalleryFromHash();
};
