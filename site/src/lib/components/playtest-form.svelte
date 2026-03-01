<script lang="ts">
	let formState: 'button' | 'form' | 'sended' = $state('button');
	let showButton = $derived(formState === 'button');
	let showForm = $derived(formState === 'form');
	let showMessage = $derived(formState === 'sended');

	let buttonClass = $derived.by(() => (showButton ? 'collapseble open' : 'collapseble close'));
	let formClass = $derived.by(() => (showForm ? 'collapseble open' : 'collapseble close'));
	let messageClass = $derived.by(() => (showMessage ? 'collapseble open' : 'collapseble close'));

	function setState(state: typeof formState) {
		formState = state;
	}
</script>

<main>
	<div class={buttonClass}>
		<button onclick={() => setState('form')}>Jouw plaats wacht in de Federatie!</button>
	</div>
	<div class={formClass}>
		<p>
			De Federatie organiseert een beperkte praktijktest ter evaluatie van operationele systemen en
			procedures binnen Terra Prime.<br />
			Tijdens deze playtest worden verschillende elementen van de LARP-ervaring getest onder gecontroleerde
			omstandigheden. Deelnameplaatsen zijn beperkt. Het indienen van een aanvraag garandeert dan ook
			geen selectie.<br />
			Geselecteerde kandidaten ontvangen verdere instructies via transmissie.
		</p>
		<div class="input">
			<label for="playtest-name">Naam:</label>
			<input type="text" id="playtest-name" name="playtest-name" value="Yodi" />
		</div>
		<div class="input">
			<label for="playtest-email">Email:</label>
			<input type="email" id="playtest-email" name="playtest-email" value="test@test.com" />
		</div>
		<button onclick={() => setState('sended')}>Verstuur kandidatuur</button>
	</div>
	<div class={messageClass}>
		Hartelijk dank voor je interesse in onze praktijktest. We hebben je kandidatuur in goede orde
		ontvangen.<br />
		Meer informatie over de selectie volgt spoedig via e-mail. Graag maken wij je er nogmaals op attent
		dat we wegens de grote belangstelling niet iedereen kunnen selecteren voor deelname aan deze testfase.
	</div>
</main>

<style>
	main {
		margin-top: 1em;
		border-top: 1px solid var(--font-green);
		padding-top: 1em;
	}

	.collapseble {
		max-height: 0;
		overflow: hidden;
	}

	.open {
		animation: 1s 1.1s forwards scrollOpen;
	}

	.close {
		animation: 1s forwards scrollClosed;
	}

	@keyframes scrollOpen {
		0% {
			max-height: 0;
		}
		100% {
			max-height: 500px;
		}
	}

	@keyframes scrollClosed {
		0% {
			max-height: 500px;
		}
		100% {
			max-height: 0;
		}
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
		color: var(--font-green);
		background-color: black;
	}

	button {
		margin-top: 1em;
		padding: 0.5em 1em;
		border: 2px solid var(--custom-green);
		border-radius: 5px;
		font-size: 1em;
		color: var(--font-green);
		background-color: black;
		cursor: pointer;
	}

	button:active {
		background-color: var(--custom-green);
		color: black;
	}
</style>
