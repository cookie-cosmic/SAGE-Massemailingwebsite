import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { School, SchoolType } from './types'
import { SCHOOL_TYPES } from './types'
import { schools } from './data/schools'
import { schoolsInRadius } from './utils/geo'
import { exportCsv, exportTxt } from './utils/exports'

const PASSWORD_HASH = '5fba196191c55421b988a5207d70bdb8ab6709a4ef59c184c2f588a39f02fc9a'
const initialCenter = { lat: 32.7876, lng: -96.797 }
const markerColors: Record<SchoolType, string> = { Elementary: '#2e9f68', Middle: '#4285d4', 'High School': '#e39b39', 'College / University': '#8c61c9' }
const markerIcon = (type: SchoolType) => L.divIcon({ className: 'school-marker-wrap', html: `<span class="school-marker" style="background:${markerColors[type]}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] })

function SearchCursor({ onMove }: { onMove: (center: { lat: number; lng: number }) => void }) {
  useMapEvents({ mousemove: (event) => onMove(event.latlng) })
  return null
}

function ZoomRadius({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) })
  return null
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    const hash = Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
    if (hash === PASSWORD_HASH) onLogin()
    else { setPassword(''); setError('Incorrect password. Please try again.') }
  }
  return <main className="login-shell"><div className="login-card">
    <div className="sage-mark">SAGE<span>.</span></div><p className="eyebrow">INTERNAL OPERATIONS</p>
    <h1>Mass Emailing Tool</h1><p className="muted">Institutional School Contact Finder</p>
    <form onSubmit={submit}><label htmlFor="password">Password</label><input id="password" autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter access password" /><button className="primary-button" type="submit">ENTER <span>→</span></button>{error && <p className="error-text">{error}</p>}</form>
    <p className="login-footnote">Authorized SAGE personnel only</p>
  </div></main>
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />
  return <Dashboard onLogout={() => setAuthenticated(false)} />
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [center, setCenter] = useState(initialCenter)
  const [radius, setRadius] = useState(5)
  const [selectedTypes, setSelectedTypes] = useState<SchoolType[]>(SCHOOL_TYPES)
  const [results, setResults] = useState<Array<{ school: School; distance: number }>>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [notice, setNotice] = useState('')
  const visibleResults = useMemo(() => results.filter(({ school }) => selectedTypes.includes(school.type)), [results, selectedTypes])
  const selected = visibleResults.filter(({ school }) => selectedIds.includes(school.id))
  const emails = [...new Set(selected.map(({ school }) => school.email).filter((email): email is string => Boolean(email)))]
  const grouped = SCHOOL_TYPES.map((type) => ({ type, items: visibleResults.filter(({ school }) => school.type === type) })).filter(({ items }) => items.length)
  const runSearch = () => {
    setSearching(true); setSearched(false)
    window.setTimeout(() => { setResults(schoolsInRadius(schools, center, radius)); setSelectedIds([]); setSearching(false); setSearched(true) }, 500)
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Enter' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) runSearch() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })
  const updateRadiusFromZoom = (zoom: number) => setRadius(Math.min(50, Math.max(0.25, Number((50 / 2 ** (zoom - 4)).toFixed(2)))))
  const toggleType = (type: SchoolType) => setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])
  const toggleSchool = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2500) }
  const selectAll = () => setSelectedIds(visibleResults.map(({ school }) => school.id))
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="sage-wordmark">SAGE<span>.</span></div><div className="brand-divider" /><div><strong>Mass Emailing Tool</strong><small>Institutional Contact Finder</small></div></div><div className="header-stats"><div><span>RADIUS</span><b>{radius.toFixed(1)} mi</b></div><div><span>SCHOOLS</span><b>{visibleResults.length}</b></div><div><span>EMAILS</span><b>{new Set(visibleResults.map(({ school }) => school.email).filter(Boolean)).size}</b></div><button className="logout-button" onClick={onLogout}>Log out</button></div></header>
    <div className="workspace">
      <section className="map-area"><MapContainer center={[initialCenter.lat, initialCenter.lng]} zoom={12} zoomControl={true} scrollWheelZoom className="map">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <SearchCursor onMove={setCenter} />
        <ZoomRadius onZoom={updateRadiusFromZoom} />
        {searched && <Circle center={[center.lat, center.lng]} radius={radius * 1609.344} pathOptions={{ color: results.length ? '#209461' : '#d64949', fillColor: results.length ? '#35aa72' : '#e45555', fillOpacity: 0.14, weight: 2 }} />}
        {visibleResults.map(({ school, distance }) => <Marker key={school.id} position={[school.lat, school.lng]} icon={markerIcon(school.type)}><Popup><strong>{school.name}</strong><br />{distance.toFixed(1)} miles away<br />{school.email ?? 'No public email listed'}</Popup></Marker>)}
      </MapContainer>
      <div className="map-overlay"><div className="radius-display"><span>SEARCH RADIUS</span><strong>{radius.toFixed(1)} <small>miles</small></strong><input aria-label="Search radius" type="range" min="0.25" max="50" step="0.25" value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></div><div className="map-hint"><span className="crosshair">⊕</span> Move cursor to position search area<br /><b>Press ENTER</b> or click search to find schools</div></div>
      <div className="floating-filters"><p className="panel-label">SCHOOL TYPES</p>{SCHOOL_TYPES.map((type) => <label key={type} className="check-row"><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} /><span className="custom-check" />{type}</label>)}<button className="search-button" onClick={runSearch}>{searching ? 'SEARCHING...' : 'SEARCH AREA'} <span>⌕</span></button></div>
      {searched && <div className={`search-status ${results.length ? 'success' : 'empty'}`}><span>{results.length ? '✓' : '!'}</span><div><b>{results.length ? `${results.length} schools found` : 'No schools found in this area'}</b><small>{results.length ? `${new Set(results.map(({ school }) => school.email).filter(Boolean)).size} public emails available` : 'Try moving the search area or increasing the radius.'}</small></div></div>}
      {notice && <div className="toast">{notice}</div>}
    </section>
    <aside className="results-panel"><div className="results-heading"><div><p className="eyebrow">DIRECTORY SEARCH</p><h2>Search Results</h2></div><span className="result-count">{visibleResults.length}</span></div><div className="result-summary"><div><span>SCHOOLS FOUND</span><b>{visibleResults.length}</b></div><div><span>PUBLIC EMAILS</span><b>{new Set(visibleResults.map(({ school }) => school.email).filter(Boolean)).size}</b></div></div><div className="selection-actions"><button onClick={selectAll}>Select all</button><button onClick={() => setSelectedIds([])}>Deselect all</button></div><div className="cards">{grouped.map(({ type, items }) => <div className="school-group" key={type}><h3><span className="type-dot" style={{ background: markerColors[type] }} />{type}<em>{items.length}</em></h3>{items.map(({ school, distance }) => <article className={`school-card ${selectedIds.includes(school.id) ? 'selected' : ''}`} key={school.id} onClick={() => toggleSchool(school.id)}><input type="checkbox" checked={selectedIds.includes(school.id)} onChange={() => toggleSchool(school.id)} onClick={(event) => event.stopPropagation()} /><div className="school-info"><h4>{school.name}</h4><span className="school-type">{school.type}</span><p>{school.address}<br />{school.city}, {school.state} {school.zip}</p><div className="contact-line">{school.email ? <a href={`mailto:${school.email}`} onClick={(event) => event.stopPropagation()}>{school.email}</a> : <span className="no-email">No public email listed</span>}<a href={`https://${school.website}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{school.website} ↗</a></div><small className="distance">{distance.toFixed(1)} miles away</small></div></article>)}</div>)}</div><div className="email-dock"><div className="dock-title"><div><p className="eyebrow">SELECTED EMAILS</p><b>{emails.length} unique {emails.length === 1 ? 'address' : 'addresses'}</b></div><span className="email-badge">{selected.length} selected</span></div><div className="email-list">{emails.length ? emails.map((email) => <span key={email}>{email}</span>) : <span className="placeholder">Select schools to collect their public contacts</span>}</div><div className="export-actions"><button disabled={!emails.length} onClick={() => { navigator.clipboard.writeText(emails.join('\n')); notify(`Copied ${emails.length} email addresses.`) }}>Copy selected</button><button disabled={!selected.length} onClick={() => exportCsv(selected)}>Export CSV</button><button disabled={!emails.length} onClick={() => exportTxt(emails)}>Export TXT</button></div></div></aside>
  </div></div>
}

export default App
