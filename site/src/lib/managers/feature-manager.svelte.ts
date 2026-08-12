function createFeatureManager() {
  let loginEnabled = $state(false);
  let registerEnabled = $state(false);
  let backstoryEnabled = $state(false);
  let couponsEnabled = $state(false);

  function setFlags(flags: { loginEnabled: boolean; registerEnabled: boolean; backstoryEnabled: boolean; couponsEnabled: boolean }) {
    loginEnabled = flags.loginEnabled;
    registerEnabled = flags.registerEnabled;
    backstoryEnabled = flags.backstoryEnabled;
    couponsEnabled = flags.couponsEnabled;
  }

  return {
    get loginEnabled() { return loginEnabled; },
    get registerEnabled() { return registerEnabled; },
    get backstoryEnabled() { return backstoryEnabled; },
    get couponsEnabled() { return couponsEnabled; },
    setFlags,
  };
}

export const FEATURE_MANAGER = createFeatureManager()
