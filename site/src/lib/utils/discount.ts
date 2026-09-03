/** Apply a percentage discount (0-100) to a price, rounded down. */
export function applyDiscount(price: number, discountPercent: number): number {
	return Math.max(0, Math.floor(price * (1 - discountPercent / 100)));
}
