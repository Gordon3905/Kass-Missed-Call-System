import { BellRing, PhoneIncoming, Radar, RefreshCw } from 'lucide-react';

export function AppShell({ client, status, busy, style, onProcessDemo, onEscalate, children }) {
  return (
    <div className="app-shell" style={style}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">KA</div>
          <div>
            <strong>{client?.brand_name || 'Kavor Calls'}</strong>
            <span>Kavor Automation System</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          <a href="#overview" className="active"><Radar size={16} /> Overview</a>
          <a href="#calls"><PhoneIncoming size={16} /> Missed Calls</a>
          <a href="#settings"><BellRing size={16} /> Follow-Up</a>
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Kavor Calls</h1>
            <p>{client?.name || 'Loading client'} · {status}</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" disabled={busy} onClick={onEscalate}>
              <BellRing size={16} />
              Escalate stale
            </button>
            <button className="primary-button" type="button" disabled={busy} onClick={onProcessDemo}>
              <RefreshCw size={16} />
              Process sample
            </button>
          </div>
        </header>
        <div id="overview" className="content-flow">
          {children}
        </div>
      </main>
    </div>
  );
}
