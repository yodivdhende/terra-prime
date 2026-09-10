class CodexWindowManager {
	private _openWindows: string[] = $state([]);

	public get openWindows(): string[] {
		return this._openWindows;
	}

	public open(windowId: string): void {
		if (!this._openWindows.includes(windowId)) {
			this._openWindows.push(windowId);
		}
	}

	public close(windowId: string): void {
		this._openWindows = this._openWindows.filter((id) => id !== windowId);
	}

	public closeAll(): void {
		this._openWindows = [];
	}
}

export const codexWindowManager = new CodexWindowManager();
