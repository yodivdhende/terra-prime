<script lang="ts">
  import animals from "./camera-animals.json";

  type Answer = -2 | -1 | 0 | 1 | 2;

  let {
    question,
    selectedAnswer,
    onSelectAnswer,
  }: {
    question: { text: string };
    selectedAnswer: Answer | null;
    onSelectAnswer: (value: Answer) => void;
  } = $props();

  type ScanState = "idle" | "scanning" | "done";

  const getRandomAnimal = () =>
    animals[Math.floor(Math.random() * animals.length)];

  let scanState = $state<ScanState>(selectedAnswer !== null ? "done" : "idle");
  let scanProgress = $state(0);
  let animal = $state(
    selectedAnswer !== null
      ? getRandomAnimal()
      : (null as (typeof animals)[0] | null),
  );
  let scanTimeout: ReturnType<typeof setTimeout> | null = null;
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  function startScan() {
    scanState = "scanning";
    scanProgress = 0;

    progressInterval = setInterval(() => {
      scanProgress = Math.min(scanProgress + 2, 100);
    }, 50);

    scanTimeout = setTimeout(() => {
      if (progressInterval) clearInterval(progressInterval);
      progressInterval = null;
      scanProgress = 100;
      animal = getRandomAnimal();
      scanState = "done";
      onSelectAnswer(0);
    }, 2600);
  }

  function resetScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    if (progressInterval) clearInterval(progressInterval);
    scanTimeout = null;
    progressInterval = null;
    scanState = "idle";
    scanProgress = 0;
    animal = null;
  }

  $effect(() => {
    return () => {
      if (scanTimeout) clearTimeout(scanTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  });
</script>

<div class="content">
  <p class="question">{question.text}</p>

  <div class="scanner">
    {#if scanState === "idle"}
      <p class="hint">
        // richt de lens op het onderwerp en activeer de biometrische scan
      </p>
      <button class="scan-btn" onclick={startScan} aria-label="Start scan">
        <span class="scan-icon">◉</span>
        <span class="scan-label">[ SCAN ]</span>
      </button>
    {/if}

    {#if scanState === "scanning"}
      <div class="scanning-ui">
        <div class="scan-lines" aria-hidden="true">
          {#each Array(8) as _, i}
            <div class="scan-line" style="--i: {i}"></div>
          {/each}
        </div>
        <div class="progress-wrap">
          <div class="progress-bar" style="width: {scanProgress}%"></div>
        </div>
        <div class="scan-status">ANALYSEREN... {scanProgress}%</div>
      </div>
    {/if}

    {#if scanState === "done" && animal}
      <div class="result-ui">
        <div class="result-header">
          <span class="result-icon">✓</span>
          <span class="result-label">BIOMETRISCHE SCAN VOLTOOID</span>
          <button
            class="redo-btn"
            onclick={resetScan}
            aria-label="Opnieuw scannen"
          >
            [ OPNIEUW ]
          </button>
        </div>
        <div class="ascii-box">
          <pre class="ascii-art">{animal.art}</pre>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .content {
    padding: 2rem;
  }

  .question {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    color: white;
  }

  .scanner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }

  .hint {
    color: var(--text-muted);
    font-size: 0.8rem;
    margin: 0;
  }

  .scan-btn {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    font-family: "Courier New", Courier, monospace;
    font-size: 0.9rem;
    padding: 0.6rem 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-radius: 3px;
    transition:
      background-color 0.15s,
      color 0.15s;
    letter-spacing: 0.05em;
  }

  .scan-btn:hover {
    background-color: var(--accent);
    color: black;
  }

  .scan-icon {
    font-size: 1rem;
  }

  .scanning-ui {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 320px;
  }

  .scan-lines {
    display: flex;
    flex-direction: column;
    gap: 3px;
    height: 3.5rem;
    overflow: hidden;
  }

  .scan-line {
    height: 3px;
    background-color: var(--accent);
    border-radius: 1px;
    opacity: 0;
    animation: scanline 1.2s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.15s);
  }

  @keyframes scanline {
    0% {
      opacity: 0;
      transform: scaleX(0.3);
    }
    40% {
      opacity: 0.9;
      transform: scaleX(1);
    }
    100% {
      opacity: 0;
      transform: scaleX(0.6);
    }
  }

  .progress-wrap {
    width: 100%;
    height: 4px;
    background-color: #111;
    border: 1px solid #333;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background-color: var(--accent);
    transition: width 0.05s linear;
    box-shadow: 0 0 6px var(--accent);
  }

  .scan-status {
    color: var(--accent);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    animation: blink 1s step-start infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0.4;
    }
  }

  .result-ui {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .result-icon {
    color: var(--accent);
    font-size: 1.1rem;
  }

  .result-label {
    color: var(--accent);
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }

  .redo-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-family: "Courier New", Courier, monospace;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    letter-spacing: 0.05em;
  }

  .redo-btn:hover {
    color: white;
  }

  .ascii-box {
    border: 1px solid #333;
    border-left: 2px solid var(--accent);
    padding: 1rem 1.25rem;
    background-color: #090909;
  }

  .ascii-art {
    margin: 0;
    font-family: "Courier New", Courier, monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--accent);
    white-space: pre;
    text-shadow: 0 0 8px var(--accent);
  }

  .species-label {
    color: var(--text-muted);
    font-size: 0.8rem;
    margin: 0;
  }

  .label-tag {
    color: var(--accent);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    margin-right: 0.3rem;
  }

  @media (max-width: 500px) {
    .content {
      padding: 1.25rem;
    }

    .question {
      font-size: 1rem;
    }
  }
</style>
