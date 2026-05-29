const WORDS = [
  'WOLF', 'RAVEN', 'IRON', 'EMBER', 'STORM', 'DUSK', 'VALE', 'CREST',
  'THORN', 'DRAKE', 'FLAME', 'FROST', 'GALE', 'HAVEN', 'KEEP', 'LANCE',
  'MIRE', 'NIGHT', 'PEAK', 'RIFT', 'SAGE', 'SHADE', 'SHIELD', 'SIGIL',
  'SIREN', 'SKULL', 'SPIRE', 'STONE', 'SWIFT', 'TIDE', 'TITAN', 'TOMB',
  'TOWER', 'VEIL', 'VENOM', 'VIPER', 'VOID', 'WARD', 'WISP', 'WRATH',
  'ZEAL', 'BLADE', 'BONE', 'CLAW', 'CROW', 'DEEP', 'DIRE', 'DOOM',
  'ECHO', 'FANG', 'FELL', 'FORGE', 'GRIM', 'HELM', 'HOWL', 'HUNT',
  'KEEN', 'LAIR', 'MARK', 'MOON', 'OATH', 'PYRE', 'RUNE', 'SCAR',
  'SHROUD', 'SMOKE', 'SOUL', 'STAR', 'TUSK', 'VALE', 'ASH', 'IRON',
  'OAK', 'FOG', 'BANE', 'DREAD', 'FATE', 'HEX', 'PACT', 'SHARD',
]

export function generateInviteCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const digits = String(Math.floor(Math.random() * 9000) + 1000)
  return `${word}-${digits}`
}
