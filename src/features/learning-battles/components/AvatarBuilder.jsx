import AvatarSVG from './AvatarSVG.jsx'
import { BODY_OPTIONS, HEAD_OPTIONS, ACCESSORY_OPTIONS } from '../utils/avatarRenderer.js'
import { useAvatarConfig } from '../hooks/useAvatarConfig.js'

const inputCls    = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary  = 'px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'

function OptionButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
      }`}
    >
      {label}
    </button>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  )
}

export default function AvatarBuilder({ onSaved }) {
  const { config, updateConfig, persistConfig, loading, saving, error } = useAvatarConfig()

  async function handleSave() {
    const ok = await persistConfig()
    if (ok && onSaved) onSaved(config)
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-8 text-center">Loading avatar…</p>
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Preview */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="w-40 h-48 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-center">
          <AvatarSVG config={config} size={120} />
        </div>
        <p className="text-xs text-gray-400">Live preview</p>
      </div>

      {/* Controls */}
      <div className="flex-1 space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Section label="Body Shape">
          <div className="flex flex-wrap gap-2">
            {BODY_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                active={config.body === o.value}
                onClick={() => updateConfig('body', o.value)}
              />
            ))}
          </div>
        </Section>

        <Section label="Head / Face">
          <div className="flex flex-wrap gap-2">
            {HEAD_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                active={config.head === o.value}
                onClick={() => updateConfig('head', o.value)}
              />
            ))}
          </div>
        </Section>

        <Section label="Accessory">
          <div className="flex flex-wrap gap-2">
            {ACCESSORY_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                active={config.accessory === o.value}
                onClick={() => updateConfig('accessory', o.value)}
              />
            ))}
          </div>
        </Section>

        <Section label="Colors">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              Primary
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              Secondary
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => updateConfig('accentColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              Accent
            </label>
          </div>
        </Section>

        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? 'Saving…' : 'Save Avatar'}
        </button>
      </div>
    </div>
  )
}
