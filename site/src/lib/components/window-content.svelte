<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import PdfWindow from '$lib/components/pdf-window.svelte';
	import DocWindow from '$lib/components/doc-window.svelte';
	import ImageWindow from '$lib/components/image-window.svelte';
	import SettingsWindow from '$lib/components/settings-window.svelte';
	import PlaytestWindow from '$lib/components/playtest-window.svelte';
	import LoginWindow from '$lib/components/login-window.svelte';
	import LogoutWindow from '$lib/components/logout-window.svelte';
	import RegisterWindow from '$lib/components/register-window.svelte';
	import FormWindow from '$lib/components/form-window.svelte';
	import AudioWindow from '$lib/components/audio-window.svelte';

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
{:else if window.type === 'audio'}
	<AudioWindow {window} />
{/if}
