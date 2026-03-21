import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject } from '../api/projects.js'
import { getProjectDocuments, createDocument, updateDocument, deleteDocument } from '../api/documents.js'
import Layout from '../components/Layout.jsx'
import TiptapEditor from '../components/TiptapEditor.jsx'

const TYPE_CONFIG = {
  wiki:          { label: 'Wiki',          classes: 'bg-indigo-100 text-indigo-700' },
  specification: { label: 'Spec',          classes: 'bg-amber-100 text-amber-700' },
  meeting_notes: { label: 'Meeting Notes', classes: 'bg-emerald-100 text-emerald-700' },
  other:         { label: 'Other',         classes: 'bg-slate-100 text-slate-600' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.other
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

const SAVE_DELAY_MS = 1500

export default function ProjectDocuments() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject]       = useState(null)
  const [documents, setDocuments]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saveState, setSaveState]   = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [creating, setCreating]     = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newType, setNewType]       = useState('wiki')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const saveTimer = useRef(null)

  useEffect(() => {
    Promise.all([getProject(projectId), getProjectDocuments(projectId)])
      .then(([proj, docs]) => {
        setProject(proj)
        setDocuments(docs)
        if (docs.length > 0) setSelected(docs[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const handleContentChange = useCallback((content) => {
    if (!selected) return
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const updated = await updateDocument(selected.id, { content })
        setDocuments((prev) => prev.map((d) => d.id === updated.id ? updated : d))
        setSelected((prev) => prev?.id === updated.id ? updated : prev)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
      }
    }, SAVE_DELAY_MS)
  }, [selected])

  const handleSelectDoc = (doc) => {
    clearTimeout(saveTimer.current)
    setSelected(doc)
    setSaveState('idle')
    setEditingTitle(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const doc = await createDocument(projectId, { title: newTitle.trim(), type: newType })
      setDocuments((prev) => [doc, ...prev])
      setSelected(doc)
      setCreating(false)
      setNewTitle('')
      setNewType('wiki')
    } catch {}
  }

  const handleTitleSave = async () => {
    if (!selected || !titleDraft.trim() || titleDraft === selected.title) {
      setEditingTitle(false)
      return
    }
    try {
      const updated = await updateDocument(selected.id, { title: titleDraft.trim() })
      setDocuments((prev) => prev.map((d) => d.id === updated.id ? updated : d))
      setSelected(updated)
    } catch {}
    setEditingTitle(false)
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteDocument(docId)
      const remaining = documents.filter((d) => d.id !== docId)
      setDocuments(remaining)
      setSelected(remaining.length > 0 ? remaining[0] : null)
    } catch {}
  }

  const startEditTitle = () => {
    setTitleDraft(selected?.title ?? '')
    setEditingTitle(true)
  }

  if (loading) {
    return <Layout><div className="flex justify-center py-20 text-slate-400 text-sm">Loading…</div></Layout>
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate(`/projects/${projectId}`)} className="text-slate-400 hover:text-slate-600 transition-colors">
              ← {project?.name ?? 'Project'}
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-700">Documents</span>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            + New Document
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar — document list */}
          <div className="w-60 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto">
            {/* New document form */}
            {creating && (
              <form onSubmit={handleCreate} className="p-3 border-b border-slate-200 bg-white space-y-2">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none bg-white"
                >
                  {Object.entries(TYPE_CONFIG).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Create
                  </button>
                  <button type="button" onClick={() => setCreating(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 && !creating ? (
              <div className="p-4 text-center text-xs text-slate-400 mt-4">
                No documents yet.<br />Click <strong>+ New Document</strong> to start.
              </div>
            ) : (
              <ul className="py-1">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        selected?.id === doc.id
                          ? 'bg-indigo-50 border-r-2 border-indigo-500'
                          : 'hover:bg-white'
                      }`}
                    >
                      <p className={`text-sm font-medium truncate ${selected?.id === doc.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <TypeBadge type={doc.type} />
                        <span className="text-xs text-slate-400">{formatDate(doc.updatedAt)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Main editor area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {selected ? (
              <>
                {/* Document header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex-1 min-w-0">
                    {editingTitle ? (
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false) }}
                        className="text-xl font-bold text-slate-900 w-full border-b-2 border-indigo-400 outline-none bg-transparent pb-0.5"
                      />
                    ) : (
                      <h1
                        onClick={startEditTitle}
                        className="text-xl font-bold text-slate-900 cursor-text hover:text-indigo-700 transition-colors truncate"
                        title="Click to rename"
                      >
                        {selected.title}
                      </h1>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <TypeBadge type={selected.type} />
                      <span className="text-xs text-slate-400">
                        Created by {selected.creator?.name} · {formatDate(selected.createdAt)}
                      </span>
                      {selected.lastEditor?.id !== selected.creator?.id && (
                        <span className="text-xs text-slate-400">
                          · Edited by {selected.lastEditor?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {saveState === 'saving' && (
                      <span className="text-xs text-slate-400 animate-pulse">Saving…</span>
                    )}
                    {saveState === 'saved' && (
                      <span className="text-xs text-emerald-600">✓ Saved</span>
                    )}
                    {saveState === 'error' && (
                      <span className="text-xs text-red-500">Save failed</span>
                    )}
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete document"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                  <TiptapEditor
                    key={selected.id}
                    content={selected.content}
                    onChange={handleContentChange}
                    placeholder="Start writing your document…"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-medium text-slate-500">Select a document to start editing</p>
                <p className="text-xs mt-1">or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
