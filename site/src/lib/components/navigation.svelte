<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { CREDENTIAL_MANAGER } from '$lib/local-utils/credential-manager.svelte';
	import { sectionManager } from '$lib/managers/section-manager.svelte';

	const roles = $derived(CREDENTIAL_MANAGER.credentials.roles);
	let manageOpen = $state(false);
	let characterOpen = $state(false);
	const isAdmin = $derived(roles.includes('admin'));
	const subcoEnabled = $derived(page.data.subcoEnabled === true);

	$effect(() => {
		const pathname = page.url.pathname;
		sectionManager.showSection = pathname !== '/' && pathname !== '/manage';
	});
</script>

<nav>
	<div class="nav-top">
		<a class="entry" href={resolve('/manage')}>Home</a>
		{#if !isAdmin}
			<a class="entry" href={resolve('/manage/login')}>Login</a>
		{:else}
			<a class="entry" href={resolve('/manage/users')}>Users</a>
			<a class="entry" href={resolve('/manage/events')}>Events</a>
			<button class="entry folder" onclick={() => (manageOpen = !manageOpen)}>
				<span class="arrow">{manageOpen ? 'v' : '>'}</span>
				<span class="name">Manage</span>
			</button>
			{#if manageOpen}
				<a class="entry child" href={resolve('/manage/expertise')}>Expertise</a>
				<a class="entry child" href={resolve('/manage/expertise/groups')}>Expertise Groups</a>
				<a class="entry child" href={resolve('/manage/items')}>Items</a>
				<a class="entry child" href={resolve('/manage/implants')}>Implants</a>
				<a class="entry child" href={resolve('/manage/companies')}>Companies</a>
				{#if subcoEnabled}
					<a class="entry child" href={resolve('/manage/subco')}>Subco</a>
				{/if}
			{/if}
			<button class="entry folder" onclick={() => (characterOpen = !characterOpen)}>
				<span class="arrow">{characterOpen ? 'v' : '>'}</span>
				<span class="name">Characters</span>
			</button>
			{#if characterOpen}
				<a class="entry child" href={resolve('/manage/characters')}>Character</a>
				<a class="entry child" href={resolve('/manage/characters/versions')}>Versions</a>
			{/if}
			<a class="entry" href={resolve('/manage/emails')}>Emails Templates</a>
			<a class="entry" href={resolve('/manage/sessions')}>Sessions</a>
		{/if}
	</div>
	{#if isAdmin}
		<button class="entry" onclick={CREDENTIAL_MANAGER.logout}>Logout</button>
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

	.nav-top {
		display: flex;
		flex-direction: column;
		flex: 1;
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
		letter-spacing: 0.04em;
		white-space: nowrap;
		opacity: 0.7;
		transition:
			opacity 0.1s,
			background-color 0.1s;
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
