SET(SOURCES ui_comp_header.c
    ui_comp.c
    ui_Home.c
    ui_DownloadScreen.c
    ui_LootScreen.c
    ui_VirusScreen.c
    ui_Expertise.c
    ui_Implants.c
    ui_Messages.c
    ui.c
    ui_comp_hook.c
    ui_helpers.c
    ui_img_wifi_png.c
    ui_img_53718616.c
    ui_img_house_sm_png.c
    ui_img_user_png.c
    ui_img_1577569611.c
    ui_img_9038990.c)

add_library(ui ${SOURCES})
