<script lang="ts">
	import { goto } from '$app/navigation';
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import type { PageProps } from './$types';

	let showPassword = $state(false);
	let passwordInputType = $derived.by(() => (showPassword ? 'text' : 'password'));
	let submitButton: HTMLButtonElement;

	let email = '';
	let password = '';

	function toggleShowPassword() {
		showPassword = !showPassword;
	}

	function login(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		if (submitButton == null) return;
		submitButton.click();
	}

	let { form, data }: PageProps = $props();
	$effect(() => {
		if (form?.error) console.error(form.error);
		if (form?.success) {
			const { roles, name, userId } = form.success;
			CREDENTIAL_MANAGER.credentials = {
				roles,
				name: name ?? '',
				id: userId ?? null,
			};
		}
	});
	$effect(() => {
		if (CREDENTIAL_MANAGER.isLogedIn) goto('/manage');
	});
</script>

<main>
	<div class="login-container">
		<form method="POST" action="/manage/login">
			<h1>Login</h1>
			<label for="email">Email</label>
			<input type="email" name="email" id="email" value={email} />
			<label for="password">Password</label>
			<div class="password">
				<input
					type={passwordInputType}
					name="password"
					id="password"
					value={password}
					onkeydown={login}
				/>
				{#if showPassword}
					<button class="btn" onclick={toggleShowPassword}>◎</button>
				{:else}
					<button class="btn" onclick={toggleShowPassword}>◉</button>
				{/if}
			</div>
			<button class="btn" bind:this={submitButton}> Login </button>
		</form>
		{#if data.registerEnabled}
			<a href="/manage/login/register">Register</a>
		{/if}
	</div>
</main>

<style>
	main {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.login-container {
		align-self: center;
		justify-self: center;
		display: grid;
		gap: 1em;
		flex-direction: column;
		width: min-content;
		height: min-content;
		padding: 2em;
		border: 1px solid white;
		border-radius: 5px;
	}

	.login-container form {
		display: grid;
		gap: 1em;
	}

	.password {
		display: flex;
	}
</style>
