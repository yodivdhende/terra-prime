#include <screens.h>
#include <gfx-draw.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * Home: three full-width outline buttons in the codex `.btn` idiom.
 *
 * Replaces SquareLine's 70x70 icon grid, and with it the five 48x48 embedded images it drew from —
 * about 34 KB of flash rodata for three labels that read better as text anyway. The character name
 * moved to the shared header, so the content area carries nothing but the buttons.
 */

#define HOME_BUTTON_COUNT 3
#define HOME_BUTTON_H 40
#define HOME_BUTTON_GAP 12
#define HOME_BUTTON_INSET 16

static const char* const BUTTON_LABELS[HOME_BUTTON_COUNT] = {"Expertise", "Implants", "Messages"};

/** Which button the finger is currently down on, or -1. */
static int pressedButton = -1;

static Rect buttonRect(int index)
{
    const int16_t stack = HOME_BUTTON_COUNT * HOME_BUTTON_H + (HOME_BUTTON_COUNT - 1) * HOME_BUTTON_GAP;
    const int16_t top = THEME_CONTENT_Y + (THEME_CONTENT_H - stack) / 2;
    const Rect rect = {
        (int16_t)(THEME_CONTENT_X + HOME_BUTTON_INSET),
        (int16_t)(top + index * (HOME_BUTTON_H + HOME_BUTTON_GAP)),
        (int16_t)(THEME_CONTENT_W - 2 * HOME_BUTTON_INSET),
        HOME_BUTTON_H
    };
    return rect;
}

static const Screen* buttonTarget(int index)
{
    switch (index) {
        case 0: return screenExpertise();
        case 1: return screenImplants();
        default: return screenMessages();
    }
}

static void homeDraw()
{
    clearBand(THEME_CONTENT_Y, THEME_CONTENT_H);
    for (int index = 0; index < HOME_BUTTON_COUNT; index++) {
        drawButton(buttonRect(index), BUTTON_LABELS[index], index == pressedButton);
    }
}

static int buttonAt(int16_t x, int16_t y)
{
    for (int index = 0; index < HOME_BUTTON_COUNT; index++) {
        if (rectContains(buttonRect(index), x, y)) return index;
    }
    return -1;
}

static void setPressed(int index)
{
    if (index == pressedButton) return;
    const int previous = pressedButton;
    pressedButton = index;
    if (previous >= 0) drawButton(buttonRect(previous), BUTTON_LABELS[previous], false);
    if (index >= 0) drawButton(buttonRect(index), BUTTON_LABELS[index], true);
}

static bool homeTouch(const TouchEvent& event)
{
    switch (event.kind) {
        case TOUCH_DOWN:
            setPressed(buttonAt(event.x, event.y));
            return pressedButton >= 0;

        case TOUCH_MOVE:
            if (pressedButton < 0) return false;
            // A finger that slides off the button it went down on cancels the press.
            if (buttonAt(event.x, event.y) != pressedButton) setPressed(-1);
            return true;

        case TOUCH_UP: {
            const int index = pressedButton;
            setPressed(-1);
            if (index < 0 || buttonAt(event.x, event.y) != index) return false;
            screenShow(buttonTarget(index));
            return true;
        }
    }
    return false;
}

static void homeEnter()
{
    pressedButton = -1;
}

const Screen* screenHome()
{
    static const Screen screen = {"Home", true, homeEnter, homeDraw, NULL, homeTouch};
    return &screen;
}
