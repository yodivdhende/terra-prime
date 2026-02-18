<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '$lib/assets/images/Logo.png';

	function postSubmit() {
		return () => {};
	}
</script>

<main>
	<img src={logo} alt="TerraPrime Logo" class="logo" />
	<div class="content">
		<section>
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
				<button>Verstuur</button>
			</form>
		</section>
	</div>
</main>

<style>
	:root {
		--logo-animation-duration: 6s;
		--content-animation-duration: 2s;
		--text-animation-duration: 1;
		--custom-green: #00aa00;
	}

	main {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: min-content 1fr;
		place-items: center;
		width: 100vw;
		height: 100vh;
		background-color: black;
		overflow-x: hidden;
		scrollbar-color: var(--custom-green) black;
	}

	.logo {
		margin-top: 20px;
		max-width: 80vw; 
		max-height: 80vh;
		margin-top: calc(50vh - min(20vw, 40vh));
		animation-name: logoFadeIn;
		animation-duration: var(--logo-animation-duration);
		animation-fill-mode: forwards;
		animation-timing-function: cubic-bezier(0.8, 0, 0.2, 1);
	}

	.content {
		opacity: 0;
		width: 0;
		max-width: 800px;
		border: 3px solid var(--custom-green);
		border-radius: 10px;
		padding: 0;
		box-shadow: var(--custom-green) 0px 0px 10px;
		overflow-x: none;
		word-wrap: none;
		background-color: black;
		animation-name: contentFadeIn;
		animation-duration: var(--content-animation-duration);
		animation-delay: var(--logo-animation-duration);
		animation-fill-mode: forwards;
		animation-timing-function: ease-in-out;
	}

	section {
		opacity: 0;
		color: var(--custom-green);
		font-size: 0;
		overflow-x: none;
		word-wrap: none;
		animation-name: textFadeIn;
		animation-duration: var(--text-animation-duration);
		animation-delay: calc(var(--logo-animation-duration) + var(--content-animation-duration));
		animation-fill-mode: forwards;
	}

	section p {
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

	@keyframes logoFadeIn {
		0% {
			opacity: 0;
			width:max-content;
			margin-top: calc(50vh - min(20vw, 40vh));
		}
		50% {
			opacity: 1;
			width:max-content;
			margin-top: calc(50vh - min(20vw, 40vh));
		}
		100% {
			opacity: 1;
			width: 500px;
			margin-top: 30px;
		}
	}

	@keyframes contentFadeIn {
		0% {
			opacity: 0;
			padding: 0;
			width: 0;
			height: 0;
			min-height: 100px;
		}
		5% {
			opacity: 1;
			padding: 0;
			width: 0;
			height: 0;
			min-height: 100px;
		}
		100% {
			opacity: 1;
			padding: 2rem;
			width: 100%;
			height: auto;
			min-height: 60vh;
		}
	}

	@keyframes textFadeIn {
		0% {
			opacity: 0;
			font-size: 0;
		}
		100% {
			opacity: 1;
			font-size: 1.5em;
		}
	}
</style>
