<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { createSimonGameManager } from '$lib/managers/simon-game-manager.svelte';
	import { bandLabel } from '$lib/games/simon/difficulty';
	import type { PadId } from '$lib/games/simon/types';
	import Pad from './Pad.svelte';
	import AsciiBar from './AsciiBar.svelte';

	const game = createSimonGameManager();

	let nameField = $state('');

	const PAD_META: Record<PadId, { label: string; color: string; glow: string }> = {
		UP: { label: 'U', color: '#00cc00', glow: '#00ff41' },
		LEFT: { label: 'L', color: '#00cccc', glow: '#4dffff' },
		RIGHT: { label: 'R', color: '#cc4444', glow: '#ff6b6b' },
		DOWN: { label: 'D', color: '#ffb000', glow: '#ffd166' }
	};

	// Transmission framing lifted from `info.svelte` / the pygame port's BootSequence.
	const BOOT_LINES = [
		'+++ [ FEDERATIE TRANSMISSIE ONTVANGEN ] +++',
		'',
		'  KANAAL........: 07 / BEVEILIGD',
		'  PROTOCOL......: SIMON-4',
		'  STATUS........: SIGNAALTEST VEREIST',
		'',
		'  HERHAAL DE UITGEZONDEN SEQUENTIE.',
		'  DRIE OPEENVOLGENDE RONDES ONTGRENDELEN TOEGANG.',
		'',
		'+++ [ EINDE TRANSMISSIE ] +++'
	];
	const BOOT_CHAR_MS = 12;
	const BOOT_OFFSETS = (() => {
		let acc = 0;
		return BOOT_LINES.map((line) => {
			const start = acc;
			acc += line.length;
			return start;
		});
	})();

	const ERROR_MESSAGES: Record<string, string> = {
		'not-found': 'ONBEKEND PERSONAGE',
		'not-in-live-event': 'PERSONAGE NIET GEREGISTREERD VOOR LIVE EVENT',
		'no-live-event': 'GEEN ACTIEF EVENT',
		ambiguous: 'MEERDERE PERSONAGES GEVONDEN — KIES ER EEN',
		network: 'VERBINDING MISLUKT',
		internal: 'INTERNE FOUT'
	};

	let rafId = 0;
	let lastTime = 0;
	// Drives the `isLit()` check below — a pad's flash has an end time, not just an
	// on/off flag, so the template needs the current clock to know when it expired.
	let now = $state(0);

	function loop(time: number) {
		const delta = lastTime ? time - lastTime : 0;
		lastTime = time;
		now = time;
		game.tick(delta, time);
		rafId = requestAnimationFrame(loop);
	}

	onMount(() => {
		rafId = requestAnimationFrame(loop);
	});
	onDestroy(() => {
		if (rafId) cancelAnimationFrame(rafId);
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && game.state === 'login') {
			event.preventDefault();
			game.submitName(nameField);
			return;
		}
		game.handleKey(event.key, performance.now());
	}

	function submitName() {
		game.submitName(nameField);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Terra Prime // Simon</title>
</svelte:head>

<div class="terminal">
	<div class="scanlines"></div>

	{#if game.state === 'boot'}
		<section class="screen boot" onclick={() => game.skipBoot()} role="presentation">
			{#each BOOT_LINES as line, i (i)}
				{@const shown = Math.max(
					0,
					Math.min(line.length, Math.floor(game.stateElapsed / BOOT_CHAR_MS) - BOOT_OFFSETS[i])
				)}
				<p class="boot-line">{line.slice(0, shown)}</p>
			{/each}
			<p class="hint">druk op een toets om over te slaan</p>
		</section>
	{:else}
		<header class="hud">
			<span class="hud-item accent glow">SIMON</span>
			{#if game.character}
				<span class="hud-item">{game.character.name.toUpperCase()}</span>
				<span class="hud-item">{bandLabel(game.character.hackingXp)}</span>
				<span class="hud-item">
					STREEK <AsciiBar value={game.streak} max={game.winStreak} width={game.winStreak} />
				</span>
			{/if}
		</header>

		<section class="screen">
			{#if game.state === 'login'}
				<div class="panel">
					<h1 class="glow">TOEGANG TERMINAL</h1>
					<p class="label">voer personage naam in</p>
					<div class="field">
						<input
							bind:value={nameField}
							placeholder="_"
							maxlength="64"
							autocomplete="off"
							spellcheck="false"
						/>
					</div>
					<button class="btn" onclick={submitName} disabled={!nameField.trim()}>[ ENTER ]</button>
					{#if game.lookupError && game.lookupError !== 'ambiguous'}
						<p class="error">{ERROR_MESSAGES[game.lookupError] ?? game.lookupError}</p>
					{/if}
					{#if game.candidates.length > 0}
						<p class="error">{ERROR_MESSAGES.ambiguous}</p>
						<ul class="candidates">
							{#each game.candidates as candidate (candidate.id)}
								<li>
									<button class="btn" onclick={() => game.submitName(nameField, candidate.id)}>
										{candidate.name} ({candidate.ownerName})
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else if game.state === 'connecting'}
				<div class="panel"><p class="glow">VERBINDEN...</p></div>
			{:else if game.state === 'briefing' && game.character}
				<div class="panel">
					<h1 class="glow">DOELWIT GEVONDEN</h1>
					<p>{game.character.name} ({game.character.ownerName})</p>
					<p>{bandLabel(game.character.hackingXp)}</p>
					<p class="label">{game.sequenceLength} signalen per ronde &middot; 3 rondes op rij nodig</p>
					<button class="btn" onclick={() => game.startRun()}>[ ENTER ] START HACK</button>
				</div>
			{:else if game.state === 'win'}
				<div class="panel">
					<h1 class="glow">TOEGANG VERLEEND</h1>
					<p>{game.character?.name}</p>
					<button class="btn" onclick={() => game.restart()}>[ ENTER ] ANDER PERSONAGE</button>
				</div>
			{:else}
				<div class="pad-grid">
					<div class="pad-cell up">
						<Pad
							{...PAD_META.UP}
							lit={game.litPad === 'UP' && game.isLit(now)}
							onactivate={() => game.handlePad('UP', performance.now())}
						/>
					</div>
					<div class="pad-cell left">
						<Pad
							{...PAD_META.LEFT}
							lit={game.litPad === 'LEFT' && game.isLit(now)}
							onactivate={() => game.handlePad('LEFT', performance.now())}
						/>
					</div>
					<div class="pad-cell right">
						<Pad
							{...PAD_META.RIGHT}
							lit={game.litPad === 'RIGHT' && game.isLit(now)}
							onactivate={() => game.handlePad('RIGHT', performance.now())}
						/>
					</div>
					<div class="pad-cell down">
						<Pad
							{...PAD_META.DOWN}
							lit={game.litPad === 'DOWN' && game.isLit(now)}
							onactivate={() => game.handlePad('DOWN', performance.now())}
						/>
					</div>
				</div>

				<div class="status">
					{#if game.state === 'playback'}
						<p class="glow">UITZENDING...</p>
					{:else if game.state === 'input'}
						<AsciiBar value={game.inputRemaining} max={game.inputBudget} />
						<p class="label">herhaal {game.inputIndex} / {game.sequenceCount}   [u] [d] [l] [r]</p>
					{:else if game.state === 'round-clear'}
						<p class="glow">SIGNAAL BEVESTIGD</p>
					{:else if game.state === 'round-failed'}
						<p class="warning">SIGNAAL VERLOREN</p>
					{/if}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.terminal {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
		color: var(--color-main);
		font-family: var(--font-mono);
		overflow: hidden;
	}

	.scanlines {
		pointer-events: none;
		position: absolute;
		inset: 0;
		z-index: 10;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.15) 3px,
			rgba(0, 0, 0, 0.15) 4px
		);
	}

	.hud {
		display: flex;
		gap: 2em;
		padding: 1em 1.5em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.8em;
		border-bottom: 1px solid var(--border-color-dim);
	}

	.hud-item.accent {
		color: var(--color-accent);
		font-weight: bold;
	}

	.screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5em;
		padding: 2em;
		text-align: center;
	}

	.boot {
		align-items: flex-start;
		justify-content: center;
		cursor: pointer;
		font-size: 1em;
	}

	.boot-line {
		color: var(--color-accent);
		white-space: pre;
		min-height: 1.4em;
	}

	.hint {
		margin-top: 2em;
		color: var(--color-main-dim);
		opacity: 0.55;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.75em;
	}

	.glow {
		color: var(--color-accent);
		text-shadow:
			0 0 4px #00ff41,
			0 0 10px #00ff41,
			0 0 20px #003b00;
	}

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75em;
	}

	.label {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75em;
		color: var(--color-main-dim);
	}

	.field input {
		background: transparent;
		border: none;
		border-bottom: var(--border-width) solid var(--color-main-dim);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 1.4em;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.3em;
		width: min(60vw, 20em);
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.btn {
		font-family: var(--font-mono);
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 0.5em 1.2em;
		font-size: 0.9em;
		letter-spacing: 0.08em;
		cursor: pointer;
	}

	.btn:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.error {
		color: var(--color-warning);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.85em;
	}

	.candidates {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		list-style: none;
	}

	.warning {
		color: var(--color-warning);
		text-shadow: 0 0 6px color-mix(in srgb, var(--color-warning) 60%, transparent);
		font-size: 1.3em;
		letter-spacing: 0.06em;
	}

	.pad-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(90px, 130px));
		grid-template-rows: repeat(3, minmax(90px, 130px));
		gap: 1em;
	}

	.pad-cell.up {
		grid-column: 2;
		grid-row: 1;
	}
	.pad-cell.left {
		grid-column: 1;
		grid-row: 2;
	}
	.pad-cell.right {
		grid-column: 3;
		grid-row: 2;
	}
	.pad-cell.down {
		grid-column: 2;
		grid-row: 3;
	}

	.status {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		min-height: 3.5em;
	}
</style>
