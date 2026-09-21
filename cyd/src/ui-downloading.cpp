#include <lvgl.h>
#include <ui/ui.h>

static int downloadBarValue = 0;
static lv_timer_t *downloadBarTimer;

static void set_downloadBar(lv_timer_t *timer) {
    lv_bar_set_range(ui_DownloadBar, 0, 300);
    downloadBarValue++;
    lv_bar_set_value(ui_DownloadBar, downloadBarValue, LV_ANIM_OFF);
    if(downloadBarValue >= 300){
        downloadBarValue = 0;
        lv_timer_del(downloadBarTimer);
        downloadBarTimer = NULL;

    }
}

void UiLoadingSetup(){
    _ui_screen_change(&ui_DownloadScreen, LV_SCR_LOAD_ANIM_NONE, 0, 0, &ui_DownloadScreen_screen_init);
    downloadBarTimer = lv_timer_create(set_downloadBar,10, NULL);
}
