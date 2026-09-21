#include <async-fetch.h>
#include <api.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

/** One per screen using this today (Expertise, Implants) — see `async-fetch.h`. */
#define MAX_IN_FLIGHT 2

/** Only ever read/written from the main loop: `asyncFetchStart` and `asyncFetchPoll` both run
 *  there, and the task itself never touches this table. */
static String inFlightPaths[MAX_IN_FLIGHT];
static bool inFlightUsed[MAX_IN_FLIGHT] = { false, false };

struct FetchResult {
    String* path;
    String* body;
};

static QueueHandle_t resultQueue = NULL;

static void fetchTask(void* param)
{
    String* path = (String*)param;
    String* body = new String(apiHttpGet(*path));

    FetchResult result = { path, body };
    xQueueSend(resultQueue, &result, portMAX_DELAY);
    vTaskDelete(NULL);
}

void asyncFetchStart(const String& path)
{
    for (int i = 0; i < MAX_IN_FLIGHT; i++) {
        if (inFlightUsed[i] && inFlightPaths[i] == path) return; // already in flight
    }

    int slot = -1;
    for (int i = 0; i < MAX_IN_FLIGHT; i++) {
        if (inFlightUsed[i] == false) { slot = i; break; }
    }
    if (slot < 0) return; // table full of other paths; try again next visit

    if (resultQueue == NULL) resultQueue = xQueueCreate(MAX_IN_FLIGHT, sizeof(FetchResult));

    inFlightUsed[slot] = true;
    inFlightPaths[slot] = path;

    String* heapPath = new String(path);
    // Pinned to core 0, away from the Arduino loop's core 1, so the blocking HTTP call in
    // `apiHttpGet()` can't delay `lv_timer_handler()`/touch reads even briefly.
    xTaskCreatePinnedToCore(fetchTask, "asyncFetch", 8192, heapPath, 1, NULL, 0);
}

bool asyncFetchPoll(String& outPath, String& outBody)
{
    if (resultQueue == NULL) return false;

    FetchResult result;
    if (xQueueReceive(resultQueue, &result, 0) != pdTRUE) return false;

    outPath = *result.path;
    outBody = *result.body;
    delete result.path;
    delete result.body;

    for (int i = 0; i < MAX_IN_FLIGHT; i++) {
        if (inFlightUsed[i] && inFlightPaths[i] == outPath) inFlightUsed[i] = false;
    }

    return true;
}
