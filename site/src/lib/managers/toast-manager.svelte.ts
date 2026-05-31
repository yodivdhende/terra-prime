export type ToastType = 'success' | 'error' | 'warning';

export type ToastItem = {
	id: string;
	message: string;
	type: ToastType;
};

function createToastManager() {
	const toasts: ToastItem[] = $state([]);

	function remove(id: string) {
		const index = toasts.findIndex((t) => t.id === id);
		if (index >= 0) toasts.splice(index, 1);
	}

	function add(message: string, type: ToastType) {
		const id = crypto.randomUUID();
		toasts.push({ id, message, type });
		setTimeout(() => remove(id), 3000);
	}

	return {
		get toasts() {
			return toasts;
		},
		success: (message: string) => add(message, 'success'),
		error: (message: string) => add(message, 'error'),
		warning: (message: string) => add(message, 'warning'),
		remove,
	};
}

export const TOAST_MANAGER = createToastManager();
