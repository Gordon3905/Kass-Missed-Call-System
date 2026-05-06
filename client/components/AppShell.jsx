import { BellRing, PhoneIncoming, RefreshCw, Settings2, Users } from 'lucide-react';

const tabs = [
  { id: 'calls', label: 'Missed Calls', icon: PhoneIncoming },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export function AppShell({ client, status, busy, style, activeTab, onTabChange, onProcessDemo, onEscalate, children }) {
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
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>{activeTab === 'calls' ? 'Missed Calls' : activeTab === 'leads' ? 'Leads' : 'Settings'}</h1>
            <p>{status}</p>
          </div>
          <div className="topbar-actions">
            {activeTab === 'calls' ? (
              <>
                <button className="ghost-button" type="button" disabled={busy} onClick={onEscalate}>
                  <BellRing size={16} />
                  Escalate stale
                </button>
                <button className="primary-button" type="button" disabled={busy} onClick={onProcessDemo}>
                  <RefreshCw size={16} />
                  Process sample
                </button>
              </>
            ) : null}
          </div>
        </header>
        <div className="content-flow">{children}</div>
      </main>
    </div>
  );
}
