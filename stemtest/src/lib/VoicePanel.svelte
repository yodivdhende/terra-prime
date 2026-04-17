<script lang="ts">
  import responses from './voice-responses.json';

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

  type RecordState = 'idle' | 'recording' | 'done';
  let recordState = $state<RecordState>(selectedAnswer !== null ? 'done' : 'idle');
  let seconds = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;
  let responseMessage = $state(selectedAnswer !== null ? responses[Math.floor(Math.random() * responses.length)] : '');

  function startRecording() {
    recordState = 'recording';
    seconds = 0;
    timer = setInterval(() => {
      seconds++;
    }, 1000);
  }

  function stopRecording() {
    if (timer) clearInterval(timer);
    timer = null;
    responseMessage = responses[Math.floor(Math.random() * responses.length)];
    recordState = 'done';
    onSelectAnswer(0);
  }

  $effect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }
</script>

<div class="content">
  <p class="question">{question.text}</p>

  <div class="recorder">
    {#if recordState === 'idle'}
      <p class="hint">// druk op de knop om een stem-bericht op te nemen</p>
      <button class="mic-btn" onclick={startRecording} aria-label="Start opname">
        <span class="mic-icon">◉</span>
        <span class="mic-label">[ OPNEMEN ]</span>
      </button>
    {/if}

    {#if recordState === 'recording'}
      <div class="recording-ui">
        <div class="waveform" aria-hidden="true">
          {#each Array(12) as _, i}
            <span class="bar" style="--i: {i}"></span>
          {/each}
        </div>
        <div class="timer">REC ● {formatTime(seconds)}</div>
        <button class="mic-btn stop" onclick={stopRecording} aria-label="Stop opname">
          <span class="mic-icon">■</span>
          <span class="mic-label">[ STOP ]</span>
        </button>
      </div>
    {/if}

    {#if recordState === 'done'}
      <div class="done-ui">
        <div class="done-header">
          <span class="done-icon">✓</span>
          <span class="done-label">STEM-BERICHT OPGESLAGEN</span>
          <button class="redo-btn" onclick={() => { recordState = 'idle'; seconds = 0; }} aria-label="Opnieuw opnemen">
            [ OPNIEUW ]
          </button>
        </div>
        <p class="response-msg"><span class="caption-label">TRANSCRIPTIE:</span> {responseMessage}</p>
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

  .recorder {
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

  .mic-btn {
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
    transition: background-color 0.15s, color 0.15s;
    letter-spacing: 0.05em;
  }

  .mic-btn:hover {
    background-color: var(--accent);
    color: black;
  }

  .mic-btn.stop {
    border-color: #ff4444;
    color: #ff4444;
  }

  .mic-btn.stop:hover {
    background-color: #ff4444;
    color: black;
  }

  .mic-icon {
    font-size: 1rem;
  }

  .recording-ui {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .waveform {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 2rem;
  }

  .bar {
    display: inline-block;
    width: 4px;
    background-color: var(--accent);
    border-radius: 2px;
    animation: wave 0.8s ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * 0.07s);
    min-height: 4px;
  }

  @keyframes wave {
    from { height: 4px; opacity: 0.4; }
    to { height: 28px; opacity: 1; }
  }

  .timer {
    color: #ff4444;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    animation: blink 1s step-start infinite;
  }

  @keyframes blink {
    50% { opacity: 0.4; }
  }

  .done-ui {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .done-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .response-msg {
    color: var(--text-muted);
    font-size: 0.8rem;
    margin: 0;
    font-style: italic;
  }

  .caption-label {
    font-style: normal;
    color: var(--accent);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    margin-right: 0.3rem;
  }

  .done-icon {
    color: var(--accent);
    font-size: 1.1rem;
  }

  .done-label {
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

  @media (max-width: 500px) {
    .content {
      padding: 1.25rem;
    }

    .question {
      font-size: 1rem;
    }
  }
</style>
