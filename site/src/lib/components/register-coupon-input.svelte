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
	<input type="text" placeholder="optional" value={REGISTER_MANAGER.couponCode} {oninput} {onblur} />
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
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75em;
		padding: 0.5rem 1.25rem;
	}

	.coupon-field span {
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.coupon-field input {
		font-family: var(--font-mono);
		background: var(--color-bg);
		color: var(--color-main);
		border: none;
		padding: 4px 8px;
		outline: none;
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
