import { RelatedEntities } from '@/components/link/RelatedEntities'
import type { Character } from '@/types/character.types'

interface Props {
  character: Character
}

export function CharacterLoreTab({ character }: Props) {
  return (
    <div id="tabpanel-lore" role="tabpanel" aria-labelledby="tab-lore">
      {/* Achtergrond */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
        {character.alignment && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px', fontStyle: 'italic' }}>
            Uitlijning: <span style={{ color: 'var(--ink-soft)', fontStyle: 'normal' }}>{character.alignment}</span>
          </p>
        )}
        {character.description
          ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
          : <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Nog geen achtergrondverhaal toegevoegd.</p>
        }
      </div>

      {/* Karaktereigenschappen */}
      {(character.personality_traits || character.ideals || character.bonds || character.flaws) && (
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Karaktereigenschappen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { label: 'Persoonlijkheidskenmerken', value: character.personality_traits },
              { label: 'Idealen',                   value: character.ideals            },
              { label: 'Banden',                    value: character.bonds             },
              { label: 'Gebreken',                  value: character.flaws             },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>{label}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uiterlijk */}
      {(character.age || character.height || character.weight || character.appearance) && (
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 12 }}>Uiterlijk</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: character.appearance ? 14 : 0 }}>
            {character.age    && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Leeftijd</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.age}</p></div>}
            {character.height && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Lengte</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.height}</p></div>}
            {character.weight && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Gewicht</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.weight}</p></div>}
          </div>
          {character.appearance && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.appearance}</p>
          )}
        </div>
      )}

      {/* Talenten */}
      {(character.feats ?? []).length > 0 && (
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 12 }}>Talenten</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(character.feats ?? []).map(feat => (
              <span key={feat} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, background: 'rgb(var(--violet-rgb) / 0.08)', border: '1px solid rgb(var(--violet-rgb) / 0.25)', color: 'var(--ink-soft)' }}>
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wapenmeesters */}
      {(character.weapon_masteries ?? []).length > 0 && (
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 12 }}>Wapenmeesters</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(character.weapon_masteries ?? []).map(m => (
              <span key={m} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, background: 'rgb(var(--gold-rgb) / 0.08)', border: '1px solid rgb(var(--gold-rgb) / 0.25)', color: 'var(--gold)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Privénotities */}
      <div className="pangu-surface" style={{ padding: 28, borderColor: 'rgb(var(--azure-rgb) / 0.18)', background: 'rgb(var(--azure-rgb) / 0.03)' }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>✦ Privénotities</p>
        <p style={{ fontSize: 12, color: 'var(--azure)', marginBottom: 16, marginTop: 0 }}>Alleen zichtbaar voor jou</p>
        {character.notes
          ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.notes}</p>
          : <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen notities.</p>
        }
      </div>

      {character.campaign_id && (
        <RelatedEntities type="character" id={character.id} campaignId={character.campaign_id} />
      )}
    </div>
  )
}
