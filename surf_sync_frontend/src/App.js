import React, { useState, useEffect, useRef } from 'react';
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

/**
 * PUBLIC_INTERFACE
 * Main App for SurfSync (modern, mobile-friendly, with ocean-inspired, Material-like polish)
 */
function App() {
  // Main app state
  const [theme, setTheme] = useState('light');
  const [tab, setTab] = useState('sessions'); // sessions, stats, filter
  // --- Snackbar state for animated feedback ---
  const [snack, setSnack] = useState({ show: false, msg: "", error: false });
  const snackTimeout = useRef(null);
  // --- Sample Sessions for Demo ---
  const sampleSessions = [
    {
      id: 101,
      date: "2024-06-01",
      spot: "Pipeline",
      board: "Shortboard",
      waveCount: 15,
      mood: 5,
      swell: "2-3m",
      wind: "Offshore",
      tide: "High",
      notes: "Epic morning session, barrels and clean faces. Crowded but worth it!"
    },
    {
      id: 102,
      date: "2024-05-29",
      spot: "Ocean Beach",
      board: "Funboard",
      waveCount: 8,
      mood: 3,
      swell: "1-2m",
      wind: "Cross-Off",
      tide: "Rising",
      notes: "Fun peaks, a bit mushy, wind picked up midway. Not many out."
    },
    {
      id: 103,
      date: "2024-05-23",
      spot: "Trestles",
      board: "Fish",
      waveCount: 18,
      mood: 4,
      swell: "1-2m",
      wind: "None",
      tide: "Mid",
      notes: "All-time fish session, glassy, playful. Dolphins at the lineup!"
    },
    {
      id: 104,
      date: "2024-05-15",
      spot: "Snapper Rocks",
      board: "Longboard",
      waveCount: 11,
      mood: 2,
      swell: "<1m",
      wind: "Onshore",
      tide: "Low",
      notes: "Tough conditions and lots of chop. Got a few fun noserides though."
    },
    {
      id: 105,
      date: "2024-04-30",
      spot: "Mavericks",
      board: "Shortboard",
      waveCount: 3,
      mood: 1,
      swell: "3m+",
      wind: "Offshore",
      tide: "Dropping",
      notes: "Huge day. Only went out for a couple, came in pretty humbled."
    }
  ];

  const [sessions, setSessions] = useState(() => {
    // If localStorage has data, use it; otherwise use demo samples
    const stored = localStorage.getItem("surf_sessions");
    if (stored && stored !== "[]") return JSON.parse(stored);
    return sampleSessions;
  });

  // Utility for user feedback (snackbar/notification)
  const showSnackbar = (msg, options={error:false, timeout:1800}) => {
    setSnack({ show: true, msg, error: options.error });
    if (snackTimeout.current) clearTimeout(snackTimeout.current);
    snackTimeout.current = setTimeout(() => setSnack({ show: false, msg: "", error: false }), options.timeout||1800);
  };
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
    showSnackbar("Ready to log a new session!");
  };
  const handleEditSession = (s) => {
    setEditingSession({ ...s });
    setShowSessionModal(true);
    showSnackbar("Editing session 📝");
  };
  const handleDeleteSession = (id) => {
    if (window.confirm("Delete this surf session?")) {
      setSessions(sessions.filter(s => s.id !== id));
      showSnackbar("Session deleted", { error: false });
    }
  };
  const handleSaveSession = (data) => {
    if (!data.spot.trim()) {
      showSnackbar("Spot is required", { error: true, timeout: 2400 });
      return;
    }
    if (!data.date) {
      showSnackbar("Date required", { error: true, timeout: 2200 });
      return;
    }
    if (!data.board) {
      showSnackbar("Select board", { error: true, timeout: 2400 });
      return;
    }
    if (data.id) {
      setSessions(sessions.map(s => (s.id === data.id ? data : s)));
      showSnackbar("Session updated!");
    } else {
      setSessions([
        ...sessions,
        { ...data, id: Date.now() }
      ]);
      showSnackbar("Surf session logged! 🏄");
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
    <div className="App">
      {/* Background moved to CSS via .App/body in App.css/surfsync.css for hot-reload & theme override consistency. */}
      <TopNav tab={tab} setTab={setTab} setShowStats={setShowStats} setShowReminderUI={setShowReminderUI} />
      <main style={{ marginTop: 56, paddingBottom: 95, minHeight: '60vh', transition: 'all .3s' }}>
        {/* Home - Session cards */}
        {(tab === 'sessions' && (
          <SessionList
            sessions={filteredSessions}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
            boards={boards}
            moods={moodsDefault}
          />
        ))}
        {(tab === 'filter' && (
          <FilterPanel
            boards={boards}
            moods={moodsDefault}
            filter={filter}
            onChange={handleSetFilter}
            onReset={resetFilter}
            allSpots={Array.from(new Set(sessions.map(s => s.spot).concat(spotsDefault)))}
          />
        ))}
        {(showStats || tab === 'stats') && (
          <StatsDashboard sessions={sessions} boards={boards} moods={moodsDefault} />
        )}
      </main>
      {/* Floating Action Button with Material animation */}
      <button
        className="fab material-fab"
        title="Log new session"
        aria-label="Log new session"
        onClick={handleNewSession}
        tabIndex={0}
        style={{ animation: 'fabPop .37s cubic-bezier(.34,1.56,.5,1)'}}
      >
        {icons.add}
        <span className="sr-only">Log new session</span>
      </button>
      {/* Theme toggle with extra affordance */}
      <button
        className="theme-toggle"
        onClick={() => {
          setTheme(t => t === "light" ? "dark" : "light");
          showSnackbar(`Switched to ${theme === "light" ? "dark" : "light"} mode`);
        }}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        tabIndex={0}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      {/* session modal */}
      {showSessionModal &&
        <Modal onClose={() => setShowSessionModal(false)}>
          <SessionForm
            onSave={handleSaveSession}
            boards={boards}
            moods={moodsDefault}
            editing={editingSession}
            allSpots={Array.from(new Set(sessions.map(s => s.spot).concat(spotsDefault)))}
            showSnackbar={showSnackbar}
          />
        </Modal>
      }
      {/* reminder modal */}
      {showReminderUI &&
        <Modal onClose={() => setShowReminderUI(false)}>
          <ReminderUI
            value={reminder}
            onChange={setReminder}
          />
        </Modal>
      }
      {/* Snackbar = animated confirmation/error feedback */}
      <Snackbar open={snack.show} message={snack.msg} error={snack.error} />
      {/* First-time onboarding cue */}
      {!sessions.length &&
        <div className="onboard-cue" style={{
          position: 'fixed', bottom: 105, right: 24, left: 24, zIndex: 2100,
          textAlign: 'center', pointerEvents: 'none', fontWeight: 600,
          color: '#1978a0', fontSize: 18, background: '#fffde7bb',
          borderRadius: 10, padding: 10, boxShadow: '0 1px 12px #2196f366',
          animation: 'slideUp .8s cubic-bezier(.33,1,.44,1) .3s 1 forwards'
        }}>
          Tap the <b style={{fontSize:24}}>{icons.add}</b> button to log your first surf!
        </div>
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

/** Surf session create/edit form, with modern validations and Material UX polish */
function SessionForm({ onSave, boards, moods, editing, allSpots, showSnackbar }) {
  const [date, setDate] = useState(editing?.date || dateToISO(new Date()));
  const [spot, setSpot] = useState(editing?.spot || "");
  const [board, setBoard] = useState(editing?.board || boards[0].name);
  const [waveCount, setWaveCount] = useState(editing?.waveCount || 0);
  const [mood, setMood] = useState(editing?.mood || moods[3].value);
  const [swell, setSwell] = useState(editing?.swell || swellsDefault[0]);
  const [wind, setWind] = useState(editing?.wind || windsDefault[0]);
  const [tide, setTide] = useState(editing?.tide || tidesDefault[1]);
  const [notes, setNotes] = useState(editing?.notes || "");

  const [errors, setErrors] = useState({});
  const formRef = useRef();

  // Graceful validation (show message, mark error/field)
  const validate = () => {
    let errs = {};
    if (!spot.trim()) errs.spot = "Spot required";
    if (!date) errs.date = "Date required";
    if (!board) errs.board = "Choose a board";
    if (Number(waveCount) < 0) errs.waveCount = "Can't be negative";
    if (Number(waveCount) > 200) errs.waveCount = "Too many!";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showSnackbar && showSnackbar("Please correct errors", { error: true, timeout: 2600 });
      return;
    }
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

  // Focus first field when opened
  useEffect(() => {
    setTimeout(() => {
      if (formRef.current) {
        const input = formRef.current.querySelector('input, select, textarea');
        if (input) input.focus();
      }
    }, 150);
  }, []);

  return (
    <form className="surf-form" onSubmit={handleSubmit} style={{ minWidth: 280 }} ref={formRef} noValidate>
      <h2>{editing ? "Edit Surf Session" : "Log New Surf Session"}</h2>
      <label>
        Date:
        <input
          type="date"
          value={dateToISO(date)}
          onChange={e => setDate(e.target.value)}
          required
          className={errors.date ? "has-error" : ""}
        />
        {errors.date && <span className="form-err">{errors.date}</span>}
      </label>
      <label>
        Spot:
        <input
          list="spot-options"
          value={spot}
          onChange={e => setSpot(e.target.value)}
          placeholder="e.g. Pipeline"
          required
          pattern=".{2,}"
          className={errors.spot ? "has-error" : ""}
          inputMode="text"
        />
        <datalist id="spot-options">
          {allSpots.map(s => <option key={s} value={s} />)}
        </datalist>
        {errors.spot && <span className="form-err">{errors.spot}</span>}
      </label>
      <label>
        Board:
        <select value={board} onChange={e => setBoard(e.target.value)} className={errors.board ? "has-error" : ""}>
          {boards.map(b => <option key={b.name} value={b.name}>{b.icon} {b.name}</option>)}
        </select>
        {errors.board && <span className="form-err">{errors.board}</span>}
      </label>
      <label>
        Waves:
        <input
          type="number"
          min={0}
          max={200}
          value={waveCount}
          onChange={e => setWaveCount(e.target.value)}
          required
          className={errors.waveCount ? "has-error" : ""}
          inputMode="numeric"
        />
        {errors.waveCount && <span className="form-err">{errors.waveCount}</span>}
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
              tabIndex={0}
              autoFocus={editing && editing.mood === m.value}
              onKeyDown={e => {
                if (e.key === " " || e.key === "Enter") e.currentTarget.click();
              }}
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
          inputMode="text"
        />
      </label>
      <button className="btn-primary" type="submit">{editing ? "Save" : "Log Session"}</button>
    </form>
  );
}

/** Modal/dialog infrastructure, with accessibility, ARIA, Material popup animation, focus trap. */
function Modal({ children, onClose }) {
  // Trap keyboard focus within modal
  const modalRef = useRef();
  useEffect(() => {
    const close = (e) => { if (e.key === "Escape") onClose(); };
    const trapFocus = (e) => {
      if (e.key === "Tab" && modalRef.current) {
        const focusEls = modalRef.current.querySelectorAll('button, [tabindex="0"], input, select, textarea');
        const first = focusEls[0], last = focusEls[focusEls.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("keydown", trapFocus);
    };
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true">
      <div className="modal-dialog popup-animate" ref={modalRef} tabIndex={-1} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close" tabIndex={0}>&times;</button>
        {children}
      </div>
    </div>
  );
}

/** Snackbar (animated, Material-like pop from bottom) */
function Snackbar({ open, message, error }) {
  return (
    <div className={"snackbar" + (open ? " show" : "") + (error ? " is-error" : "")}
      role="status"
      aria-live="polite"
    >
      {message}
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
