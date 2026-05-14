<script lang="ts">
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import type { PageProps } from './$types';

	let showPassword = $state(false);
	let passwordInputType = $derived.by(() => (showPassword ? 'text' : 'password'));

	let name = 'Yodi Vandenhende';
	let email = 'yodi.vandenhende+test1@gmail.com';
	let password = 'Tester@123';

	function toggleShowPassword() {
		showPassword = !showPassword;
	}

	let { form }: PageProps = $props();
	$effect(() => {
		if (form?.error) console.error(form.error);
		if (form?.success) {
			const { roles } = form.success;
			CREDENTIAL_MANAGER.roles = roles;
		}
	});
</script>

<main>
	<div class="login-container">
		<form method="POST">
			<h1>Login</h1>
			<label for="name">name</label>
			<input type="name" name="name" id="name" value={name} />
			<label for="email">Email</label>
			<input type="email" name="email" id="email" value={email} />
			<label for="password">Password</label>
			<div class="password">
				<input type={passwordInputType} name="password" id="password" value={password} />
				{#if showPassword}
					<button onclick={toggleShowPassword}>◎</button>
				{:else}
					<button onclick={toggleShowPassword}>◉</button>
				{/if}
			</div>
			<div class="password">
				<input
					type={passwordInputType}
					name="passwordConfirm"
					id="passwordConfirm"
					value={password}
				/>
				{#if showPassword}
					<button onclick={toggleShowPassword}>◎</button>
				{:else}
					<button onclick={toggleShowPassword}>◉</button>
				{/if}
			</div>
			<button> Register </button>
		</form>
		<a href="/login">Login</a>
	</div>
</main>

<style>
	main {
		display: grid;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
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
		color: white;
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
