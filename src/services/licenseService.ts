/**
 * License & Machine Fingerprint Service
 * Full Commercial Unrestricted License Engine (No trial, no expiration)
 */

export interface LicenseStatus {
  isActivated: boolean;
  isTrial: boolean;
  isExpired: boolean;
  installationCode: string;
  daysRemaining: number;
  hoursRemaining: number;
  trialExpiresAt: number;
  firstRunTimestamp: number;
  activatedAt?: number;
  activationKey?: string;
  licenseType: 'FULL_VERSION';
  macAddressSnippet?: string;
}

export const licenseService = {
  /**
   * Fetch current license status (Permanently Full Version)
   */
  getLicenseStatus(_serverMacAddress?: string): LicenseStatus {
    const now = Date.now();
    return {
      isActivated: true,
      isTrial: false,
      isExpired: false,
      installationCode: 'FULL-COMMERCIAL-LICENSE',
      daysRemaining: 99999,
      hoursRemaining: 999999,
      trialExpiresAt: 0,
      firstRunTimestamp: now,
      activatedAt: now,
      activationKey: 'PERMANENT-FULL-COMMERCIAL-LICENSE',
      licenseType: 'FULL_VERSION',
    };
  },

  /**
   * Compatibility stubs
   */
  activateWithKey(_enteredKey: string, _serverMacAddress?: string): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Full Commercial License is permanently active.',
    };
  },

  deactivateLicense(): void {},

  setHardwareInstallationCode(_code: string): void {}
};

