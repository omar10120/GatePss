/** DB `value` = legacy stored string; `labelKey` = translation key for bilingual country name */
export interface NationalityOption {
  value: string;
  labelKey: string;
}

/** User-requested list — preserves existing DB values, adds missing countries only. Entries marked `// new` were not in the original form. */
export const NATIONALITY_OPTIONS: NationalityOption[] = [
  { value: 'Afghan', labelKey: 'afghanistan' },
  { value: 'Albanian', labelKey: 'albania' }, // new
  { value: 'Algerian', labelKey: 'algeria' },
  { value: 'Argentine', labelKey: 'argentina' },
  { value: 'Australian', labelKey: 'australia' },
  { value: 'Austrian', labelKey: 'austria' },
  { value: 'Bangladeshi', labelKey: 'bangladesh' },
  { value: 'Belgian', labelKey: 'belgium' },
  { value: 'Brazilian', labelKey: 'brazil' },
  { value: 'Bulgarian', labelKey: 'bulgaria' },
  { value: 'Cameroonian', labelKey: 'cameroon' },
  { value: 'Canadian', labelKey: 'canada' },
  { value: 'Central African', labelKey: 'central_african_republic' },
  { value: 'Chadian', labelKey: 'chad' },
  { value: 'Chilean', labelKey: 'chile' }, // new
  { value: 'Chinese', labelKey: 'china' },
  { value: 'Colombian', labelKey: 'colombia' },
  { value: 'Comoran', labelKey: 'comoros' }, // new
  { value: 'Congolese', labelKey: 'congo' },
  { value: 'Costa Rican', labelKey: 'costa_rica' },
  { value: 'Croatian', labelKey: 'croatia' },
  { value: 'Cuban', labelKey: 'cuba' }, // new
  { value: 'Cypriot', labelKey: 'cyprus' }, // new
  { value: 'Czech', labelKey: 'czech_republic' },
  { value: 'Danish', labelKey: 'denmark' },
  { value: 'Djiboutian', labelKey: 'djibouti' }, // new
  { value: 'Dominican', labelKey: 'dominican_republic' }, // new
  { value: 'Ecuadorian', labelKey: 'ecuador' },
  { value: 'Egyptian', labelKey: 'egypt' },
  { value: 'Emirati', labelKey: 'united_arab_emirates' },
  { value: 'English', labelKey: 'england' }, // new
  { value: 'Eritrean', labelKey: 'eritrea' }, // new
  { value: 'Estonian', labelKey: 'estonia' },
  { value: 'Ethiopian', labelKey: 'ethiopia' },
  { value: 'Fijian', labelKey: 'fiji' }, // new
  { value: 'Philippine', labelKey: 'philippines' },
  { value: 'Finnish', labelKey: 'finland' },
  { value: 'French', labelKey: 'france' },
  { value: 'German', labelKey: 'germany' },
  { value: 'Ghanaian', labelKey: 'ghana' },
  { value: 'Greek', labelKey: 'greece' },
  { value: 'Guatemalan', labelKey: 'guatemala' },
  { value: 'Honduran', labelKey: 'honduras' },
  { value: 'Hungarian', labelKey: 'hungary' },
  { value: 'Icelandic', labelKey: 'iceland' },
  { value: 'Indian', labelKey: 'india' },
  { value: 'Indonesian', labelKey: 'indonesia' },
  { value: 'Iranian', labelKey: 'iran' },
  { value: 'Iraqi', labelKey: 'iraq' },
  { value: 'Irish', labelKey: 'ireland' },
  { value: 'Israeli', labelKey: 'israel' },
  { value: 'Italian', labelKey: 'italy' },
  { value: 'Ivorian', labelKey: 'ivory_coast' },
  { value: 'Jamaican', labelKey: 'jamaica' },
  { value: 'Japanese', labelKey: 'japan' },
  { value: 'Jordanian', labelKey: 'jordan' },
  { value: 'Kazakh', labelKey: 'kazakhstan' },
  { value: 'Kenyan', labelKey: 'kenya' },
  { value: 'Korean', labelKey: 'korea' }, // new
  { value: 'Kuwaiti', labelKey: 'kuwait' }, // new
  { value: 'Kyrgyz', labelKey: 'kyrgyzstan' }, // new
  { value: 'Lao', labelKey: 'laos' }, // new
  { value: 'Latvian', labelKey: 'latvia' }, // new
  { value: 'lebanese', labelKey: 'lebanon' },
  { value: 'Libyan', labelKey: 'libya' },
  { value: 'Lithuanian', labelKey: 'lithuania' },
  { value: 'Malagasy', labelKey: 'madagascar' }, // new
  { value: 'Malaysian', labelKey: 'malaysia' },
  { value: 'Malian', labelKey: 'mali' }, // new
  { value: 'Mauritanian', labelKey: 'mauritania' }, // new
  { value: 'Mexican', labelKey: 'mexico' },
  { value: 'Moroccan', labelKey: 'morocco' },
  { value: 'Burmese', labelKey: 'myanmar' }, // new
  { value: 'Namibian', labelKey: 'namibia' }, // new
  { value: 'nepalese', labelKey: 'nepal' },
  { value: 'New Zealand', labelKey: 'new_zealand' }, // new
  { value: 'Rwandan', labelKey: 'rwanda' }, // new
  { value: 'Salvadoran', labelKey: 'el_salvador' },
  { value: 'Saudi, Saudi Arabian', labelKey: 'saudi_arabia' }, // new
  { value: 'Scottish', labelKey: 'scotland' }, // new
  { value: 'Senegalese', labelKey: 'senegal' },
  { value: 'Serbian', labelKey: 'serbia' },
  { value: 'Singaporean', labelKey: 'singapore' },
  { value: 'Slovak', labelKey: 'slovakia' }, // new
  { value: 'Somalian', labelKey: 'somalia' }, // new
  { value: 'South African', labelKey: 'south_africa' },
  { value: 'Spanish', labelKey: 'spain' },
  { value: 'sri_lanka', labelKey: 'sri_lanka' },
  { value: 'Sudanese', labelKey: 'sudan' },
  { value: 'Swedish', labelKey: 'sweden' },
  { value: 'Swiss', labelKey: 'switzerland' },
  { value: 'Syrian', labelKey: 'syria' },
  { value: 'Tajik', labelKey: 'tajikistan' }, // new
  { value: 'Tanzanian', labelKey: 'tanzania' }, // new
  { value: 'Thai', labelKey: 'thailand' }, // new
  { value: 'Tunisian', labelKey: 'tunisia' },
  { value: 'Turkish', labelKey: 'turkey' },
  { value: 'Turkmen', labelKey: 'turkmenistan' }, // new
  { value: 'Ukranian', labelKey: 'ukraine' },
  { value: 'Uruguayan', labelKey: 'uruguay' },
  { value: 'Uzbek', labelKey: 'uzbekistan' }, // new
  { value: 'Venezuelan', labelKey: 'venezuela' }, // new
  { value: 'Vietnamese', labelKey: 'vietnam' },
  { value: 'Welsh', labelKey: 'wales' },
  { value: 'Yemeni', labelKey: 'yemen' }, // new
  { value: 'Zambian', labelKey: 'zambia' },
  { value: 'Zimbabwean', labelKey: 'zimbabwe' },
];

const normalizeStoredValue = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[\/,]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();

const VALUE_TO_LABEL_KEY = new Map(
  NATIONALITY_OPTIONS.map((o) => [o.value, o.labelKey])
);

const NORMALIZED_VALUE_TO_LABEL_KEY = new Map(
  NATIONALITY_OPTIONS.map((o) => [normalizeStoredValue(o.value), o.labelKey])
);

/** Resolves stored DB value → translation labelKey (for display) */
export function resolveNationalityLabelKey(raw: string): string {
  const exact = VALUE_TO_LABEL_KEY.get(raw);
  if (exact) return exact;

  const normalized = normalizeStoredValue(raw);
  const byNormalized = NORMALIZED_VALUE_TO_LABEL_KEY.get(normalized);
  if (byNormalized) return byNormalized;

  // Records saved briefly with snake_case country keys
  const byLabelKey = NATIONALITY_OPTIONS.find((o) => o.labelKey === normalized);
  if (byLabelKey) return byLabelKey.labelKey;

  // Other legacy demonyms still in translation files (Angolan, Nigerian, Omani, …)
  const legacyAliases: Record<string, string> = {
    argentinian: 'argentina',
    bosnian_herzegovinc: 'bosnia',
    bosnian_herzegovinian: 'bosnia',
    saudi_saudi_arabian: 'saudi_arabia',
    saudi_arabian: 'saudi_arabia',
    saudi: 'saudi_arabia',
    cyprotic: 'cyprus',
    filipino: 'philippines',
  };

  return legacyAliases[normalized] ?? normalized;
}
