<script lang="ts">
	let {
		message,
		onconfirm,
		oncancel
	}: {
		message: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialog: HTMLDialogElement;

	export function open() {
		dialog.showModal();
	}

	export function close() {
		dialog.close();
	}

	function handleConfirm() {
		dialog.close();
		onconfirm();
	}

	function handleCancel() {
		dialog.close();
		oncancel();
	}
</script>

<dialog bind:this={dialog}>
	<div class="card">
		<p>{message}</p>
		<div class="actions">
			<button class="btn cancel" onclick={handleCancel}>Cancel</button>
			<button class="btn confirm" onclick={handleConfirm}>Confirm</button>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	dialog {
		border: none;
		padding: 0;
		background: transparent;
		color: var(--color-main);
	}

	.card {
		background: var(--color-bg, #1a1a1a);
		border: 1px solid var(--color-border, #444);
		padding: 24px;
		min-width: 280px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	p {
		margin: 0;
		font-size: 0.95rem;
	}

	.actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.cancel {
		padding: 6px 14px;
		cursor: pointer;
	}

	.confirm {
		padding: 6px 14px;
		cursor: pointer;
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
