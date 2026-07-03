<script lang="ts">
  type Answer = -2 | -1 | 0 | 1 | 2;

  let {
    question,
    selectedAnswer,
    answers,
    onSelectAnswer,
  }: {
    question: { text: string };
    selectedAnswer: Answer | null;
    answers: { label: string; value: Answer }[];
    onSelectAnswer: (value: Answer) => void;
  } = $props();
</script>

<div class="content">
  <p class="question">{question.text}</p>
  <div class="answers">
    {#each answers as opt, i}
      <button
        class="answer-btn"
        class:selected={selectedAnswer === opt.value}
        onclick={() => onSelectAnswer(opt.value)}
      >
        <!-- onfocus={() => onSelectAnswer(opt.value)} -->
        <span class="cursor">&gt;</span><span class="num">{i + 1}.</span>
        {opt.label}
      </button>
    {/each}
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

  .answers {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .answer-btn {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-dim);
    font-family: "Courier New", Courier, monospace;
    font-size: 0.9rem;
    padding: 0.3rem 0;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: color 0.1s;
  }

  .answer-btn .cursor {
    display: inline-block;
    width: 1.2em;
    color: var(--accent);
    opacity: 0;
    transition: opacity 0.1s;
  }

  .answer-btn.selected .cursor {
    opacity: 1;
  }

  .answer-btn .num {
    display: inline-block;
    width: 1.5em;
    color: var(--text-muted);
    transition: color 0.1s;
  }

  .answer-btn:hover,
  .answer-btn:focus-visible {
    color: white;
  }

  .answer-btn:hover .num,
  .answer-btn:focus-visible .num {
    color: var(--accent);
  }

  .answer-btn.selected {
    color: var(--accent);
  }

  .answer-btn.selected .num {
    color: var(--accent);
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
