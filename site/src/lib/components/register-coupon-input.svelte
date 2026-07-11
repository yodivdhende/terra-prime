<script lang="ts">
	import type { RegisterManager } from '$lib/managers/register-manager.svelte';

	let { REGISTER_MANAGER }: { REGISTER_MANAGER: RegisterManager } = $props();

	if (REGISTER_MANAGER.couponCode.trim()) {
		REGISTER_MANAGER.validateCoupon();
	}

	function oninput(e: Event) {
		REGISTER_MANAGER.couponCode = (e.target as HTMLInputElement).value;
	}

	function onblur() {
		REGISTER_MANAGER.validateCoupon();
	}
</script>

<label class="coupon-field">
	<span>coupon code</span>
	<input
		type="text"
		placeholder="optional"
		value={REGISTER_MANAGER.couponCode}
		{oninput}
		{onblur}
	/>
	<button class="btn"> submit </button>
	{#if REGISTER_MANAGER.couponStatus === 'checking'}
		<span class="status">checking…</span>
	{:else if REGISTER_MANAGER.couponStatus === 'valid'}
		<span class="status valid">+{REGISTER_MANAGER.couponValue} budget</span>
	{:else if REGISTER_MANAGER.couponStatus === 'invalid'}
		<span class="status invalid">invalid code</span>
	{/if}
</label>

<style>
	.coupon-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1em;
	}

	.coupon-field span {
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	.coupon-field input {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: transparent;
		color: var(--color-main);
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		outline: none;
	}

	.coupon-field input:focus {
		border-bottom-color: var(--color-accent);
	}

	button {
		max-width: 100px;
	}

	.status.valid {
		opacity: 1;
		color: var(--color-accent);
	}

	.status.invalid {
		opacity: 0.7;
		color: #d95c5c;
	}
</style>
