/**
 * Sanitize an SVG string before it is stored and later rendered via {@html}.
 *
 * Icons are admin-supplied text (preset picks or uploaded files), so we strip the
 * common script-injection vectors: <script> elements, inline event handler
 * attributes (on*=...), and javascript:/data:text/html URIs. This is a
 * defense-in-depth measure applied on write; icon.svelte additionally normalizes
 * the markup on render.
 */
export function sanitizeSvg(svg: string): string {
	if (typeof svg !== 'string') return '';
	return (
		svg
			// drop <script>...</script> blocks (and unterminated trailing ones)
			.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
			.replace(/<script\b[^>]*>/gi, '')
			// drop inline event-handler attributes: onclick="...", onload='...', onx=foo
			.replace(/\son[a-z0-9_-]+\s*=\s*"[^"]*"/gi, '')
			.replace(/\son[a-z0-9_-]+\s*=\s*'[^']*'/gi, '')
			.replace(/\son[a-z0-9_-]+\s*=\s*[^\s>]+/gi, '')
			// neutralize dangerous URIs in href/xlink:href/src/etc.
			.replace(/javascript:/gi, '')
			.replace(/data:text\/html/gi, '')
	);
}
