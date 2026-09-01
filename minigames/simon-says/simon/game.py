"""Simon Says state machine and main loop.

    BOOT -> READY -> PLAYBACK -> INPUT -> ROUND_CLEAR -> PLAYBACK
                                    \\-> GAME_OVER -> READY

All timing is derived from `pygame.time.get_ticks()` deltas; nothing sleeps, so the
window stays responsive and the loop can be stepped deterministically under test.
"""

from __future__ import annotations

import random
from enum import Enum, auto

import pygame

from . import crt, pads, scores, theme, widgets


class State(Enum):
    BOOT = auto()
    READY = auto()
    PLAYBACK = auto()
    INPUT = auto()
    ROUND_CLEAR = auto()
    GAME_OVER = auto()


# Letters are the documented controls; arrows are accepted as a silent alias.
KEY_MAP = {
    pygame.K_u: theme.UP,
    pygame.K_d: theme.DOWN,
    pygame.K_l: theme.LEFT,
    pygame.K_r: theme.RIGHT,
    pygame.K_UP: theme.UP,
    pygame.K_DOWN: theme.DOWN,
    pygame.K_LEFT: theme.LEFT,
    pygame.K_RIGHT: theme.RIGHT,
}

PAD_IDS = tuple(spec[0] for spec in theme.PAD_SPECS)


class Game:
    def __init__(self, rng: random.Random | None = None, skip_boot: bool = False) -> None:
        self.rng = rng or random.Random()
        self.pads = pads.build_pads((theme.WIDTH // 2, theme.HEIGHT // 2 + 10))
        self.boot = widgets.BootSequence()

        self.high_score = scores.load()
        self.sequence: list[str] = []
        self.round = 0
        self.score = 0
        self.input_index = 0

        self.state = State.READY if skip_boot else State.BOOT
        self.state_elapsed = 0.0
        self.playback_index = 0
        self.playback_timer = 0.0
        self.input_deadline = 0.0
        self.input_remaining = 0.0
        self.failed_pad: str | None = None
        self.running = True

    # --- state helpers -------------------------------------------------------

    def _enter(self, state: State) -> None:
        self.state = state
        self.state_elapsed = 0.0

    def start_run(self) -> None:
        """Begin a fresh run from round 1."""
        self.sequence = []
        self.round = 0
        self.score = 0
        self.failed_pad = None
        self.next_round()

    def next_round(self) -> None:
        self.sequence.append(self.rng.choice(PAD_IDS))
        self.round += 1
        self.playback_index = 0
        self.playback_timer = -theme.PLAYBACK_LEAD_IN
        self.input_index = 0
        self._enter(State.PLAYBACK)

    @property
    def playback_on_ms(self) -> int:
        """Playback gets faster each round, down to a floor so it stays playable."""
        return max(
            theme.PLAYBACK_ON_MIN,
            theme.PLAYBACK_ON_MAX - (self.round - 1) * theme.PLAYBACK_RAMP,
        )

    @property
    def input_budget_ms(self) -> float:
        return theme.INPUT_TIME_BASE + theme.INPUT_TIME_PER_STEP * len(self.sequence)

    def _fail(self, pad_id: str | None) -> None:
        self.failed_pad = pad_id
        if self.score > self.high_score:
            self.high_score = self.score
            scores.save(self.high_score)
        self._enter(State.GAME_OVER)

    # --- input ---------------------------------------------------------------

    def handle_key(self, key: int, now: int) -> None:
        if key == pygame.K_ESCAPE:
            self.running = False
            return

        if self.state is State.BOOT:
            self.boot.skip()
            return

        if self.state in (State.READY, State.GAME_OVER):
            # Ignore ENTER during the fail flash so a mashed key can't skip the feedback.
            if key in (pygame.K_RETURN, pygame.K_KP_ENTER, pygame.K_SPACE):
                if self.state is State.READY or self.state_elapsed >= theme.GAME_OVER_FLASH:
                    self.start_run()
            return

        if self.state is not State.INPUT:
            return

        pad_id = KEY_MAP.get(key)
        if pad_id is None:
            return

        self.pads[pad_id].light(now, theme.PLAYER_FLASH)

        if pad_id != self.sequence[self.input_index]:
            self._fail(pad_id)
            return

        self.input_index += 1
        self.score += 1

        if self.input_index >= len(self.sequence):
            if self.score > self.high_score:
                self.high_score = self.score
                scores.save(self.high_score)
            self._enter(State.ROUND_CLEAR)

    # --- update --------------------------------------------------------------

    def update(self, delta: float, now: int) -> None:
        self.state_elapsed += delta

        if self.state is State.BOOT:
            self.boot.update(delta)
            if self.boot.done:
                self._enter(State.READY)

        elif self.state is State.PLAYBACK:
            self._update_playback(delta, now)

        elif self.state is State.INPUT:
            self.input_remaining = max(0.0, self.input_deadline - self.state_elapsed)
            if self.input_remaining <= 0:
                self._fail(None)

        elif self.state is State.ROUND_CLEAR:
            if self.state_elapsed >= theme.ROUND_CLEAR_HOLD:
                self.next_round()

    def _update_playback(self, delta: float, now: int) -> None:
        on_ms = self.playback_on_ms
        step_ms = on_ms + on_ms * theme.PLAYBACK_GAP_RATIO

        self.playback_timer += delta
        while self.playback_timer >= 0 and self.playback_index < len(self.sequence):
            self.pads[self.sequence[self.playback_index]].light(now, on_ms)
            self.playback_index += 1
            self.playback_timer -= step_ms

        if self.playback_index >= len(self.sequence) and self.playback_timer >= 0:
            self.input_index = 0
            self.input_deadline = self.input_budget_ms
            self.input_remaining = self.input_budget_ms
            self._enter(State.INPUT)

    # --- drawing -------------------------------------------------------------

    def draw(self, surface: pygame.Surface, now: int) -> None:
        surface.fill(theme.BG)

        if self.state is State.BOOT:
            self.boot.draw(surface)
        else:
            self._draw_header(surface)
            for pad in self.pads.values():
                pads.draw_pad(surface, pad, now)
            self._draw_status(surface)

        if self.state is State.GAME_OVER and self.state_elapsed < theme.GAME_OVER_FLASH:
            flash = pygame.Surface((theme.WIDTH, theme.HEIGHT), pygame.SRCALPHA)
            fade = 1.0 - self.state_elapsed / theme.GAME_OVER_FLASH
            flash.fill((*theme.ERROR, int(110 * fade)))
            surface.blit(flash, (0, 0))

        surface.blit(crt.scanlines(surface.get_size()), (0, 0))

    def _draw_header(self, surface: pygame.Surface) -> None:
        widgets.draw_glow_line(
            surface,
            "S I M O N",
            (theme.WIDTH // 2, 58),
            theme.MAIN,
            theme.PHOSPHOR,
            size=theme.SIZE_TITLE,
        )
        widgets.draw_label(
            surface,
            "federatie signaaltest // protocol simon-4",
            (theme.WIDTH // 2, 98),
            theme.ACCENT,
            alpha=190,
        )

        widgets.draw_label(surface, f"ronde {self.round:02d}", (150, 128), theme.ACCENT)
        widgets.draw_label(surface, f"score {self.score:03d}", (theme.WIDTH // 2, 128), theme.MAIN_RESULT)
        widgets.draw_label(surface, f"record {self.high_score:03d}", (theme.WIDTH - 150, 128), theme.MAIN_DIM)

    def _draw_status(self, surface: pygame.Surface) -> None:
        y = theme.HEIGHT - 92

        if self.state is State.READY:
            widgets.draw_glow_line(
                surface, "SIGNAALTEST GEREED", (theme.WIDTH // 2, y), theme.ACCENT, theme.PHOSPHOR
            )
            widgets.draw_label(
                surface, "[enter] start   [esc] afsluiten", (theme.WIDTH // 2, y + 36), theme.MAIN_DIM
            )

        elif self.state is State.PLAYBACK:
            widgets.draw_glow_line(
                surface, "UITZENDING...", (theme.WIDTH // 2, y), theme.PHOSPHOR, theme.PHOSPHOR
            )
            widgets.draw_label(surface, "kijk mee", (theme.WIDTH // 2, y + 36), theme.MAIN_DIM, alpha=170)

        elif self.state is State.INPUT:
            widgets.draw_progress_bar(
                surface,
                (theme.WIDTH // 2, y),
                self.input_remaining,
                self.input_budget_ms,
                theme.ACCENT,
            )
            widgets.draw_label(
                surface,
                f"herhaal  {self.input_index} / {len(self.sequence)}   [u] [d] [l] [r]",
                (theme.WIDTH // 2, y + 36),
                theme.MAIN_DIM,
            )

        elif self.state is State.ROUND_CLEAR:
            widgets.draw_glow_line(
                surface, "SIGNAAL BEVESTIGD", (theme.WIDTH // 2, y), theme.ACCENT, theme.PHOSPHOR
            )
            widgets.draw_label(
                surface, f"ronde {self.round:02d} voltooid", (theme.WIDTH // 2, y + 36), theme.MAIN_DIM
            )

        elif self.state is State.GAME_OVER:
            widgets.draw_glow_line(
                surface, "SIGNAAL VERLOREN", (theme.WIDTH // 2, y), theme.WARNING, theme.WARNING
            )
            reason = "tijd verstreken" if self.failed_pad is None else "verkeerd signaal"
            widgets.draw_label(surface, reason, (theme.WIDTH // 2, y + 30), theme.WARNING, alpha=200)
            widgets.draw_label(
                surface, "[enter] opnieuw   [esc] afsluiten", (theme.WIDTH // 2, y + 58), theme.MAIN_DIM
            )


def run() -> None:
    pygame.init()
    pygame.display.set_caption(theme.CAPTION)
    screen = pygame.display.set_mode((theme.WIDTH, theme.HEIGHT))
    clock = pygame.time.Clock()
    game = Game()

    while game.running:
        delta = clock.tick(theme.FPS)
        now = pygame.time.get_ticks()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game.running = False
            elif event.type == pygame.KEYDOWN:
                game.handle_key(event.key, now)

        game.update(delta, now)
        game.draw(screen, now)
        pygame.display.flip()

    pygame.quit()
