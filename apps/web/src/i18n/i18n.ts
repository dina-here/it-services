import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import sv from "./sv.json";
import en from "./en.json";

/**
 * Enkel i18n: Svenska som default, engelska som alternativ.
 * Språk byts via knapp uppe till höger.
 */
i18n.use(initReactI18next).init({
  resources: {
    sv: { translation: sv },
    en: { translation: en },
  },
  lng: "sv",
  fallbackLng: "sv",
  interpolation: { escapeValue: false },
});

export default i18n;
