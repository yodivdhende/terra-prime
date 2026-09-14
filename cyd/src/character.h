#ifndef CHARACTER_FUNC
#define CHARACTER_FUNC
    #include <Arduino.h>
    bool fetchCharacter();
    class Character {
    public:
        int id;
        String name;
        /** The character version this device is bound to — what every `api/my` read is about. */
        int versionId;
        String versionName;
    };

    extern Character currentCharacter;
#endif
