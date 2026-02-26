<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '$lib/assets/images/Logo.png';
	import CodeScroller from '$lib/components/code-scroller.svelte';
	import PlaytestForm from '$lib/components/playtest-form.svelte';

	const logoAnimationDuration = 1;
	const contentAnimationDuration = 2;
	let startCode = $state(false);

	setTimeout(() => (startCode = true), (logoAnimationDuration + contentAnimationDuration) * 1000);

	function postSubmit() {
		return () => {};
	}
</script>

<main
	style="--logo-animation-duration: {logoAnimationDuration}s; --content-animation-duration: {contentAnimationDuration}s"
>
	<div class="code">
		<CodeScroller start={startCode} speed={5} />
	</div>
	<img src={logo} alt="TerraPrime Logo" class="logo" />
	<div class="grid">
		<section class="glow-border grow-animation" style="">
			<div class="content">
				<p>Terra Prime is een gloednieuwe volwassenen-LARP onder DHvT.</p>
				<p>
					Stap in een futuristische wereld waar actie, samenwerking en verbeelding centraal staan.
					Samen met andere spelers en crew creëer je een meeslepend verhaal vol avontuur, spanning
					en humor !
				</p>
				<p>
					We spelen om elkaar te versterken, niet om te winnen. Daarom houden we de regels eenvoudig
					en ligt de focus op sfeer, plezier en sterk rollenspel. Nieuwe deelnemers kunnen vlot
					instappen, terwijl ervaren spelers alle ruimte krijgen om te schitteren in hun personage.
				</p>
				<p>
					Verwacht sciencefictionvibes, Nerf, close combat en een beleving die je even helemaal
					losmaakt van de echte wereld.
				</p>
				<p>Jouw plaats wacht in de Federatie!</p>

				<form method="post" use:enhance={postSubmit} >
					<PlaytestForm />
				</form>
			</div>
		</section>
	</div>
</main>

<style>
	:root {
		--custom-green: #00aa00;
		--font-green: #008800;
	}
	main {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
		background-color: black;
	}

	.code {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		background-color: black;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min(310px, 70vw) min-content;
		grid-template-areas:
			'logo'
			'section';
		justify-items: center;
		align-items: start;
		width: 100vw;
		height: 100vh;
		overflow-x: hidden;
		scrollbar-color: var(--custom-green) black;
		background-color: black;
	}

	.logo {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 1;
		transform: translate(-50%, -50%);
		max-width: 80vw;
		max-height: 80vh;
		animation-name: logoFadeIn;
		animation-duration: var(--logo-animation-duration);
		animation-fill-mode: forwards;
		animation-timing-function: cubic-bezier(0.8, 0, 0.2, 1);
	}

	@keyframes logoFadeIn {
		0% {
			opacity: 0;
			max-width: 80vw;
			max-height: 80vh;
			top: 50%;
			transform: translate(-50%, -50%);
		}
		50% {
			opacity: 1;
			max-width: 80vw;
			max-height: 80vh;
			top: 50%;
			transform: translate(-50%, -50%);
		}
		100% {
			opacity: 1;
			max-width: min(500px, 80vw);
			max-height: min(250px, 80vh);
			top: 30px;
			transform: translate(-50%, 0);
		}
	}

	section {
		grid-area: section;
		z-index: 2;
		max-width: 800px;
		margin: 0 20px 30px;
		overflow: hidden;
		word-wrap: none;
		background-color: black;
	}

	.glow-border {
		border: 3px solid var(--custom-green);
		border-radius: 10px;
		box-shadow: var(--custom-green) 0px 0px 10px;
	}

	.grow-animation {
		opacity: 0;
		width: 0;
		height: 0;
		animation-name: contentFadeIn;
		animation-duration: var(--content-animation-duration);
		animation-delay: var(--logo-animation-duration);
		animation-fill-mode: forwards;
		animation-timing-function: ease-in-out;
	}

	@keyframes contentFadeIn {
		0% {
			opacity: 0;
			padding: 0;
			width: 0;
			height: 0;
		}
		5% {
			opacity: 1;
			padding: 0;
			width: 0;
			height: 0;
		}
		100% {
			opacity: 1;
			padding: 1rem;
			width: calc(100vw - 40px - 4rem);
			height: 100%;
		}
	}

	.content {
		font-family: 'Science Gothic', 'Courier New', Courier, monospace;
		color: var(--font-green);
		font-size: 1.2em;
	}

	.content p {
		font-family: 'Science Gothic', 'Courier New', Courier, monospace;
		margin-bottom: 1rem;
	}
</style>
