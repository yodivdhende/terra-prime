<script lang="ts">
	let isFormVisable = $state(false);

	function showForm() {
		isFormVisable = true;
	}

</script>

<main>
	{#if isFormVisable === false}
		<button onclick={showForm}>Join de Federatie</button>
	{/if}
	{#if isFormVisable}
        <div class="form">
			<div class="input">
				<label for="playtest-name">Naam:</label>
				<input type="text" id="playtest-name" name="playtest-name" value="Yodi" />
			</div>
			<div class="input">
				<label for="playtest-email">Email:</label>
				<input type="email" id="playtest-email" name="playtest-email" value="test@test.com" />
			</div>
			<button>Verstuur aplicatie</button>
        </div>
	{/if}
</main>

<style>

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
