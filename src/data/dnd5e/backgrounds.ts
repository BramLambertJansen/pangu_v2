import type { SrdBackground } from '@/types/srd5e.types'

// SRD 5.1 (CC-BY-4.0) — de 8 bekendste achtergronden.
// Skill-namen moeten exact matchen met D5E_SKILLS in src/utils/dnd5e.ts.
export const SRD_BACKGROUNDS: SrdBackground[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    description: 'Opgegroeid in dienst van een tempel.',
    skills: ['Inzicht', 'Religie'],
    feature: 'Shelter of the Faithful',
    featureDescription: 'Gelovigen van jouw geloof bieden je onderdak en hulp.',
    toolProficiencies: [],
    languagesNote: 'Twee extra talen naar keuze',
  },
  {
    id: 'charlatan',
    name: 'Charlatan',
    description: 'Een gave voor valse gezichten en vervalsingen.',
    skills: ['Bedrog', 'Vingervlugheid'],
    feature: 'False Identity',
    featureDescription: 'Je hebt een tweede identiteit met papieren, kennissen en vermommingen.',
    toolProficiencies: ['Vermommingsset', 'Vervalsingsset'],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    description: 'Werkte buiten de wet voor klinkende munt.',
    skills: ['Bedrog', 'Sluipen'],
    feature: 'Criminal Contact',
    featureDescription: 'Je hebt een betrouwbaar contact in de onderwereld.',
    toolProficiencies: ['Dieventuig', 'Speelset'],
  },
  {
    id: 'folk-hero',
    name: 'Folk Hero',
    description: 'Opgestaan uit het gewone volk om het te beschermen.',
    skills: ['Dierenverzorging', 'Overleven'],
    feature: 'Rustic Hospitality',
    featureDescription: 'Het gewone volk biedt je schuilplaats en steun.',
    toolProficiencies: ['Ambachtsgereedschap', 'Voertuigen (land)'],
  },
  {
    id: 'noble',
    name: 'Noble',
    description: 'Geboren in privilege; geboren om te leiden.',
    skills: ['Geschiedenis', 'Overtuigen'],
    feature: 'Position of Privilege',
    featureDescription: 'Je wordt overal met respect ontvangen; de hoge kringen staan voor je open.',
    toolProficiencies: ['Speelset'],
    languagesNote: 'Eén extra taal naar keuze',
  },
  {
    id: 'outlander',
    name: 'Outlander',
    description: 'De wildernis is thuis; steden zijn vreemd terrein.',
    skills: ['Atletiek', 'Overleven'],
    feature: 'Wanderer',
    featureDescription: 'Je geheugen voor kaarten en terrein is feilloos; je vindt altijd voedsel en water.',
    toolProficiencies: ['Muziekinstrument'],
    languagesNote: 'Eén extra taal naar keuze',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Jaren van studie; bibliotheken zijn thuis.',
    skills: ['Magie', 'Geschiedenis'],
    feature: 'Researcher',
    featureDescription: 'Als jij iets niet weet, weet je wél waar of bij wie het te vinden is.',
    toolProficiencies: [],
    languagesNote: 'Twee extra talen naar keuze',
  },
  {
    id: 'soldier',
    name: 'Soldier',
    description: 'Getraind en gediend in een leger.',
    skills: ['Atletiek', 'Intimidatie'],
    feature: 'Military Rank',
    featureDescription: 'Soldaten van jouw oude leger erkennen je gezag en invloed.',
    toolProficiencies: ['Speelset', 'Voertuigen (land)'],
  },
]

export function getBackground(id: string | null): SrdBackground | undefined {
  return SRD_BACKGROUNDS.find((b) => b.id === id)
}
