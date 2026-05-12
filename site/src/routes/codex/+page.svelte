<script lang="ts">
	import { onMount } from 'svelte';
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';
	import { type PageProps } from './$types';
	import { WINDOW_MANAGER } from '$lib/codex/managers/window-manager.svelte';
	import { EFFECTS_MANAGER } from '$lib/codex/managers/effects-manager.svelte';
	import { FEATURE_MANAGER } from '$lib/codex/managers/feature-manager.svelte';
	import { CREDENTIAL_STORE } from '$lib/local-utils/credential-manager.svelte';

	let { data }: PageProps = $props();
	let feImageEl: SVGFEImageElement;

	$effect(() => FEATURE_MANAGER.setFlags({ loginEnabled: data.loginEnabled }));
	$effect(() => WINDOW_MANAGER.addWindows(data.files));
	$effect(() => WINDOW_MANAGER.setRegisterEnabled(CREDENTIAL_STORE.isLogedIn));
	$effect(() => WINDOW_MANAGER.setLoginEnabled(FEATURE_MANAGER.loginEnabled));

	onMount(() => {
		const size = 256;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const imageData = ctx.createImageData(size, size);
		const { data } = imageData;

		const k = 0.3; // barrel distortion strength

		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const nx = (x / (size - 1)) * 2 - 1;
				const ny = (y / (size - 1)) * 2 - 1;
				const r2 = nx * nx + ny * ny;
				const dx = nx * k * r2;
				const dy = ny * k * r2;
				const i = (y * size + x) * 4;
				data[i] = Math.round(Math.max(0, Math.min(255, (dx + 1) * 127.5)));
				data[i + 1] = Math.round(Math.max(0, Math.min(255, (dy + 1) * 127.5)));
				data[i + 2] = 0;
				data[i + 3] = 255;
			}
		}

		ctx.putImageData(imageData, 0, 0);
		feImageEl.setAttribute('href', canvas.toDataURL());
	});
</script>

<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<filter
			id="crt-barrel"
			x="-5%"
			y="-5%"
			width="110%"
			height="110%"
			color-interpolation-filters="sRGB"
		>
			<feImage bind:this={feImageEl} result="map" preserveAspectRatio="none" />
			<feDisplacementMap
				in="SourceGraphic"
				in2="map"
				scale="120"
				xChannelSelector="R"
				yChannelSelector="G"
			/>
		</filter>
	</defs>
</svg>

<div class="backdrop">
	<main class:crt={EFFECTS_MANAGER.crt}>
		<Desktop></Desktop>
		<Taskbar></Taskbar>
	</main>
	{#if EFFECTS_MANAGER.vignette}<div class="vignette"></div>{/if}
	{#if EFFECTS_MANAGER.scanlines}<div class="scanlines"></div>{/if}
</div>

<style>
	@import '$lib/styles/theme.css';

	main {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background-color: var(--bg);
		font-family: 'Courier New', Courier, monospace;
		border-radius: 4px;
	}

	main.crt {
		filter: url('#crt-barrel');
	}

	.backdrop {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background-color: black;
	}

	.vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
		z-index: 9999;
	}

	.scanlines {
		pointer-events: none;
		position: fixed;
		inset: 0;
		z-index: 10;
		opacity: 1;
		transition: opacity 1s ease;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.15) 3px,
			rgba(0, 0, 0, 0.15) 4px
		);
	}
</style>
