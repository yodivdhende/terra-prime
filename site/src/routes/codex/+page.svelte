<script lang="ts">
	import { onMount } from 'svelte';
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';

	let crtEnabled = $state(false);
	let scanlinesEnabled = $state(false);
	let vignetteEnabled = $state(false);
	let feImageEl: SVGFEImageElement;

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
	<main class:crt={crtEnabled}>
		<Desktop></Desktop>
		<Taskbar></Taskbar>
	</main>
	{#if vignetteEnabled}<div class="vignette"></div>{/if}
	{#if scanlinesEnabled}<div class="scanlines"></div>{/if}
</div>
<div class="toggles">
	<button onclick={() => (crtEnabled = !crtEnabled)}>CRT {crtEnabled ? 'ON' : 'OFF'}</button>
	<button onclick={() => (scanlinesEnabled = !scanlinesEnabled)}
		>SCAN {scanlinesEnabled ? 'ON' : 'OFF'}</button
	>
	<button onclick={() => (vignetteEnabled = !vignetteEnabled)}
		>VIG {vignetteEnabled ? 'ON' : 'OFF'}</button
	>
</div>

<style>
	@import '$lib/styles/stemtest.css';

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

	.toggles {
		position: absolute;
		bottom: 8px;
		left: 8px;
		z-index: 10000;
		display: flex;
		gap: 4px;
	}

	.toggles button {
		padding: 2px 8px;
		font-family: 'Courier New', Courier, monospace;
		font-size: 11px;
		background: rgba(0, 0, 0, 0.6);
		color: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
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
		background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%);
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
