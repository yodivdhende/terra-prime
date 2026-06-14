function createFeatureManager() {
  let loginEnabled = $state(false);
  let registerEnabled = $state(false);

  function setFlags(flags: { loginEnabled: boolean; registerEnabled: boolean }) {
    console.log('setFlags', flags);
    loginEnabled = flags.loginEnabled;
    registerEnabled = flags.registerEnabled;
  }

  return {
    get loginEnabled() { return loginEnabled; },
    get registerEnabled() { return registerEnabled; },
    setFlags,
  };
}

export const FEATURE_MANAGER = createFeatureManager();
