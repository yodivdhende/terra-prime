<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '$lib/assets/images/Logo.png';
	import CodeScroller from '$lib/components/code-scroller.svelte';

	const logoAnimationDuration = 5;
	const contentAnimationDuration = 2;
	let startCode = $state(false);

	setTimeout(() => startCode = true , (logoAnimationDuration + contentAnimationDuration) * 1000);

	function postSubmit() {
		return () => {};
	}
</script>

<div class="code">
	<CodeScroller start={startCode} />
</div>
<img src={logo} alt="TerraPrime Logo" class="logo" style="--logo-animation-duration: {logoAnimationDuration}s"/>
<main>
	<section class="glow-border grow-animation" style="--content-animation-duration: {contentAnimationDuration}s">
		<div class="content">
			<p>Terra Prime is een gloednieuwe volwassenen-LARP onder DHvT.</p>
			<p>
				Stap in een futuristische wereld waar actie, samenwerking en verbeelding centraal staan.
				Samen met andere spelers en crew creëer je een meeslepend verhaal vol avontuur, spanning en
				humor !
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


			<form method="post" use:enhance={postSubmit}>
				<p>Deel namen met de playtest ?</p>
				<div class="input">
					<label for="playtest-name">Naam:</label>
					<input type="text" id="playtest-name" name="playtest-name" value="Yodi" />
				</div>
				<div class="input">
					<label for="playtest-email">Email:</label>
					<input type="email" id="playtest-email" name="playtest-email" value="test@test.com" />
				</div>
				<button>Join de Federatie</button>
			</form>
		</div>
	</section>
</main>

<style>
	:root {
		--logo-animation-duration: 5s;
		--content-animation-duration: 2s;
		--custom-green: #00aa00;
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

	main {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min(310px, 70vw) min-content;
		grid-template-areas: 
		"logo"
		"section";
		justify-items: center;
		align-items: start;
		width: 100vw;
		height: 100vh;
		background-color: black;
		overflow-x: hidden;
		scrollbar-color: var(--custom-green) black;
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
			top:50%;
			transform: translate(-50%, -50%);
		}
		50% {
			opacity: 1;
			max-width: 80vw;
			max-height: 80vh;
			top:50%;
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
		color: var(--custom-green);
		font-family: 1.2em;
	}

	.content p {
		margin-bottom: 1rem;
	}

	.input {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.input input {
		width: 100%;
		margin-left: 0.5em;
		border: 0;
		border-bottom: 2px solid var(--custom-green);
		outline: none;
		font-size: 1.2em;
		color: var(--custom-green);
		background-color: black;
	}

	button {
		margin-top: 1em;
		padding: 0.5em 1em;
		border: 2px solid var(--custom-green);
		border-radius: 5px;
		font-size: 1em;
		color: var(--custom-green);
		background-color: black;
		cursor: pointer;
	}

	button:active {
		background-color: var(--custom-green);
		color: black;
	}

</style>
