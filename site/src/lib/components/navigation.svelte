<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import { sectionManager } from '$lib/managers/section-manager.svelte';

	const roles = $derived(CREDENTIAL_MANAGER.roles);

	afterNavigate((navigation) => {
		if (navigation.to?.url.pathname === '/') {
			sectionManager.showSection = false;
		} else {
			sectionManager.showSection = true;
		}
	});
</script>

<nav>
	<a class="navigation-button" href="/">Home</a>
	{#if roles.includes('user') === false}
		<a class="navigation-button" href="/main/login">login</a>
	{/if}
	{#if roles.includes('user')}
		<a class="navigation-button" href="/main/dashboard/users">Users</a>
	{/if}
	{#if roles.includes('admin')}
		<div class="dropdown-header">
			<button class="navigation-button">Manage</button>
			<ul>
				<li><a class="navigation-button" href="/main/dashboard/manage/skills">Skills</a></li>
				<li><a class="navigation-button" href="/main/dashboard/manage/items">Items</a></li>
				<li><a class="navigation-button" href="/main/dashboard/manage/implants">Implants</a></li>
				<li><a class="navigation-button" href="/main/dashboard/manage/events">Events</a></li>
			</ul>
		</div>
	{/if}
	{#if roles.includes('user')}
		<a class="navigation-button" href="/main/dashboard/characters">Characters</a>
	{/if}
	{#if roles.includes('user')}
		<a class="navigation-button" href="/main/dashboard/events">Events</a>
	{/if}
	{#if roles.includes('admin')}
		<a class="navigation-button" href="/main/dashboard/sessions">Sessions</a>
	{/if}
</nav>

<style>
	nav {
		display: flex;
		background-color: black;
		border-bottom: 1px solid white;
		font-size: 2rem;
	}

	.navigation-button {
		display: block;
		background-color: black;
		padding: 1em;
		height: 100%;
		color: white;
		text-decoration: none;
		line-height: 1em;
		border: 1px solid white;
		border-top: none;
		font-size: 1em;
	}

	.navigation-button:hover {
		background-color: darkslategray;
	}

	.dropdown-header {
		position: relative;
		height: 100%;
		cursor: pointer;
	}

	.dropdown-header ul {
		position: absolute;
		opacity: 0;
		display: none;
	}

	.dropdown-header:hover ul {
		display: block;
	}

	.dropdown-header > .navigation-button:focus + ul {
		opacity: 1;
		flex-direction: column;
	}
</style>
