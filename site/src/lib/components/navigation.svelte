<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import { sectionManager } from '$lib/managers/section-manager.svelte';

	const roles = $derived(CREDENTIAL_MANAGER.credentials.roles);
	let manageOpen = $state(false);

	afterNavigate((navigation) => {
		if (navigation.to?.url.pathname === '/') {
			sectionManager.showSection = false;
		} else {
			sectionManager.showSection = true;
		}
	});
</script>

<nav>
	<a class="entry" href="/">Home</a>
	{#if !roles.includes('user')}
		<a class="entry" href="/manage/login">Login</a>
	{/if}
	{#if roles.includes('user')}
		<a class="entry" href="/manage/users">Users</a>
	{/if}
	{#if roles.includes('admin')}
		<button class="entry folder" onclick={() => (manageOpen = !manageOpen)}>
			<span class="arrow">{manageOpen ? 'v' : '>'}</span>
			<span class="name">Manage</span>
		</button>
		{#if manageOpen}
			<a class="entry child" href="/manage/skills">Skills</a>
			<a class="entry child" href="/manage/items">Items</a>
			<a class="entry child" href="/manage/implants">Implants</a>
			<a class="entry child" href="/manage/events">Events</a>
		{/if}
	{/if}
	{#if roles.includes('user')}
		<a class="entry" href="/manage/characters">Characters</a>
	{/if}
	{#if roles.includes('admin')}
		<a class="entry" href="/manage/sessions">Sessions</a>
	{/if}
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		background-color: black;
		border-right: 1px solid white;
		height: 100%;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.6rem 0.75rem;
		background: none;
		border: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		color: white;
		text-decoration: none;
		font-family: inherit;
		font-size: 1.1rem;
		text-align: left;
		cursor: pointer;
		width: 100%;
		letter-spacing: 0.04em;
		white-space: nowrap;
		opacity: 0.7;
		transition: opacity 0.1s, background-color 0.1s;
	}

	.entry:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.06);
	}

	.entry.child {
		padding-left: 1.75rem;
		font-size: 0.95rem;
		opacity: 0.5;
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.entry.child:hover {
		opacity: 1;
	}

	.arrow {
		font-size: 0.6rem;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
