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
		<button  onclick={() => setState('form')}>Join de Federatie</button>
	</div>
	<div class={formClass}>
		<p>
			Met deze playtest houden we een korte play dag waar we verschillend elementen van onze larp
			willen uittesten. Plaatsen hiervoor zijn beperkt. Hierdoor kunnen we niet garanderen dat,
			wanneer je inschrijft, je zult deel nemen. Verdere infromatie volgt.
		</p>
		<div class="input">
			<label for="playtest-name">Naam:</label>
			<input type="text" id="playtest-name" name="playtest-name" value="Yodi" />
		</div>
		<div class="input">
			<label for="playtest-email">Email:</label>
			<input type="email" id="playtest-email" name="playtest-email" value="test@test.com" />
		</div>
		<button onclick={() => setState('sended')}>Verstuur aplicatie</button>
	</div>
	<div class={messageClass}>
		Bedankt voor de inschrijving. We zijn enorm dankbaar voor de intresse. Meer informatie volgt
		later via mail. Nogmaals willen we de nadrukt leggen dat niet iedereen die zich inschrijft zal
		kunnen deel nemen aan de playtest.
	</div>
</main>

<style>
	main {
		border-top: 1px solid green;
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
		0% { max-height: 0; }
		100% { max-height: 500px; }
	}

	@keyframes scrollClosed {
		0% { max-height: 500px; }
		100% { max-height: 0; }
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
