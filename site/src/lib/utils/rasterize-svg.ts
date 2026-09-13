import type { RasterizeSvgAlpha } from './icon-export';

/**
 * Rasterizing an SVG to an alpha plane in the browser, so the export needs no image library on the
 * server and no native module in the container.
 *
 * The markup goes through a blob URL into an `<img>` and onto a canvas. That keeps the canvas
 * untainted — these icons are self-contained path data with no external references — which is what
 * makes `getImageData` legal. An SVG that did reach out to another origin would throw on read
 * rather than silently return blank pixels.
 */
export const rasterizeSvgAlpha: RasterizeSvgAlpha = async (svg, size) => {
	const image = await loadSvg(svg);
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (context == null) throw new Error('no 2d canvas context');

	// Fit the whole drawing into the square, whatever aspect its viewBox had.
	const scale = Math.min(size / (image.width || size), size / (image.height || size));
	const width = Math.max(1, Math.round((image.width || size) * scale));
	const height = Math.max(1, Math.round((image.height || size) * scale));
	context.drawImage(
		image,
		Math.floor((size - width) / 2),
		Math.floor((size - height) / 2),
		width,
		height
	);

	const { data } = context.getImageData(0, 0, size, size);
	const alpha = new Uint8Array(size * size);
	for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
	return alpha;
};

function loadSvg(svg: string): Promise<HTMLImageElement> {
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('could not rasterize the icon'));
		};
		image.src = url;
	});
}
