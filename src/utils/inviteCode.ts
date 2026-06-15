const WORDS = [
  'WOLF', 'RAVEN', 'IRON', 'EMBER', 'STORM', 'DUSK', 'VALE', 'CREST',
  'THORN', 'DRAKE', 'FLAME', 'FROST', 'GALE', 'HAVEN', 'KEEP', 'LANCE',
  'MIRE', 'NIGHT', 'PEAK', 'RIFT', 'SAGE', 'SHADE', 'SHIELD', 'SIGIL',
  'SIREN', 'SKULL', 'SPIRE', 'STONE', 'SWIFT', 'TIDE', 'TITAN', 'TOMB',
  'TOWER', 'VEIL', 'VENOM', 'VIPER', 'VOID', 'WARD', 'WISP', 'WRATH',
  'ZEAL', 'BLADE', 'BONE', 'CLAW', 'CROW', 'DEEP', 'DIRE', 'DOOM',
  'ECHO', 'FANG', 'FELL', 'FORGE', 'GRIM', 'HELM', 'HOWL', 'HUNT',
  'KEEN', 'LAIR', 'MARK', 'MOON', 'OATH', 'PYRE', 'RUNE', 'SCAR',
  'SHROUD', 'SMOKE', 'SOUL', 'STAR', 'TUSK', 'ASH', 'OAK', 'FOG',
  'BANE', 'DREAD', 'FATE', 'HEX', 'PACT', 'SHARD', 'ABYSS', 'CINDER',
  'GLOOM', 'HOLLOW', 'JAVELIN', 'KNIGHT', 'LOTUS', 'MAUL', 'NOMAD', 'OBELISK',
  'PHANTOM', 'QUILL', 'RAZOR', 'SABRE', 'TALON', 'UMBRA', 'WANDER', 'YEW',
]

/**
 * Generates a two-word + 4-digit code (e.g. WOLF-EMBER-4532). The two words
 * are always distinct, giving ~26 bits of entropy (vs. ~19 bits for a single
 * word), which keeps brute-forcing a campaign's invite code impractical.
 */
export function generateInviteCode(): string {
  const firstIndex = Math.floor(Math.random() * WORDS.length)
  let secondIndex = Math.floor(Math.random() * WORDS.length)
  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * WORDS.length)
  }
  const digits = String(Math.floor(Math.random() * 9000) + 1000)
  return `${WORDS[firstIndex]}-${WORDS[secondIndex]}-${digits}`
}
