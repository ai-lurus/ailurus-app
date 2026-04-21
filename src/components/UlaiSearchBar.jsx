import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useChatContext } from '../context/ChatContext.jsx'
import { SparklesIcon } from './Icons.jsx'

const ROUTE_SUGGESTIONS = {
  '/admin/overview':  ['¿Qué debería priorizar hoy?', 'Proyectos en riesgo', 'Resumen del equipo esta semana'],
  '/admin/board':     ['¿Qué tareas están bloqueadas?', 'Ayúdame a priorizar el backlog', 'Estado del sprint actual'],
  '/admin/sprints':   ['¿Cómo va la velocidad del sprint?', 'Ayúdame a planear el siguiente sprint'],
  '/admin/projects':  ['Resumen de proyectos activos', '¿Qué proyectos están en riesgo?', 'Comparar avance de proyectos'],
  '/admin/team':      ['¿Quién tiene más carga de trabajo?', 'Distribuye las tareas del sprint', 'Métricas del equipo esta semana'],
  '/admin/reports':   ['Genera un reporte de velocidad', 'Resumen de métricas esta semana', 'Tendencias del último mes'],
  '/admin/reviews':   ['Resumen de code reviews pendientes', '¿Qué PRs necesitan atención?'],
  '/admin/learning':  ['Recomienda recursos para el equipo', '¿Cómo va el progreso de aprendizaje?'],
  '/dashboard':       ['Resumen ejecutivo de proyectos', '¿Cuál es el mayor riesgo hoy?', 'Draft de actualización para cliente'],
  '/home':            ['¿En qué debería enfocarme hoy?', 'Tengo un blocker, ayúdame', 'Planea mi día'],
  '/projects':        ['¿En qué proyectos estoy asignado?', 'Resumen de mis tareas activas'],
  '/ulai':            ['¿Qué puedes hacer?', 'Ayúdame a planear mi día', 'Dame un resumen rápido'],
}

const DEFAULT_SUGGESTIONS = ['¿En qué te puedo ayudar?', 'Ayúdame a planear mi día', 'Resumen del equipo']

function getSuggestions(pathname) {
  for (const [route, suggestions] of Object.entries(ROUTE_SUGGESTIONS)) {
    if (pathname === route || pathname.startsWith(route + '/')) return suggestions
  }
  return DEFAULT_SUGGESTIONS
}

export default function UlaiSearchBar({ onOpen }) {
  const navigate             = useNavigate()
  const location             = useLocation()
  const { setPendingQuery }  = useChatContext()
  const inputRef             = useRef(null)
  const containerRef         = useRef(null)

  const [query, setQuery]     = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = getSuggestions(location.pathname)

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setFocused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function submit(text) {
    const q = (text ?? query).trim()
    if (!q) return
    setPendingQuery(q)
    setQuery('')
    setFocused(false)
    if (onOpen) {
      onOpen()
    } else {
      navigate('/ulai')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const showDropdown = focused && suggestions.length > 0

  return (
    <div ref={containerRef} className="relative w-72">
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
        style={{
          backgroundColor: focused ? 'hsl(224, 30%, 16%)' : 'hsl(224, 30%, 13%)',
          border: focused
            ? '1px solid hsl(244, 100%, 55%)'
            : '1px solid hsl(224, 30%, 20%)',
        }}
      >
        {/* Gradient icon */}
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, hsl(244, 100%, 69%), hsl(187, 100%, 50%))',
          }}
        >
          <SparklesIcon className="w-3 h-3" style={{ color: 'white' }} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Pregúntale a Ulai..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'hsl(224, 40%, 90%)', caretColor: 'hsl(244, 100%, 69%)' }}
        />

        <kbd
          className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'hsl(224, 30%, 20%)',
            color: 'hsl(224, 20%, 45%)',
            border: '1px solid hsl(224, 30%, 24%)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl py-1.5 z-50"
          style={{
            backgroundColor: 'hsl(224, 45%, 9%)',
            border: '1px solid hsl(224, 30%, 20%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(224, 20%, 40%)' }}>
            Sugerencias
          </p>
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); submit(s) }}
              className="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-white/[0.04]"
              style={{ color: 'hsl(224, 20%, 70%)' }}
            >
              <span style={{ color: 'hsl(244, 100%, 69%)' }} className="mr-2">↗</span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
