#include <screen.h>
#include <screens.h>
#include <character.h>
#include <gfx-draw.h>
#include <gfx-header.h>
#include <gfx-theme.h>
#include <globals.h>

/**
 * See `screen.h`.
 *
 * `screenShow()` paints the chrome before it lets the screen do anything, so a screen whose
 * `enter()` reads the SD card shows its frame and heading first and fills in a moment later,
 * rather than leaving the previous screen up for the length of a card read.
 */

static const Screen* current = NULL;

const Screen* screenCurrent()
{
    return current;
}

void screenShow(const Screen* screen)
{
    if (screen == NULL) return;
    current = screen;

    if (screen->showHeader) {
        drawFrame();
        // Dim and inert on Home itself: there is nowhere for it to go.
        headerDraw(currentCharacter.name.c_str(), screen != screenHome());
        drawHeading(screen->heading);
    } else {
        // Full-bleed: no frame and no header, so the screen owns all 320x240. It still starts from
        // a cleared panel, so a screen that wants another background only has to paint over it.
        tft.fillScreen(THEME_BG);
    }

    if (screen->enter != NULL) screen->enter();
    if (screen->draw != NULL) screen->draw();

    // The firmware had no runtime memory measurement at all before this. A screen change is the
    // moment worth sampling: it is where the old UI allocated an object tree and this one does not.
    Serial.printf("screen: %s, free heap %u\n",
                  screen->heading == NULL ? "(full bleed)" : screen->heading,
                  (unsigned)ESP.getFreeHeap());
}

void screenGoHome()
{
    screenShow(screenHome());
}

void screenHandleTouch(const TouchEvent& event)
{
    if (current == NULL) return;

    // The header gets first refusal. A home-button press must never also reach the screen under it.
    if (current->showHeader && headerHandleTouch(event)) return;
    if (current->touch != NULL) current->touch(event);
}

void screenTick()
{
    if (current == NULL || current->tick == NULL) return;
    current->tick();
}
