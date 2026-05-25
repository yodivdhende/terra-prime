<script lang="ts">
	import { enhance } from '$app/forms';
	import { isEmail, isNotEmptyString } from '$lib/validators/util-validations';
	import type { ActionResult } from '@sveltejs/kit';

	let { action = undefined }: { action?: string } = $props();

	let formData: {success?: boolean, error?:boolean} | undefined = $state();

	let formState: 'button' | 'form' | 'sended' = $state('button' as 'button' | 'form' | 'sended');
	let showButton = $derived(formState === 'button');
	let showForm = $derived(formState === 'form' && formData == null);
	let showMessage = $derived(formData != null);

	let buttonClass = $derived.by(() => (showButton ? 'collapseble open' : 'collapseble close'));
	let formClass = $derived.by(() => (showForm ? 'collapseble open' : 'collapseble close'));
	let messageClass = $derived.by(() => (showMessage ? 'collapseble open' : 'collapseble close'));

	let nameValue = $state(null);
	let emailValue = $state(null);

	let nameErrors = $derived.by(() => isNotEmptyString(nameValue));

	let emailErrors = $derived.by(() => isEmail(emailValue));

	let inputErrorMessages = $derived.by(() => {
		const errors = [] as string[];
		if (emailErrors.valid === false) {
			if ((emailErrors as any).isEmail === false) errors.push(`email: is geen heldig email adres`);
		}
		return errors;
	});

	let inputValid = $derived.by(() => {
		return nameErrors.valid && emailErrors.valid;
	});

	function setState(state: typeof formState) {
		formState = state;
	}

	function postSubmit() {
		return ({ result }: { result: ActionResult }) => {
			if (result.type !== 'success') return;
			if (result.data?.success) formData = { success: true };
			if (result.data?.error) formData = { error: result.data.error };
		};
	}
</script>

<main>
	<div class={buttonClass}>
		<button onclick={() => setState('form')}>Jouw plaats wacht in de Federatie!</button>
	</div>

	<form method="post" {action} use:enhance={postSubmit}>
		<div class={formClass}>
			<p>
				De Federatie organiseert een beperkte praktijktest ter evaluatie van operationele systemen
				en procedures binnen Terra Prime.
			</p>
			<p>
				Tijdens deze playtest worden verschillende elementen van de LARP-ervaring getest onder
				gecontroleerde omstandigheden. Deelnameplaatsen zijn beperkt. Het indienen van een aanvraag
				garandeert dan ook geen selectie.
			</p>
			<p>Geselecteerde kandidaten ontvangen verdere instructies via transmissie.</p>
			<div class="input">
				<label for="playtest-name">Naam:</label>
				<input type="text" id="playtest-name" name="playtest-name" bind:value={nameValue} />
				<label for="playtest-email">Email:</label>
				<input type="email" id="playtest-email" name="playtest-email" bind:value={emailValue} />
			</div>
			{#if inputValid === false}
				<div class="input-error">
					{#each inputErrorMessages as error}
						{error} <br />
					{/each}
				</div>
			{/if}
			<button disabled={!inputValid}>Verstuur kandidatuur</button>
		</div>
	</form>
	<div class={messageClass}>
		{#if formData?.error}
			<div class="input-error">
				{formData?.error}
			</div>
		{:else}
			<p>
				Hartelijk dank voor je interesse in onze praktijktest. We hebben je kandidatuur in goede
				orde ontvangen.
			</p>
			<p>
				Meer informatie over de selectie volgt spoedig via e-mail. Graag maken wij je er nogmaals op
				attent dat we wegens de grote belangstelling niet iedereen kunnen selecteren voor deelname
				aan deze testfase.
			</p>
		{/if}
	</div>
</main>

<style>
	main {
		margin-top: 1em;
		border-top: 1px solid var(--font-green);
		padding-top: 1em;
	}

	p {
		margin-bottom: 1em;
	}

	.input-error {
		color: #cc0000;
		font-weight: bold;
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
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr 1fr;
		row-gap: 0.8em;
		align-items: center;
		width: 90%;
		margin-bottom: 1em;
	}

	.input input {
		width: 90%;
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

	button:disabled {
		color: #444;
		border: 1px solid #444;
		background-color: #ccc;
	}
</style>
