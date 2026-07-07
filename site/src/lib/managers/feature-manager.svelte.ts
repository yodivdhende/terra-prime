function createFeatureManager() {
  let loginEnabled = $state(false);
  let registerEnabled = $state(false);
  let backstoryEnabled = $state(false);

  function setFlags(flags: { loginEnabled: boolean; registerEnabled: boolean; backstoryEnabled: boolean }) {
    loginEnabled = flags.loginEnabled;
    registerEnabled = flags.registerEnabled;
    backstoryEnabled = flags.backstoryEnabled;
  }

  return {
    get loginEnabled() { return loginEnabled; },
    get registerEnabled() { return registerEnabled; },
    get backstoryEnabled() { return backstoryEnabled; },
    setFlags,
  };
}

export const FEATURE_MANAGER = createFeatureManager();
