#include <lvgl.h>
#include <ui/ui.h>

void UiLootSetup()
{
    _ui_screen_change(&ui_LootScreen, LV_SCR_LOAD_ANIM_NONE, 0, 0, &ui_LootScreen_screen_init);
}