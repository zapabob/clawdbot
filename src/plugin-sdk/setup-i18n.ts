import {
  createSetupTranslator as createSetupTranslatorImpl,
  type SetupTranslator,
  type WizardI18nParams,
  type WizardLocale,
} from "../wizard/i18n/index.js";

export type { SetupTranslator, WizardI18nParams, WizardLocale };

export function createSetupTranslator(options?: {
  locale?: WizardLocale;
  keyPrefix?: string;
}): SetupTranslator {
  return createSetupTranslatorImpl(options);
}
