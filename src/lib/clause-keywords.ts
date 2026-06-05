export const RED_FLAG_KEYWORDS: string[] = [
  'Asbestos',
  'Sanction',
  'Sanctions',
  'Absolute Exclusion',
  'Pollution (Absolute)',
  'Absolute Pollution',
  'Nuclear',
  'War',
  'Terrorism',
  'War/Terrorism',
  'Act of War',
  'Radioactive',
  'Biological Weapon',
  'Chemical Weapon',
]

export const ORANGE_FLAG_KEYWORDS: string[] = [
  'Deductible',
  'Jurisdiction',
  'Notice of Loss',
  'Policy Period',
  'Insured Name',
  'Named Insured',
  'Sublimit',
  'Coinsurance',
  'Exclusion',
  'Condition Precedent',
]

export const CLAUSE_KEYWORDS = {
  RED: RED_FLAG_KEYWORDS,
  ORANGE: ORANGE_FLAG_KEYWORDS,
}

export default CLAUSE_KEYWORDS
