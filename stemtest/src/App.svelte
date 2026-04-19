<script lang="ts">
  import "./lib/reset.css";
  import "./lib/stemtest.css";
  import IntroPanel from "./lib/IntroPanel.svelte";
  import QuizPanel from "./lib/QuizPanel.svelte";
  import CameraPanel from "./lib/CameraPanel.svelte";
  import QuizPanelFooter from "./lib/QuizPanelFooter.svelte";
  import QuizPanelFrame from "./lib/QuizPanelFrame.svelte";
  import ResultPanel from "./lib/ResultPanel.svelte";
  import { Quiz, ANSWERS } from "./lib/Quiz.svelte.ts";

  const quiz = new Quiz();

  const answerValues = ANSWERS.map((a) => a.value);

  $effect(() => {
    window.addEventListener("keydown", handleKeydown, true);
    return () => window.removeEventListener("keydown", handleKeydown, true);
  });

  function handleKeydown(e: KeyboardEvent) {
    console.log("handleKeydown: ", e);
    if (quiz.phase === "intro") {
      if (e.key === "Enter") quiz.start();
      return;
    }

    if (quiz.phase === "result") {
      if (e.key === "Enter" || e.key === "Escape") quiz.restart();
      return;
    }

    if (quiz.phase === "quiz") {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIdx =
          quiz.selectedAnswer === null
            ? -1
            : answerValues.indexOf(quiz.selectedAnswer);
        if (e.key === "ArrowUp") {
          quiz.selectAnswer(answerValues[Math.max(0, currentIdx - 1)]);
        } else {
          quiz.selectAnswer(
            answerValues[Math.min(answerValues.length - 1, currentIdx + 1)],
          );
        }
      } else if (e.key === "Enter") {
        quiz.next();
      } else if (e.key === "Escape") {
        quiz.prev();
      } else {
        const match = e.code.match(/^(?:Digit|Numpad)([1-5])$/);
        if (match) quiz.selectAnswer(ANSWERS[parseInt(match[1]) - 1].value);
      }
    }
  }
</script>

<main>
  {#if quiz.phase === "intro"}
    <IntroPanel onStart={() => quiz.start()} />
  {/if}

  {#if quiz.phase === "quiz" && quiz.currentQuestion}
    <QuizPanelFrame
      currentIndex={quiz.currentIndex}
      quizSize={quiz.quizSize}
      progress={quiz.progress}
    >
      {#if quiz.currentQuestion.type === 'camera'}
        <CameraPanel
          question={quiz.currentQuestion}
          selectedAnswer={quiz.selectedAnswer}
          onSelectAnswer={(v) => quiz.selectAnswer(v)}
        />
      {:else}
        <QuizPanel
          question={quiz.currentQuestion}
          selectedAnswer={quiz.selectedAnswer}
          answers={quiz.answers}
          onSelectAnswer={(v) => quiz.selectAnswer(v)}
        />
      {/if}
      <QuizPanelFooter
        currentIndex={quiz.currentIndex}
        quizSize={quiz.quizSize}
        selectedAnswer={quiz.selectedAnswer}
        canProceed={quiz.selectedAnswer !== null}
        onNext={() => quiz.next()}
        onPrev={() => quiz.prev()}
      />
    </QuizPanelFrame>
  {/if}

  {#if quiz.phase === "result" && quiz.resultCompany}
    <ResultPanel
      company={quiz.resultCompany}
      onRestart={() => quiz.restart()}
    />
  {/if}
</main>

<style>
  main {
    width: 100vw;
    min-height: 100vh;
    background-color: black;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Courier New", Courier, monospace;
    color: white;
    padding: 2rem 1rem;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  main::before {
    content: "";
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.18) 2px,
      rgba(0, 0, 0, 0.18) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  main::after {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(0, 0, 0, 0.55) 100%
    );
    pointer-events: none;
    z-index: 9998;
  }
</style>
