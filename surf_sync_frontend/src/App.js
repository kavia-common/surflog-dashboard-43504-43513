import React, { useState, useEffect } from 'react';
import './App.css';

// Icons as emoji fallback, can be replaced by SVGs in /assets later
const icons = {
  wave: "🌊",
  wind: "🌬️",
  tide: "🌙",
  sun: "☀️",
  surfboard: "🏄‍♂️",
  mood: ["😩", "😕", "😐", "🙂", "😄"],
  stats: "📈",
  filter: "🔎",
  add: "➕"
};

const oceanBackground = {
  background: "linear-gradient(135deg,#2196f3 60%,#20bba8 100%)",
  backgroundRepeat: "no-repeat",
  minHeight: "100vh"
};

const boardsDefault = [
  { name: "Shortboard", icon: "🏄‍♂️" },
  { name: "Longboard", icon: "🏄‍♀️" },
  { name: "Fish", icon: "🐟" },
  { name: "Funboard", icon: "🦈" },
];

const spotsDefault = [
  "Pipeline",
  "Trestles",
  "Mavericks",
  "Ocean Beach",
  "Snapper Rocks"
];

const moodsDefault = [
  { value: 1, label: "Tired", icon: "😩", color: "#90caf9" },
  { value: 2, label: "Subpar", icon: "😕", color: "#b3e5fc" },
  { value: 3, label: "Meh", icon: "😐", color: "#ffecb3" },
  { value: 4, label: "Good", icon: "🙂", color: "#4dd0e1" },
  { value: 5, label: "Stoked", icon: "😄", color: "#fff59d" },
];

const swellsDefault = ["<1m", "1-2m", "2-3m", "3m+"];
const windsDefault = ["Offshore", "Cross-Off", "Onshore", "None"];
const tidesDefault = ["High", "Mid", "Low", "Rising", "Dropping"];

function dateToISO(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// --- COMPONENTS ---

// PUBLIC_INTERFACE
function App() {
  // Main app state
  const [theme, setTheme] = useState('light');
  const [tab, setTab] = useState('sessions'); // sessions, stats, filter
  const [sessions, setSessions] = useState(() =>
    JSON.parse(localStorage.getItem("surf_sessions") || "[]")
  );
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filter, setFilter] = useState({ spot: "", board: "", mood: "" });
  const [boards, setBoards] = useState(() =>
    JSON.parse(localStorage.getItem("surf_boards") || JSON.stringify(boardsDefault))
  );
  const [reminder, setReminder] = useState(() =>
    localStorage.getItem("surf_reminder") || "18:00"
  );
  const [showReminderUI, setShowReminderUI] = useState(false);

  // --- Effects ----
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("surf_sessions", JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    localStorage.setItem("surf_boards", JSON.stringify(boards));
  }, [boards]);
  useEffect(() => {
    localStorage.setItem("surf_reminder", reminder);
  }, [reminder]);

  // --- Handlers ---
  const handleNewSession = () => {
    setEditingSession(null);
    setShowSessionModal(true);
  };
  const handleEditSession = (s) => {
    setEditingSession({ ...s });
    setShowSessionModal(true);
  };
  const handleDeleteSession = (id) => {
    if (window.confirm("Delete this surf session?"))
      setSessions(sessions.filter(s => s.id !== id));
  };
  const handleSaveSession = (data) => {
    if (data.id) {
      setSessions(sessions.map(s => (s.id === data.id ? data : s)));
    } else {
      setSessions([
        ...sessions,
        { ...data, id: Date.now() }
      ]);
    }
    setShowSessionModal(false);
  };
  const handleSetFilter = (filt) => setFilter({ ...filter, ...filt });
  const filteredSessions = sessions.filter(session =>
    (!filter.spot || session.spot === filter.spot) &&
    (!filter.board || session.board === filter.board) &&
    (!filter.mood || session.mood === filter.mood)
  );
  const resetFilter = () => setFilter({ spot: "", board: "", mood: "" });

  // --- Main render ---
  return (
    <div className="App" style={oceanBackground}>
      <TopNav tab={tab} setTab={setTab} setShowStats={setShowStats} setShowReminderUI={setShowReminderUI} />
      <main style={{ marginTop: 56, paddingBottom: 76 }}>
        {/* Home - Session cards */}
        {tab === 'sessions' &&
          <SessionList
            sessions={filteredSessions}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
            boards={boards}
            moods={moodsDefault}
          />
        }
        {tab === 'filter' &&
          <FilterPanel
            boards={boards}
            moods={moodsDefault}
            filter={filter}
            onChange={handleSetFilter}
            onReset={resetFilter}
            allSpots={Array.from(new Set(sessions.map(s => s.spot).concat(spotsDefault)))}
          />}
        {showStats || tab === 'stats' ?
          <StatsDashboard sessions={sessions} boards={boards} moods={moodsDefault} /> : null
        }
      </main>
      <button
        className="fab"
        title="Log new session"
        aria-label="Log new session"
        onClick={handleNewSession}
      >
        {icons.add}
      </button>
      <button
        className="theme-toggle"
        onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      {showSessionModal &&
        <Modal onClose={() => setShowSessionModal(false)}>
          <SessionForm
            onSave={handleSaveSession}
            boards={boards}
            moods={moodsDefault}
            editing={editingSession}
            allSpots={Array.from(new Set(sessions.map(s => s.spot).concat(spotsDefault)))}
          />
        </Modal>
      }
      {showReminderUI &&
        <Modal onClose={() => setShowReminderUI(false)}>
          <ReminderUI
            value={reminder}
            onChange={setReminder}
          />
        </Modal>
      }
    </div>
  );
}

// Top navigation bar
function TopNav({ tab, setTab, setShowStats, setShowReminderUI }) {
  return (
    <nav className="topnav">
      <span className={`topnav-title`}>SurfSync</span>
      <button className={`topnav-btn${tab === "sessions" ? " active" : ""}`} onClick={() => setTab("sessions")}>{icons.wave} Sessions</button>
      <button className={`topnav-btn${tab === "stats" ? " active" : ""}`}
        onClick={() => { setTab("stats"); setShowStats(true); }}>{icons.stats} Stats</button>
      <button className={`topnav-btn${tab === "filter" ? " active" : ""}`}
        onClick={() => setTab("filter")}>{icons.filter} Filters</button>
      <button className="topnav-btn" onClick={() => setShowReminderUI(true)}>{icons.sun} Reminder</button>
    </nav>
  );
}

// List of sessions as cards
function SessionList({ sessions, onEdit, onDelete, boards, moods }) {
  if (!sessions.length) return (
    <div style={{ marginTop: 32, color: "#fff" }}>
      <h2>No surf sessions logged yet.</h2>
      <p>Tap <span role="img" aria-label="plus">{icons.add}</span> to log your first surf session!</p>
    </div>
  );
  return (
    <div className="card-list" style={{ padding: 8 }}>
      {sessions.sort((a, b) => b.date.localeCompare(a.date)).map(session =>
        <SessionCard
          key={session.id}
          session={session}
          onEdit={() => onEdit(session)}
          onDelete={() => onDelete(session.id)}
          boards={boards}
          moods={moods}
        />
      )}
    </div>
  );
}

// Individual session card
function SessionCard({ session, onEdit, onDelete, boards, moods }) {
  const boardIcon = boards.find(b => b.name === session.board)?.icon || icons.surfboard;
  const moodObj = moods.find(m => m.value === session.mood) || { icon: "❓", label: "?" };
  const bg = `linear-gradient(120deg,rgba(33,150,243,0.96),rgba(32,187,168,0.81) 99%)`;
  return (
    <div className="surf-card"
      style={{
        background: bg,
        color: "#fff",
        borderRadius: 18,
        margin: 12,
        padding: 16,
        boxShadow: "0 2px 18px rgba(33,85,140, 0.13)",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{moodObj.icon}</span>
        <div style={{ flex: 1 }}>
          <div>
            <b>{session.spot}</b> &bull; <span>{dateToISO(session.date)}</span>
          </div>
          <div>Board: <span>{boardIcon} {session.board}</span></div>
        </div>
        <button className="edit-btn" onClick={onEdit} style={{ background: "none", border: "none", color: "#fff", fontSize: 18 }}>✏️</button>
        <button className="del-btn" onClick={onDelete} style={{ background: "none", border: "none", color: "#fff", fontSize: 18 }}>🗑️</button>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 14 }}>
        <span title="waves">{icons.wave} {session.waveCount} waves</span>
        <span title="swell">{icons.wave} Swell: {session.swell}</span>
        <span title="wind">{icons.wind} {session.wind}</span>
        <span title="tide">{icons.tide} {session.tide}</span>
      </div>
      {session.notes &&
        <div className="notes" style={{
          paddingTop: 8,
          fontStyle: "italic",
          color: "#fce4b4"
        }}>Notes: {session.notes}</div>}
    </div>
  );
}

// Edit/Create surf session form modal
function SessionForm({ onSave, boards, moods, editing, allSpots }) {
  const [date, setDate] = useState(editing?.date || dateToISO(new Date()));
  const [spot, setSpot] = useState(editing?.spot || "");
  const [board, setBoard] = useState(editing?.board || boards[0].name);
  const [waveCount, setWaveCount] = useState(editing?.waveCount || 0);
  const [mood, setMood] = useState(editing?.mood || moods[3].value);
  const [swell, setSwell] = useState(editing?.swell || swellsDefault[0]);
  const [wind, setWind] = useState(editing?.wind || windsDefault[0]);
  const [tide, setTide] = useState(editing?.tide || tidesDefault[1]);
  const [notes, setNotes] = useState(editing?.notes || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editing?.id,
      date,
      spot: spot.trim(),
      board,
      waveCount: Number(waveCount),
      mood,
      swell,
      wind,
      tide,
      notes: notes.trim()
    });
  };

  return (
    <form className="surf-form" onSubmit={handleSubmit} style={{ minWidth: 280 }}>
      <h2>{editing ? "Edit Surf Session" : "Log New Surf Session"}</h2>
      <label>Date:<input type="date" value={dateToISO(date)} onChange={e => setDate(e.target.value)} required /></label>
      <label>
        Spot:
        <input
          list="spot-options"
          value={spot}
          onChange={e => setSpot(e.target.value)}
          placeholder="e.g. Pipeline"
          required
        />
        <datalist id="spot-options">
          {allSpots.map(s => <option key={s} value={s} />)}
        </datalist>
      </label>
      <label>
        Board:
        <select value={board} onChange={e => setBoard(e.target.value)}>
          {boards.map(b => <option key={b.name} value={b.name}>{b.icon} {b.name}</option>)}
        </select>
      </label>
      <label>
        Waves:
        <input type="number" min={0} max={200} value={waveCount}
          onChange={e => setWaveCount(e.target.value)} required />
      </label>
      <div className="section-moods">
        Mood:
        <div className="mood-picker">
          {moods.map(m =>
            <button key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={"mood-btn" + (mood === m.value ? " selected" : "")}
              style={{
                background: mood === m.value ? m.color : "transparent",
                fontSize: 24,
                margin: 4,
                borderRadius: 8,
                border: mood === m.value ? "2px solid #2196f3" : "1px solid #aaa"
              }}
              aria-label={m.label}
            >{m.icon}</button>
          )}
        </div>
      </div>
      <label>
        Swell:
        <select value={swell} onChange={e => setSwell(e.target.value)}>
          {swellsDefault.map(sw => <option key={sw} value={sw}>{sw}</option>)}
        </select>
      </label>
      <label>
        Wind:
        <select value={wind} onChange={e => setWind(e.target.value)}>
          {windsDefault.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>
      <label>
        Tide:
        <select value={tide} onChange={e => setTide(e.target.value)}>
          {tidesDefault.map(ti => <option key={ti} value={ti}>{ti}</option>)}
        </select>
      </label>
      <label>
        Notes:
        <textarea rows={2} maxLength={160}
          placeholder="Wave faces, crowds, vibe, etc."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </label>
      <button className="btn-primary" type="submit">{editing ? "Save" : "Log Session"}</button>
    </form>
  );
}

// Modal/dialog infrastructure
function Modal({ children, onClose }) {
  useEffect(() => {
    const close = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        {children}
      </div>
    </div>
  );
}

// Stats dashboard
function StatsDashboard({ sessions, boards, moods }) {
  if (!sessions.length) return (
    <div className="stats-empty">
      <h2>No session data yet. Log sessions to see your stats!</h2>
    </div>
  );
  // Stats: board usage
  const boardCounts = {};
  boards.forEach(b => { boardCounts[b.name] = 0; });
  sessions.forEach(s => { if (boardCounts[s.board] !== undefined) boardCounts[s.board]++; });

  // Most surfed spot
  const spotCounts = {};
  sessions.forEach(s => { spotCounts[s.spot] = (spotCounts[s.spot] || 0) + 1; });
  const mostSpot = Object.keys(spotCounts).reduce((a, c) => spotCounts[c] > (spotCounts[a] || 0) ? c : a, "");

  // Mood trend per date (simple line graph replacement as emoji bar)
  const dates = [...new Set(sessions.map(s => s.date))].sort();
  const dateMood = {};
  sessions.forEach(s => {
    dateMood[s.date] = Math.max(dateMood[s.date] || 0, s.mood);
  });

  return (
    <div className="stats-panel">
      <h2>{icons.stats} Session Stats</h2>
      <div className="stat-block">
        <strong>Board usage:</strong>
        <ul>
          {Object.keys(boardCounts).map(b => (
            <li key={b}>{boards.find(brd => brd.name === b)?.icon || icons.surfboard} {b}: {boardCounts[b]}</li>
          ))}
        </ul>
      </div>
      <div className="stat-block">
        <strong>Most surfed spot:</strong>
        <span style={{ fontWeight: 600, marginLeft: 6 }}>{mostSpot || "N/A"}</span>
      </div>
      <div className="stat-block">
        <strong>Mood Trend:</strong>
        <div className="mood-trend">
          {dates.map(d =>
            <div key={d} style={{ display: "inline-block", textAlign: "center", width: 36, margin: 2 }}>
              <div style={{ fontSize: 20 }}>{moods.find(m => m.value === dateMood[d])?.icon || "?"}</div>
              <div style={{ fontSize: 10 }}>{d.slice(-5)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Filter/search bar
function FilterPanel({ filter, onChange, onReset, boards, moods, allSpots }) {
  return (
    <form className="filter-panel" style={{ background: "#fce4b4", padding: 16, borderRadius: 16, margin: 16, maxWidth: 390, marginLeft: "auto", marginRight: "auto" }}
      onSubmit={e => e.preventDefault()}>
      <h2>{icons.filter} Filter surf sessions</h2>
      <label>
        Spot:
        <select value={filter.spot} onChange={e => onChange({ spot: e.target.value })}>
          <option value="">--Any--</option>
          {allSpots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>
        Board:
        <select value={filter.board} onChange={e => onChange({ board: e.target.value })}>
          <option value="">--Any--</option>
          {boards.map(b => <option key={b.name} value={b.name}>{b.icon} {b.name}</option>)}
        </select>
      </label>
      <label>
        Mood:
        <select value={filter.mood} onChange={e => onChange({ mood: e.target.value })}>
          <option value="">--Any--</option>
          {moods.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
        </select>
      </label>
      <button className="btn-secondary" onClick={onReset} style={{ marginTop: 10 }}>Clear filters</button>
    </form>
  );
}

// Daily Reminder UI
function ReminderUI({ value, onChange }) {
  return (
    <div className="reminder-panel">
      <h2>{icons.sun} Surf Log Reminder</h2>
      <label>
        Reminder time:
        <input
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </label>
      <div style={{ fontSize: 12, marginTop: 12, color: "#2196f3" }}>
        <b>Experimental:</b> SurfSync will remind you to log a session at this time each day, if browser notifications are enabled.
      </div>
    </div>
  );
}

export default App;
