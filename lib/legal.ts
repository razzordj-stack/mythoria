export const legal = {
  providerName: process.env.LEGAL_PROVIDER_NAME || "[VOLLSTÄNDIGER NAME / FIRMA EINTRAGEN]",
  legalForm: process.env.LEGAL_FORM || "[RECHTSFORM EINTRAGEN]",
  representative: process.env.LEGAL_REPRESENTATIVE || "[VERTRETUNGSBERECHTIGTE PERSON EINTRAGEN]",
  street: process.env.LEGAL_STREET || "[STRASSE UND HAUSNUMMER EINTRAGEN]",
  city: process.env.LEGAL_CITY || "[PLZ UND ORT EINTRAGEN]",
  country: process.env.LEGAL_COUNTRY || "Deutschland",
  email: process.env.LEGAL_EMAIL || "[KONTAKT-E-MAIL EINTRAGEN]",
  phone: process.env.LEGAL_PHONE || "[TELEFONNUMMER EINTRAGEN]",
  register: process.env.LEGAL_REGISTER || "[REGISTER UND REGISTERNUMMER, FALLS VORHANDEN]",
  vatId: process.env.LEGAL_VAT_ID || "[UST-ID, FALLS VORHANDEN]",
  authority: process.env.LEGAL_SUPERVISORY_AUTHORITY || "[ZUSTÄNDIGE AUFSICHTSBEHÖRDE, FALLS ERFORDERLICH]",
  privacyAuthority: process.env.LEGAL_PRIVACY_AUTHORITY || "[ZUSTÄNDIGE LANDESDATENSCHUTZBEHÖRDE EINTRAGEN]",
} as const;

export const legalUpdated = "31. Juli 2026";
