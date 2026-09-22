#include <screens.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * The loading screen an admin pushes over the WebSocket: a bar that fills once and stops.
 *
 * The animation used to be an `lv_timer` firing every 10ms; it is driven from `tick()` now, off the
 * same `millis()` the rest of the firmware runs on. Each step repaints the bar alone — a 314x18
 * rectangle — so a three-second animation costs three hundred small writes rather than three
 * hundred panel repaints.
 */

/** Steps from empty to full, and the interval between them — the LVGL timer's own numbers. */
#define LOADING_STEPS 300
#define LOADING_STEP_MS 10

#define LOADING_BAR_H 18
#define LOADING_BAR_INSET 16

static int value = 0;
static uint32_t lastStepAt = 0;

static Rect barRect()
{
    const Rect rect = {
        (int16_t)(THEME_CONTENT_X + LOADING_BAR_INSET),
        (int16_t)(THEME_CONTENT_Y + (THEME_CONTENT_H - LOADING_BAR_H) / 2),
        (int16_t)(THEME_CONTENT_W - 2 * LOADING_BAR_INSET),
        LOADING_BAR_H
    };
    return rect;
}

static void drawBarOnly()
{
    const Rect rect = barRect();
    drawBar(rect.x, rect.y, rect.w, rect.h, value, LOADING_STEPS, THEME_ACCENT);
}

static void loadingEnter()
{
    value = 0;
    lastStepAt = millis();
}

static void loadingDraw()
{
    clearBand(THEME_CONTENT_Y, THEME_CONTENT_H);
    drawBarOnly();
}

static void loadingTick()
{
    if (value >= LOADING_STEPS) return;
    if (millis() - lastStepAt < LOADING_STEP_MS) return;
    lastStepAt = millis();
    value++;
    drawBarOnly();
}

const Screen* screenLoading()
{
    static const Screen screen = {
        "Downloading", true, loadingEnter, loadingDraw, loadingTick, NULL
    };
    return &screen;
}

void UiLoadingSetup()
{
    screenShow(screenLoading());
}
