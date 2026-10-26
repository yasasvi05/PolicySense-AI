import { useRef, useState } from 'react'
import { Check, FileUp, Trash2 } from 'lucide-react'
import { api } from '../../services'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { ConfirmDialog, DataTable, ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import { cx, fmtDate } from '../../utils'

const STEPS = ['Upload PDF', 'Extract Text', 'Chunk Document', 'Generate Embeddings', 'Store in ChromaDB', 'Ready for Retrieval']

export default function Documents() {
  const toast = useToast()
  const inputRef = useRef()
  const { data, loading, error, reload } = useAsync(() => api.getDocuments())
  const [file, setFile] = useState(null)
  const [type, setType] = useState('Health')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null) // { steps:[{name,done}], active:number }
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pick = (f) => {
    if (!f) return
    if (!/\.(pdf|txt)$/i.test(f.name)) return toast('Only PDF or TXT files are supported', 'error')
    if (f.size > 15 * 1024 * 1024) return toast('File is larger than 15 MB', 'error')
    setFile(f)
  }

  const upload = async () => {
    setBusy(true)
    setProgress({ steps: STEPS.map((name) => ({ name, done: false })), active: 0 })
    let i = 0
    const tick = setInterval(() => { i = Math.min(i + 1, STEPS.length - 1); setProgress((p) => ({ ...p, active: i })) }, 700) // visual only while waiting
    try {
      const res = await api.uploadDocument(file, type)
      setProgress({ steps: res.steps, active: -1 })
      toast(res.status === 'Failed' ? `Processing failed: ${res.detail}` : `${res.filename} processed: ${res.status}`, res.status === 'Failed' ? 'error' : 'success')
      if (res.status === 'Chunked') toast(res.detail, 'info')
      setFile(null)
      reload()
    } catch (e) { toast(e.message, 'error'); setProgress(null) } finally { clearInterval(tick); setBusy(false) }
  }

  const remove = async () => {
    setDeleting(true)
    try { await api.deleteDocument(toDelete.id); toast('Document deleted'); setToDelete(null); reload() } catch (e) { toast(e.message, 'error') } finally { setDeleting(false) }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  const cols = [
    { key: 'filename', label: 'Document Name', sortable: true, render: (r) => <span className="font-semibold">{r.filename}</span> },
    { key: 'policy_type', label: 'Policy Type', sortable: true },
    { key: 'uploaded_at', label: 'Uploaded Date', sortable: true, render: (r) => fmtDate(r.uploaded_at) },
    { key: 'chunk_count', label: 'Chunks', sortable: true, render: (r) => `${r.chunk_count} chunks` },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <span title={r.detail || ''}><StatusBadge status={r.status} /></span> },
    { key: 'a', label: 'Actions', render: (r) => <button className="rounded-lg p-2 text-navy-400 hover:bg-red-50 hover:text-red-600" onClick={() => setToDelete(r)} aria-label={`Delete ${r.filename}`}><Trash2 className="h-4 w-4" /></button> },
  ]

  return (
    <div>
      <PageHeader title="Document Management" subtitle="Policy documents are split into chunks, embedded and indexed so the assistant can quote the exact clause." />
      <section className="card mb-6 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div onClick={() => inputRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
              role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
              className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-navy-200 px-4 py-8 text-center transition hover:border-azure-500 hover:bg-azure-50/40">
              <FileUp className="h-7 w-7 text-azure-600" />
              <p className="mt-2 text-sm font-semibold">{file ? file.name : 'Drop a policy PDF here, or browse'}</p>
              <p className="text-xs text-navy-400">PDF or TXT, up to 15 MB</p>
              <input ref={inputRef} type="file" accept=".pdf,.txt" hidden onChange={(e) => pick(e.target.files[0])} />
            </div>
            <div className="mt-3 flex gap-2">
              <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Policy type">{['Health', 'Motor', 'Life', 'General'].map((t) => <option key={t}>{t}</option>)}</select>
              <button className="btn-primary whitespace-nowrap" disabled={!file || busy} onClick={upload}>{busy && <Spinner />}Upload & index</button>
            </div>
          </div>
          <ol className="space-y-1.5" aria-label="Ingestion progress">
            {(progress?.steps || STEPS.map((name) => ({ name, done: false }))).map((s, i) => {
              const active = busy && progress?.active === i
              const done = busy ? i < progress.active : s.done
              return (
                <li key={s.name} className={cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm', active ? 'bg-azure-50 text-azure-700' : done ? 'text-navy-800' : 'text-navy-400')}>
                  <span className={cx('grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-emerald-500 text-white' : active ? 'bg-azure-600 text-white' : 'bg-navy-100')}>
                    {done ? <Check className="h-3 w-3" /> : active ? <Spinner className="h-3 w-3" /> : i + 1}</span>{s.name}
                </li>)
            })}
          </ol>
        </div>
      </section>
      <DataTable loading={loading} columns={cols} rows={data || []} searchKeys={['filename', 'policy_type']} filterKey="policy_type" filterLabel="All types" />
      <ConfirmDialog danger open={!!toDelete} loading={deleting} title="Delete document?" confirmLabel="Delete" onClose={() => setToDelete(null)} onConfirm={remove}
        message={`“${toDelete?.filename}” and its ${toDelete?.chunk_count} chunks will be removed from the knowledge base. The assistant will stop citing it.`} />
    </div>
  )
}
