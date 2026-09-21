// Arduino-TFT_eSPI board-template main routine. There's a TFT_eSPI create+flush driver already in LVGL-9.1 but we create our own here for more control (like e.g. 16-bit color swap).

#include <lvgl.h>
#include <TFT_eSPI.h>
#include <ui/ui.h>
#include <globals.h>
#include <character.h>
#include <log.h>
#include <cache.h>
#include <async-fetch.h>
#include <ui-expertise.h>
#include <ui-implants.h>
#include <XPT2046_Touchscreen.h>

/*Don't forget to set Sketchbook location in File/Preferences to the path of your UI project (the parent foder of this INO file)*/
const uint16_t screenWidth  = 320;
const uint16_t screenHeight = 240;

/*Loading sreen*/




/*Change to your screen resolution*/
enum
{
    SCREENBUFFER_SIZE_PIXELS = screenWidth * screenHeight / 10
};
static lv_color_t buf[SCREENBUFFER_SIZE_PIXELS];

uint16_t touchScreenMinimumX = 200, touchScreenMaximumX = 3700, touchScreenMinimumY = 240,touchScreenMaximumY = 3800; //Chạy Calibration để lấy giá trị mỗi màn hình mỗi khácj

#if LV_USE_LOG != 0
/* Serial debugging */
void my_print(const char *buf)
{
    Serial.printf(buf);
    Serial.flush();
}
#endif

/* Display flushing */
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *pixelmap)
{
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    if (LV_COLOR_16_SWAP)
    {
        size_t len = lv_area_get_size(area);
        lv_draw_sw_rgb565_swap(pixelmap, len);
    }

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)pixelmap, w * h, true);
    tft.endWrite();

    lv_disp_flush_ready(disp);
}

/*Read the touchpad*/
void my_touchpad_read(lv_indev_t *indev_driver, lv_indev_data_t *data)
{
    if (ts.touched())
    {
        TS_Point p = ts.getPoint();
        // Some very basic auto calibration so it doesn't go out of range
        if (p.x < touchScreenMinimumX)
            touchScreenMinimumX = p.x;
        if (p.x > touchScreenMaximumX)
            touchScreenMaximumX = p.x;
        if (p.y < touchScreenMinimumY)
            touchScreenMinimumY = p.y;
        if (p.y > touchScreenMaximumY)
            touchScreenMaximumY = p.y;
        // Map this to the pixel position
        data->point.x = map(p.x, touchScreenMinimumX, touchScreenMaximumX, 1, screenWidth);  /* Touchscreen X calibration */
        data->point.y = map(p.y, touchScreenMinimumY, touchScreenMaximumY, 1, screenHeight); /* Touchscreen Y calibration */
        data->state = LV_INDEV_STATE_PR;

        // Serial.print( "Touch x " );
        // Serial.print( data->point.x );
        // Serial.print( " y " );
        // Serial.println( data->point.y );
    }
    else
    {
        data->state = LV_INDEV_STATE_REL;
    }
}

/*Set tick routine needed for LVGL internal timings*/
static uint32_t my_tick_get_cb(void) { return millis(); }

void uiSetup()
{
    String LVGL_Arduino = "Hello Arduino! ";
    LVGL_Arduino += String('V') + lv_version_major() + "." + lv_version_minor() + "." + lv_version_patch();

    Serial.println(LVGL_Arduino);
    Serial.println("I am LVGL_Arduino");

    lv_init();
#if LV_USE_LOG != 0
    lv_log_register_print_cb(my_print); /* register print function for debugging */
#endif

    // LVGL owns the display from here: raw writes have to stop, and the panel turns from the
    // portrait the boot screen used to the landscape every game screen is designed for.
    logSetTftEnabled(false);
    tft.setRotation(1); /* Landscape orientation, flipped */

    static lv_disp_t *disp;
    disp = lv_display_create(screenWidth, screenHeight);
    lv_display_set_buffers(disp, buf, NULL, SCREENBUFFER_SIZE_PIXELS * sizeof(lv_color_t), LV_DISPLAY_RENDER_MODE_PARTIAL);
    lv_display_set_flush_cb(disp, my_disp_flush);

    // setupSD() steals the touch controller's VSPI pins during boot (see the shared-VSPI gotcha
    // in CLAUDE.md) — reclaim them now, before LVGL starts reading touch, or nothing on any
    // screen responds to a tap.
    reattachTouch();

    static lv_indev_t *indev;
    indev = lv_indev_create();
    lv_indev_set_type(indev, LV_INDEV_TYPE_POINTER);
    lv_indev_set_read_cb(indev, my_touchpad_read);

    lv_tick_set_cb(my_tick_get_cb);

    ui_init();

    // SquareLine marks these icon images clickable, so LVGL's hit-test resolves a tap on the
    // icon to the image (the topmost clickable object under the finger) instead of the button
    // beneath it. The image has no event callback and doesn't bubble, so the icon itself eats
    // the touch and only the button's uncovered edge responds. Can't fix this in the .spj
    // without losing it on the next export, so it's cleared here instead.
    lv_obj_remove_flag(ui_ExpertiseButtonImage, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_remove_flag(ui_ImplantButtonImage, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_remove_flag(ui_MessagesButtonImage, LV_OBJ_FLAG_CLICKABLE);

    // Screen contents that come from the API live outside the generated `ui/`, and are wired up
    // once the generated objects exist.
    uiExpertiseInit();
    uiImplantsInit();

    // The generated header ships with a placeholder label; fill it in from the character fetched
    // at boot rather than editing generated code.
    lv_obj_t * homeNameLabel = ui_comp_get_child(ui_Header, UI_COMP_HEADER_NAMELABEL);
    lv_label_set_text(homeNameLabel, currentCharacter.name.c_str());

    Serial.println("Setup done");
}

void uiLoop()
{
    lv_timer_handler(); /* let the GUI do its work */

    // The only place a background `async-fetch` result is drained: writing it to the SD cache and
    // touching the screens it belongs to both have to happen from the main loop, the one thread
    // allowed near the SD card and touch controller's shared VSPI bus (see `async-fetch.h`).
    String path, body;
    if (asyncFetchPoll(path, body)) {
        if (body != "") cacheWrite(path, body, currentCharacter.versionId);
        if (path == "my/expertise") uiExpertiseApplyFetch(body);
        else if (path == "my/implants") uiImplantsApplyFetch(body);
    }

    delay(5);
}
