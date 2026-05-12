function createFeatureManager() {
  let loginEnabled = $state(false);

  function setFlags(flags: { loginEnabled: boolean }) {
    loginEnabled = flags.loginEnabled;
  }

  return {
    get loginEnabled() { return loginEnabled; },
    setFlags,
  };
}

export const FEATURE_MANAGER = createFeatureManager();
