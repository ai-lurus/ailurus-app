import { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const widthClass = size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`rounded-2xl shadow-xl w-full ${widthClass} max-h-[90vh] flex flex-col`} style={{ backgroundColor: 'hsl(224, 30%, 14%)' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <h2 className="text-base font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'hsl(224, 20%, 55%)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
