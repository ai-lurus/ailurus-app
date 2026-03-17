import { useState, useEffect } from 'react'
import { getAvatar, saveAvatar } from '../../../api/battles.js'
import { DEFAULT_CONFIG } from '../utils/avatarRenderer.js'

export function useAvatarConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAvatar()
      .then((avatar) => {
        if (avatar) {
          setConfig({
            body: avatar.body,
            head: avatar.head,
            primaryColor: avatar.primaryColor,
            secondaryColor: avatar.secondaryColor,
            accentColor: avatar.accentColor,
            accessory: avatar.accessory,
          })
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function updateConfig(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  async function persistConfig() {
    setSaving(true)
    setError(null)
    try {
      const saved = await saveAvatar(config)
      setConfig({
        body: saved.body,
        head: saved.head,
        primaryColor: saved.primaryColor,
        secondaryColor: saved.secondaryColor,
        accentColor: saved.accentColor,
        accessory: saved.accessory,
      })
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { config, updateConfig, persistConfig, loading, saving, error }
}
