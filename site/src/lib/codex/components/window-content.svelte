<script lang="ts">
	import { type CodexWindow } from '$lib/codex/managers/window-manager.svelte';
	import PdfWindow from '$lib/codex/components/pdf-window.svelte';
	import DocWindow from '$lib/codex/components/doc-window.svelte';
	import ImageWindow from '$lib/codex/components/image-window.svelte';
	import SettingsWindow from '$lib/codex/components/settings-window.svelte';
	import PlaytestWindow from '$lib/codex/components/playtest-window.svelte';
	import LoginWindow from '$lib/codex/components/login-window.svelte';
	import LogoutWindow from '$lib/codex/components/logout-window.svelte';
	import RegisterWindow from '$lib/codex/components/register-window.svelte';
	import FormWindow from '$lib/codex/components/form-window.svelte';

	let { window }: { window: CodexWindow } = $props();
</script>

{#if window.type === 'pdf'}
	<PdfWindow {window} />
{:else if window.type === 'doc'}
	<DocWindow {window} />
{:else if window.type === 'image'}
	<ImageWindow {window} />
{:else if window.type === 'settings'}
	<SettingsWindow {window} />
{:else if window.type === 'playtest'}
	<PlaytestWindow {window} />
{:else if window.type === 'login'}
	<LoginWindow {window} />
{:else if window.type === 'logout'}
	<LogoutWindow {window} />
{:else if window.type === 'register'}
	<RegisterWindow {window} />
{:else if window.type === 'form'}
	<FormWindow formId={window.contentData} />
{/if}
