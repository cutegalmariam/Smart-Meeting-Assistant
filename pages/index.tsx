// pages/index.tsx
import { useState, useEffect, useRef } from 'react'

type Hit = { meetingId: string; text: string; score: number; idx: number }
type MeetingMeta = { id: string; idx: number; title: string; imageUrl: string }

/* ------------------ helpers ------------------ */
const toast = (msg: string, ok = true) =>
    document.body.dispatchEvent(new CustomEvent('toast', { detail: { msg, ok } }))

const percent = (n: number) => (n * 100).toFixed(1) + '%'

/* ------------------ component ------------------ */
export default function Home() {
    const [meetings, setMeetings] = useState<MeetingMeta[]>([])
    const [sel, setSel] = useState<any | null>(null)
    const [hits, setHits] = useState<Hit[]>([])
    const [q, setQ] = useState('')
    const [uploading, setUploading] = useState(false)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const dropRef = useRef<HTMLDivElement>(null)

    /* theme --------------------------------------- */
    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
        const sysPref = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        setTheme(stored ?? sysPref)
    }, [])
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    /* list on load -------------------------------- */
    useEffect(() => {
        fetch('/api/list').then(r => r.json()).then(setMeetings)
    }, [])

    /* toast listener ------------------------------ */
    useEffect(() => {
        const fn = (e: any) => {
            const n = document.createElement('div')
            n.textContent = e.detail.msg
            n.className = 'toast ' + (e.detail.ok ? 'ok' : 'err')
            document.body.appendChild(n)
            setTimeout(() => n.remove(), 2500)
        }
        document.body.addEventListener('toast', fn)
        return () => document.body.removeEventListener('toast', fn)
    }, [])

    /* drag-drop ----------------------------------- */
    useEffect(() => {
        const el = dropRef.current
        if (!el) return
        const over = (e: any) => (e.preventDefault(), el.classList.add('over'))
        const leave = () => el.classList.remove('over')
        const drop = (e: any) => {
            e.preventDefault()
            leave()
            if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
        }
        el.addEventListener('dragover', over)
        el.addEventListener('dragleave', leave)
        el.addEventListener('drop', drop)
        return () => {
            el.removeEventListener('dragover', over)
            el.removeEventListener('dragleave', leave)
            el.removeEventListener('drop', drop)
        }
    }, [])

    /* actions ------------------------------------- */
    const refresh = () =>
        fetch('/api/list').then(r => r.json()).then(setMeetings)

    const handleUpload = async (file: File) => {
        setUploading(true)
        toast(`Uploading ${file.name}…`)
        const res = await fetch('/api/upload', { method: 'POST', body: file })
        setUploading(false)
        toast(res.ok ? 'Processed 🎉' : 'Server error', res.ok)
        if (res.ok) refresh()
    }

    const search = async () => {
        if (!q.trim()) return
        const { hits } = await fetch('/api/search?q=' + encodeURIComponent(q)).then(
            r => r.json(),
        )
        setHits(hits)
    }

    const openMeeting = async (id: string) => {
        const full = await fetch('/api/meeting?id=' + id).then(r => r.json())
        setSel(full)
    }

    /* ------------------ render ------------------- */
    return (
        <>
            <aside>
                <h2>📂 Meetings</h2>
                <div className="mList">
                    {meetings.map(m => (
                        <div key={m.id} className="mItem" onClick={() => openMeeting(m.id)}>
                            <img src={m.imageUrl} />
                            <span>{`#${m.idx} • ${m.title}`}</span>
                        </div>
                    ))}
                </div>
            </aside>

            <main>
                <header>
                    <h1>🚀 Meeting Insights</h1>
                    <button
                        className="themeBtn"
                        onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </header>

                <div
                    ref={dropRef}
                    className="drop"
                    onClick={() => document.getElementById('file')!.click()}
                >
                    {uploading ? 'Processing…' : 'Drag audio/video here or click'}
                    <input
                        id="file"
                        type="file"
                        accept="audio/*,video/*"
                        hidden
                        onChange={e => e.target.files && handleUpload(e.target.files[0])}
                    />
                </div>

                <div className="searchBox">
                    <input
                        placeholder="Search knowledge base…"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                    />
                    <button onClick={search}>Search</button>
                </div>

                {hits.length > 0 && (
                    <ul className="hits">
                        {hits.map(h => (
                            <li key={h.text.slice(0, 40)}>
                                <div className="bar" style={{ width: percent(h.score) }} />
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            `<strong style="color:var(--accent)">#${h.idx}</strong> ` +
                                            highlight(h.text, q),
                                    }}
                                />
                                <em>{percent(h.score)}</em>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            {sel && (
                <div className="overlay" onClick={() => setSel(null)}>
                    <article onClick={e => e.stopPropagation()}>
                        <header>
                            <h3>{`#${sel.idx} — ${sel.title}`}</h3>
                            <button onClick={() => setSel(null)}>✕</button>
                        </header>
                        <img src={sel.imageUrl} />
                        <section>
                            <h4>Actions</h4>
                            <ul>
                                {sel.actions.map((a: any, i: number) => (
                                    <li key={i}>
                                        {a.title} — <strong>{a.owner}</strong>{' '}
                                        {a.due && <small>(due {a.due})</small>}
                                        {sel.calendarLinks[i] && (
                                            <a target="_blank" href={sel.calendarLinks[i]}>
                                                📅
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <details>
                            <summary>Transcript</summary>
                            <pre
                                dangerouslySetInnerHTML={{
                                    __html: sel.transcript.replace(
                                        /S(\d+):/g,
                                        (_, n) =>
                                            `<strong style="color:${speakerColor(+n)}">S${n}:</strong>`,
                                    ),
                                }}
                            />
                        </details>
                    </article>
                </div>
            )}

            {/* ================== styles ================== */}
            <style jsx global>{`
        :root {
          --bg: #ffffff;
          --fg: #111827;
          --sub: #4b5563;
          --accent: #6366f1;
          --card: #f9fafb;
          --border: #e5e7eb;
          --toast-ok: #10b981;
          --toast-err: #ef4444;
        }
        [data-theme='dark'] {
          --bg: #111827;
          --fg: #f9fafb;
          --sub: #9ca3af;
          --accent: #8b5cf6;
          --card: #1f2937;
          --border: #374151;
          --toast-ok: #10b981;
          --toast-err: #ef4444;
        }
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          background: var(--bg);
          color: var(--fg);
        }
        * {
          box-sizing: border-box;
        }
        aside {
          position: fixed;
          inset: 0 auto 0 0;
          width: 260px;
          border-right: 1px solid var(--border);
          padding: 1rem;
          background: var(--card);
          overflow-y: auto;
        }
        main {
          margin-left: 260px;
          padding: 2rem 3rem;
          font-family: system-ui, sans-serif;
        }
        h1 {
          margin: 0;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .themeBtn {
          font-size: 1.4rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent);
        }
        .drop {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 2.5rem;
          text-align: center;
          margin-bottom: 1.5rem;
          cursor: pointer;
          color: var(--sub);
          transition: background 0.2s;
        }
        .drop.over {
          background: var(--card);
        }
        .searchBox {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .searchBox input {
          flex: 1;
          padding: 0.6rem;
          font-size: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--fg);
        }
        .searchBox button {
          padding: 0 1rem;
          background: var(--accent);
          border: none;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
        }
        .hits {
          list-style: none;
          padding: 0;
        }
        .hits li {
          position: relative;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
          border-left: 4px solid var(--accent);
        }
        .hits .bar {
          position: absolute;
          height: 100%;
          top: 0;
          left: -4px;
          background: var(--accent);
          opacity: 0.25;
        }
        .hits em {
          font-size: 0.8rem;
          color: var(--sub);
        }
        .mList {
          margin-top: 1rem;
        }
        .mItem {
          display: flex;
          align-items: center;
          margin-bottom: 0.8rem;
          cursor: pointer;
        }
        .mItem img {
          width: 44px;
          height: 44px;
          object-fit: cover;
          border-radius: 6px;
          margin-right: 0.5rem;
        }
        .mItem span {
          color: var(--fg);
        }
        /* modal */
        .overlay {
          position: fixed;
          inset: 0;
          background: #0008;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        article {
          background: var(--card);
          padding: 1.4rem;
          border-radius: 12px;
          width: 90%;
          max-width: 640px;
          max-height: 90vh;
          overflow-y: auto;
          color: var(--fg);
        }
        article header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        article img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
        }
        article ul {
          padding-left: 1.2rem;
        }
        /* toast */
        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: #fff;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          pointer-events: none;
          opacity: 0;
          animation: fade 2.5s ease forwards;
        }
        .toast.ok {
          background: var(--toast-ok);
        }
        .toast.err {
          background: var(--toast-err);
        }
        @keyframes fade {
          0% {
            opacity: 0;
            transform: translate(-50%, 30px);
          }
          10%,
          90% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
        mark {
          background: var(--accent);
          color: #fff;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
        </>
    )
}

/* keyword highlight helper */
function highlight(text: string, term: string) {
    if (!term) return text
    return text.replace(
        new RegExp(`(${escapeReg(term)})`, 'gi'),
        '<mark>$1</mark>',
    )
}
const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* colour speakers */
const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']
const speakerColor = (idx: number) => palette[idx % palette.length]
