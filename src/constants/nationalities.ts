/** DB `value` = legacy stored string; `labelKey` = translation key for bilingual country name */
export interface NationalityOption {
  value: string;
  labelKey: string;
}

/** User-requested list — preserves existing DB values, adds missing countries only. Entries marked `` were not in the original form. */
export const NATIONALITY_OPTIONS: NationalityOption[] = [
  { value: 'American', labelKey: 'America' },
  { value: 'Afghan', labelKey: 'afghanistan' },
  { value: 'Albanian', labelKey: 'albania' }, 
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
  { value: 'Chilean', labelKey: 'chile' }, 
  { value: 'Chinese', labelKey: 'china' },
  { value: 'Colombian', labelKey: 'colombia' },
  
  { value: 'Congolese', labelKey: 'congo' },
  { value: 'Costa Rican', labelKey: 'costa_rica' },
  { value: 'Croatian', labelKey: 'croatia' },
  { value: 'Cuban', labelKey: 'cuba' }, 
  { value: 'Cypriot', labelKey: 'cyprus' }, 
  { value: 'Czech', labelKey: 'czech_republic' },
  { value: 'Danish', labelKey: 'denmark' },
  { value: 'Djiboutian', labelKey: 'djibouti' }, 
  { value: 'Dominican', labelKey: 'dominican_republic' }, 
  { value: 'Ecuadorian', labelKey: 'ecuador' },
  { value: 'Egyptian', labelKey: 'egypt' },
  { value: 'Emirati', labelKey: 'united_arab_emirates' },
  { value: 'English', labelKey: 'england' }, 
  { value: 'Eritrean', labelKey: 'eritrea' }, 
  { value: 'Estonian', labelKey: 'estonia' },
  { value: 'Ethiopian', labelKey: 'ethiopia' },
  { value: 'Fijian', labelKey: 'fiji' }, 
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
  { value: 'Korean', labelKey: 'korea' }, 
  { value: 'Kuwaiti', labelKey: 'kuwait' }, 
  { value: 'Kyrgyz', labelKey: 'kyrgyzstan' }, 
  { value: 'Lao', labelKey: 'laos' }, 
  { value: 'Latvian', labelKey: 'latvia' }, 
  { value: 'Lebanese', labelKey: 'Lebanese' },
  { value: 'Libyan', labelKey: 'libya' },
  { value: 'Lithuanian', labelKey: 'lithuania' },
  { value: 'Malagasy', labelKey: 'madagascar' }, 
  { value: 'Malaysian', labelKey: 'malaysia' },
  { value: 'Malian', labelKey: 'mali' }, 
  { value: 'Mauritanian', labelKey: 'mauritania' }, 
  { value: 'Mexican', labelKey: 'mexico' },
  { value: 'Moroccan', labelKey: 'morocco' },
  { value: 'Burmese', labelKey: 'Myanmar' }, 
  { value: 'Namibian', labelKey: 'namibia' }, 
  { value: 'nepalese', labelKey: 'nepal' },
  { value: 'New Zealand', labelKey: 'new_zealand' }, 
  { value: 'Rwandan', labelKey: 'rwanda' }, 
  { value: 'Salvadoran', labelKey: 'el_salvador' },
  { value: 'saudi_arabia', labelKey: 'saudi_arabia' }, 
  { value: 'Scottish', labelKey: 'scotland' }, 
  { value: 'Senegalese', labelKey: 'Senegalese' },
  { value: 'Serbian', labelKey: 'serbia' },
  { value: 'Singaporean', labelKey: 'singapore' },
  { value: 'Slovak', labelKey: 'slovakia' }, 
  { value: 'Somalian', labelKey: 'somalia' }, 
  { value: 'South African', labelKey: 'south_africa' },
  { value: 'Spanish', labelKey: 'spain' },
  { value: 'sri_lanka', labelKey: 'sri_lanka' },
  { value: 'Sudanese', labelKey: 'sudan' },
  { value: 'Swedish', labelKey: 'sweden' },
  { value: 'Swiss', labelKey: 'switzerland' },
  { value: 'Syrian', labelKey: 'syria' },
  { value: 'Tajik', labelKey: 'tajikistan' }, 
  { value: 'Tanzanian', labelKey: 'tanzania' }, 
  { value: 'Thai', labelKey: 'thailand' }, 
  { value: 'Tunisian', labelKey: 'tunisia' },
  { value: 'Turkish', labelKey: 'turkey' },
  { value: 'Turkmen', labelKey: 'turkmenistan' }, 
  { value: 'Ukranian', labelKey: 'ukraine' },
  { value: 'Uruguayan', labelKey: 'uruguay' },
  { value: 'Uzbek', labelKey: 'uzbekistan' }, 
  { value: 'Venezuelan', labelKey: 'venezuela' }, 
  { value: 'Vietnamese', labelKey: 'vietnam' },
  { value: 'Welsh', labelKey: 'wales' },
  { value: 'Yemeni', labelKey: 'yemen' }, 
  { value: 'Zambian', labelKey: 'zambia' },
  { value: 'Zimbabwean', labelKey: 'zimbabwe' },
  { value: 'Palestine', labelKey: 'Palestine' },
  { value: 'portuguese', labelKey: 'portuguese' },
  { value: 'Paraguayan', labelKey: 'Paraguayan' },
  { value: 'Qatari', labelKey: 'Qatari' },
  { value: 'Papua', labelKey: 'Papua' },
  { value: 'Romanian', labelKey: 'Romanian' },
  { value: 'Angolan', labelKey: 'Angolan' },
  { value: 'Bahraini', labelKey: 'Bahraini' },
  { value: 'Belarusian', labelKey: 'belarusian' },
  { value: 'Bolivian', labelKey: 'bolivian' },
  { value: 'Bosnian/Herzegovinian', labelKey: 'Bosnian/Herzegovinc' },
  { value: 'Burundian', labelKey: 'Burundian' },
  { value: 'Comorian', labelKey: 'Comorian' }, 
  { value: 'Dutch', labelKey: 'Dutch' },
  { value: 'Nicaraguan', labelKey: 'Nicaraguan' },
  { value: 'Nigerien', labelKey: 'Nigerien' },
  { value: 'Norwegian', labelKey: 'Norwegian' },
  { value: 'Omani', labelKey: 'Omani' },
  { value: 'Pakistani', labelKey: 'Pakistani' },
  { value: 'Panamanian', labelKey: 'Panamanian' },
  { value: 'Peruvian', labelKey: 'Peruvian' },
  { value: 'Polish', labelKey: 'Polish' },
  { value: 'Russian', labelKey: 'Russian' },


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
