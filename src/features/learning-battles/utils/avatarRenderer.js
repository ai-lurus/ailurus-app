/**
 * Generates SVG element definitions for avatar parts.
 * All parts are designed for a 100x120 viewBox.
 * Head center: (50, 35). Body: y 60-115. Accessories: top layer y 0-30.
 */

export const BODY_OPTIONS = [
  { value: 'round',  label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'slim',   label: 'Slim' },
  { value: 'wide',   label: 'Wide' },
]

export const HEAD_OPTIONS = [
  { value: 'round',  label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'cat',    label: 'Cat' },
  { value: 'robot',  label: 'Robot' },
]

export const ACCESSORY_OPTIONS = [
  { value: 'none',    label: 'None' },
  { value: 'hat',     label: 'Wizard Hat' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'crown',   label: 'Crown' },
]

export const DEFAULT_CONFIG = {
  body: 'round',
  head: 'round',
  primaryColor: '#6366f1',
  secondaryColor: '#a5b4fc',
  accentColor: '#fbbf24',
  accessory: 'none',
}

/**
 * Returns an array of SVG elements (as JSX-compatible objects) for the given config.
 * Used by AvatarSVG component.
 */
export function getAvatarLayers(config) {
  const c = { ...DEFAULT_CONFIG, ...config }
  return {
    body: getBodyLayer(c.body, c.primaryColor, c.secondaryColor),
    head: getHeadLayer(c.head, c.primaryColor, c.accentColor),
    accessory: getAccessoryLayer(c.accessory, c.accentColor, c.primaryColor),
  }
}

function getBodyLayer(type, primary, secondary) {
  switch (type) {
    case 'square':
      return { type: 'square', primary, secondary }
    case 'slim':
      return { type: 'slim', primary, secondary }
    case 'wide':
      return { type: 'wide', primary, secondary }
    default:
      return { type: 'round', primary, secondary }
  }
}

function getHeadLayer(type, primary, accent) {
  switch (type) {
    case 'square':
      return { type: 'square', primary, accent }
    case 'cat':
      return { type: 'cat', primary, accent }
    case 'robot':
      return { type: 'robot', primary, accent }
    default:
      return { type: 'round', primary, accent }
  }
}

function getAccessoryLayer(type, accent, primary) {
  switch (type) {
    case 'hat':
      return { type: 'hat', accent, primary }
    case 'glasses':
      return { type: 'glasses', accent }
    case 'crown':
      return { type: 'crown', accent }
    default:
      return { type: 'none' }
  }
}
