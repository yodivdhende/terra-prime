<script lang="ts">
	import {
		addCanvasPortalSnippet,
		removeCanvasPortalSnippet
	} from '$lib/components/canvas-portal-target.svelte';
	import { type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		addCanvasPortalSnippet(children);
		return () => removeCanvasPortalSnippet(children);
	});
</script>
