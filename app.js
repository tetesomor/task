const { useState, useEffect, useCallback, createElement: h } = React;

// ---- palette ----
const BG = '#050505';
const BG2 = '#101010';
const INK = '#F7F7F7';
const YELLOW = '#FDDB53';
const RED = '#F94D4D';
const BLUE = '#3AA3F3';
const GREY = '#7A7A78';
const ORANGE = '#FCA218';
const GREEN = '#8CE175';
const PURPLE = '#8A60FD';
const PINK = '#E355FA';
const CYAN = '#1BEAFF';
const MUTED = '#8A8A88';
const BORDER = '#232323';

const QUADRANTS = [
  { id: 'do', label: 'do now', sub: 'urgent and important', color: RED },
  { id: 'plan', label: 'schedule', sub: 'important, not urgent', color: YELLOW },
  { id: 'delegate', label: 'delegate', sub: 'urgent, not important', color: BLUE },
  { id: 'drop', label: 'drop', sub: 'not urgent, not important', color: GREY },
];

const AREA_COLORS = [GREEN, ORANGE, PURPLE, CYAN, PINK, BLUE];

const STORAGE_KEY = 'task-tasks-v1';
const AREAS_KEY = 'task-areas-v1';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultAreas() {
  return [
    { id: uid(), name: 'work', color: AREA_COLORS[0], note: '' },
    { id: uid(), name: 'coaching', color: AREA_COLORS[1], note: '' },
    { id: uid(), name: 'personal', color: AREA_COLORS[2], note: '' },
  ];
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---- shared inline styles ----
const styles = {
  heading: { textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.02em' },
  btn: {
    border: `1px solid ${BORDER}`, background: BG2, borderRadius: 8,
    padding: '6px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    color: INK, display: 'inline-flex', alignItems: 'center', gap: 6,
    textTransform: 'lowercase', fontFamily: 'Inter, system-ui, sans-serif',
  },
  btnActive: { background: INK, color: BG, borderColor: INK },
  input: {
    border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif', width: '100%', boxSizing: 'border-box',
    background: BG2, color: INK, textTransform: 'lowercase',
  },
  pill: {
    borderRadius: 999, padding: '4px 11px', fontSize: 12.5, fontWeight: 500,
    border: `1px solid ${BORDER}`, cursor: 'pointer', whiteSpace: 'nowrap',
    textTransform: 'lowercase', fontFamily: 'Inter, system-ui, sans-serif',
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', color: MUTED },
  taskRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
    background: BG2, borderRadius: 8, marginBottom: 6, border: `1px solid ${BORDER}`,
    borderLeft: `3px solid ${BORDER}`,
  },
  quad: { borderRadius: 12, padding: 10, minHeight: 120, background: BG2, border: `1px solid ${BORDER}`, borderLeft: '4px solid' },
  noteBox: {
    background: BG2, border: `1px dashed ${BORDER}`, borderRadius: 10, padding: '10px 12px',
    fontSize: 13, color: '#C9C9C7', marginTop: 6,
  },
};

function Icon({ name, size = 15, color = 'currentColor', fill = 'none' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'plus') return h('svg', common, h('line', { x1: 12, y1: 5, x2: 12, y2: 19 }), h('line', { x1: 5, y1: 12, x2: 19, y2: 12 }));
  if (name === 'x') return h('svg', common, h('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), h('line', { x1: 6, y1: 6, x2: 18, y2: 18 }));
  if (name === 'check') return h('svg', common, h('polyline', { points: '20 6 9 17 4 12' }));
  if (name === 'circle') return h('svg', common, h('circle', { cx: 12, cy: 12, r: 9 }));
  if (name === 'star') return h('svg', { ...common, fill }, h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26' }));
  return null;
}

function TaskRow({ task, area, quadrants, onToggleDone, onToggleVital, onRemove, onMove, showQuadrantLabel, colourByQuadrant }) {
  const q = quadrants.find(x => x.id === task.quadrant);
  const rowStyle = { ...styles.taskRow, opacity: task.done ? 0.45 : 1 };
  if (colourByQuadrant && q) rowStyle.borderLeftColor = q.color;

  return h('div', { style: rowStyle },
    h('button', {
      style: { ...styles.iconBtn, marginTop: 1 },
      onClick: () => onToggleDone(task.id),
      'aria-label': task.done ? 'mark not done' : 'mark done',
    }, h(Icon, { name: task.done ? 'check' : 'circle', color: task.done ? INK : MUTED })),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', { style: { fontSize: 14, textDecoration: task.done ? 'line-through' : 'none', wordBreak: 'break-word', color: INK, textTransform: 'lowercase' } }, task.title),
      h('div', { style: { display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' } },
        area && h('span', { style: { fontSize: 11, color: BG, background: area.color, borderRadius: 999, padding: '2px 8px', textTransform: 'lowercase' } }, area.name),
        showQuadrantLabel && q && h('span', { style: { fontSize: 11, color: q.color, textTransform: 'lowercase' } }, q.label),
        showQuadrantLabel && h('select', {
          value: task.quadrant,
          onChange: e => onMove(task.id, e.target.value),
          style: { fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '1px 4px', background: BG2, color: '#C9C9C7', textTransform: 'lowercase' },
        }, quadrants.map(qq => h('option', { key: qq.id, value: qq.id }, qq.label)))
      )
    ),
    h('button', { style: styles.iconBtn, onClick: () => onToggleVital(task.id), 'aria-label': task.vital ? 'unmark vital' : 'mark vital' },
      h(Icon, { name: 'star', fill: task.vital ? YELLOW : 'none', color: task.vital ? YELLOW : MUTED })),
    h('button', { style: styles.iconBtn, onClick: () => onRemove(task.id), 'aria-label': 'delete task' },
      h(Icon, { name: 'x' }))
  );
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const loaded = loadJSON(STORAGE_KEY, []);
    const now = Date.now();
    const pruned = loaded.filter(t => !(t.done && t.doneAt && now - t.doneAt > TWO_WEEKS_MS));
    if (pruned.length !== loaded.length) saveJSON(STORAGE_KEY, pruned);
    return pruned;
  });
  const [areas, setAreas] = useState(() => {
    const loaded = loadJSON(AREAS_KEY, null);
    return loaded && loaded.length ? loaded : defaultAreas();
  });
  const [view, setView] = useState('matrix');
  const [activeArea, setActiveArea] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuadrant, setNewQuadrant] = useState('do');
  const [newArea, setNewArea] = useState('');
  const [newVital, setNewVital] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [showAreaAdd, setShowAreaAdd] = useState(false);
  const [editingNoteFor, setEditingNoteFor] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [error, setError] = useState('');

  const saveTasks = useCallback((next) => {
    setTasks(next);
    if (!saveJSON(STORAGE_KEY, next)) {
      setError('could not save just now, but your changes are still here');
      setTimeout(() => setError(''), 3000);
    }
  }, []);

  const saveAreas = useCallback((next) => {
    setAreas(next);
    if (!saveJSON(AREAS_KEY, next)) {
      setError('could not save just now, but your changes are still here');
      setTimeout(() => setError(''), 3000);
    }
  }, []);

  useEffect(() => {
    if (areas.length && !newArea) setNewArea(areas[0].id);
  }, [areas, newArea]);

  useEffect(() => {
    if (view === 'vital') setNewVital(true);
  }, [view]);

  function addTask() {
    if (!newTitle.trim()) {
      setError('give the task a name first');
      return;
    }
    const task = {
      id: uid(),
      title: newTitle.trim(),
      quadrant: newQuadrant,
      areaId: newArea || (areas[0] && areas[0].id) || null,
      vital: view === 'vital' ? true : newVital,
      done: false,
      doneAt: null,
      createdAt: Date.now(),
    };
    saveTasks([task, ...tasks]);
    setNewTitle('');
    setNewVital(view === 'vital');
    setShowAdd(false);
    setError('');
  }

  function toggleDone(id) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null } : t));
  }
  function toggleVital(id) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, vital: !t.vital } : t));
  }
  function removeTask(id) {
    saveTasks(tasks.filter(t => t.id !== id));
  }
  function moveQuadrant(id, quadrant) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, quadrant } : t));
  }
  function addArea() {
    if (!newAreaInput.trim()) return;
    const area = { id: uid(), name: newAreaInput.trim(), color: AREA_COLORS[areas.length % AREA_COLORS.length], note: '' };
    saveAreas([...areas, area]);
    setNewAreaInput('');
    setShowAreaAdd(false);
  }
  function removeArea(id) {
    saveAreas(areas.filter(a => a.id !== id));
    saveTasks(tasks.map(t => t.areaId === id ? { ...t, areaId: null } : t));
  }
  function openNoteEditor(area) {
    setEditingNoteFor(area.id);
    setNoteDraft(area.note || '');
  }
  function saveNote(id) {
    saveAreas(areas.map(a => a.id === id ? { ...a, note: noteDraft.trim() } : a));
    setEditingNoteFor(null);
  }

  const visibleTasks = tasks.filter(t => activeArea === 'all' || t.areaId === activeArea);
  const areaById = Object.fromEntries(areas.map(a => [a.id, a]));
  const activeAreaObj = activeArea !== 'all' ? areaById[activeArea] : null;

  return h('div', { style: { fontFamily: 'Inter, system-ui, sans-serif', background: BG, minHeight: '100vh', padding: '1.5rem 1rem 2rem' } },
    h('div', { style: { maxWidth: 720, margin: '0 auto' } },

      h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 } },
        h('h1', { style: { ...styles.heading, fontSize: 22, fontWeight: 700, margin: 0, color: INK } }, 'TASK'),
        h('div', { style: { display: 'flex', gap: 6 } },
          h('button', { style: { ...styles.btn, ...(view === 'matrix' ? styles.btnActive : {}) }, onClick: () => setView('matrix') }, 'matrix'),
          h('button', { style: { ...styles.btn, ...(view === 'vital' ? styles.btnActive : {}) }, onClick: () => setView('vital') }, 'vital 20%')
        )
      ),

      error && h('div', { style: { background: '#1F0E0E', border: `1px solid ${RED}`, color: '#FFB3B3', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 } }, error),

      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem', alignItems: 'center' } },
        h('button', {
          style: { ...styles.pill, background: activeArea === 'all' ? INK : BG2, color: activeArea === 'all' ? BG : '#C9C9C7' },
          onClick: () => setActiveArea('all'),
        }, 'all areas'),
        areas.map(a => h('button', {
          key: a.id,
          style: { ...styles.pill, background: activeArea === a.id ? a.color : BG2, color: activeArea === a.id ? BG : '#C9C9C7' },
          onClick: () => setActiveArea(a.id),
        }, a.name)),
        h('button', {
          style: { ...styles.iconBtn, border: `1px dashed ${BORDER}`, borderRadius: 999, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
          onClick: () => setShowAreaAdd(v => !v),
          'aria-label': 'add area',
        }, h(Icon, { name: 'plus', size: 14 }))
      ),

      activeAreaObj && (
        editingNoteFor === activeAreaObj.id
          ? h('div', { style: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 6 } },
              h('textarea', {
                style: { ...styles.input, minHeight: 60, resize: 'vertical', textTransform: 'none' },
                placeholder: "what's the vital 20% in this area right now?",
                value: noteDraft,
                onChange: e => setNoteDraft(e.target.value),
                autoFocus: true,
              }),
              h('div', { style: { display: 'flex', gap: 8 } },
                h('button', { style: { ...styles.btn, ...styles.btnActive }, onClick: () => saveNote(activeAreaObj.id) }, 'save note'),
                h('button', { style: styles.btn, onClick: () => setEditingNoteFor(null) }, 'cancel')
              )
            )
          : h('div', {
              style: { ...styles.noteBox, cursor: 'pointer', marginBottom: '1rem' },
              onClick: () => openNoteEditor(activeAreaObj),
            }, activeAreaObj.note
              ? h(React.Fragment, null, h('strong', { style: { color: INK } }, 'the 20% that matters here: '), activeAreaObj.note)
              : h('span', null, `tap to note what the vital 20% is for ${activeAreaObj.name}`))
      ),

      showAreaAdd && h('div', { style: { display: 'flex', gap: 6, marginBottom: '1.25rem' } },
        h('input', {
          style: styles.input, placeholder: 'new area name', value: newAreaInput,
          onChange: e => setNewAreaInput(e.target.value),
          onKeyDown: e => e.key === 'Enter' && addArea(),
        }),
        h('button', { style: styles.btn, onClick: addArea }, 'add')
      ),

      areas.length > 0 && h('details', { style: { marginBottom: '1.25rem' } },
        h('summary', { style: { fontSize: 12.5, color: MUTED, cursor: 'pointer', textTransform: 'lowercase' } }, 'manage areas'),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 } },
          areas.map(a => h('span', {
            key: a.id,
            style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, background: BG2, border: `1px solid ${BORDER}`, color: '#C9C9C7', borderRadius: 999, padding: '3px 4px 3px 10px', textTransform: 'lowercase' },
          }, a.name, h('button', { style: { ...styles.iconBtn, padding: 2 }, onClick: () => removeArea(a.id), 'aria-label': `remove ${a.name}` }, h(Icon, { name: 'x', size: 12 }))))
        )
      ),

      !showAdd
        ? h('button', { style: { ...styles.btn, marginBottom: '1.5rem' }, onClick: () => setShowAdd(true) }, h(Icon, { name: 'plus', size: 14 }), ' add a task')
        : h('div', { style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: 8 } },
            h('input', {
              style: styles.input, placeholder: 'what needs doing?', value: newTitle,
              onChange: e => setNewTitle(e.target.value),
              onKeyDown: e => e.key === 'Enter' && addTask(),
              autoFocus: true,
            }),
            h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
              h('select', { style: { ...styles.input, width: 'auto', flex: '1 1 140px' }, value: newQuadrant, onChange: e => setNewQuadrant(e.target.value) },
                QUADRANTS.map(q => h('option', { key: q.id, value: q.id }, q.label))),
              h('select', { style: { ...styles.input, width: 'auto', flex: '1 1 140px' }, value: newArea, onChange: e => setNewArea(e.target.value) },
                areas.map(a => h('option', { key: a.id, value: a.id }, a.name)))
            ),
            view === 'vital'
              ? h('div', { style: { fontSize: 13, color: YELLOW, display: 'flex', alignItems: 'center', gap: 4 } },
                  h(Icon, { name: 'star', size: 13, fill: YELLOW, color: YELLOW }), "added here, so it's marked vital automatically")
              : h('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#C9C9C7' } },
                  h('input', { type: 'checkbox', checked: newVital, onChange: e => setNewVital(e.target.checked) }),
                  'mark as vital (the 20% that matters most)'),
            h('div', { style: { display: 'flex', gap: 8 } },
              h('button', { style: { ...styles.btn, ...styles.btnActive }, onClick: addTask }, 'add task'),
              h('button', { style: styles.btn, onClick: () => { setShowAdd(false); setError(''); } }, 'cancel')
            )
          ),

      view === 'matrix' && h('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 10 } },
        QUADRANTS.map(q => {
          const items = visibleTasks.filter(t => t.quadrant === q.id);
          return h('div', { key: q.id, style: { ...styles.quad, borderLeftColor: q.color } },
            h('div', { style: { marginBottom: 8 } },
              h('div', { style: { ...styles.heading, fontSize: 14, fontWeight: 700, color: q.color } }, q.label),
              h('div', { style: { fontSize: 12, color: MUTED, textTransform: 'lowercase' } }, q.sub)
            ),
            items.length === 0
              ? h('div', { style: { fontSize: 13, color: MUTED } }, 'nothing here')
              : items.map(t => h(TaskRow, { key: t.id, task: t, area: areaById[t.areaId], quadrants: QUADRANTS, onToggleDone: toggleDone, onToggleVital: toggleVital, onRemove: removeTask, onMove: moveQuadrant }))
          );
        })
      ),

      view === 'vital' && h('div', null,
        h('p', { style: { fontSize: 13, color: MUTED, marginTop: 0, marginBottom: 12 } }, "the 20% of tasks that'll likely drive 80% of your results. keep this list short and honest."),
        visibleTasks.filter(t => t.vital).length === 0
          ? h('div', { style: { fontSize: 13, color: MUTED, padding: '1rem 0' } }, 'nothing marked as vital yet. add one above, or tap the star on any task below.')
          : visibleTasks.filter(t => t.vital).map(t => h(TaskRow, { key: t.id, task: t, area: areaById[t.areaId], quadrants: QUADRANTS, onToggleDone: toggleDone, onToggleVital: toggleVital, onRemove: removeTask, onMove: moveQuadrant, showQuadrantLabel: true, colourByQuadrant: true })),
        h('div', { style: { marginTop: 20, fontSize: 12.5, color: MUTED, textTransform: 'uppercase', fontWeight: 600 } }, 'ALL OTHER TASKS'),
        h('div', { style: { marginTop: 8 } },
          visibleTasks.filter(t => !t.vital).map(t => h(TaskRow, { key: t.id, task: t, area: areaById[t.areaId], quadrants: QUADRANTS, onToggleDone: toggleDone, onToggleVital: toggleVital, onRemove: removeTask, onMove: moveQuadrant, showQuadrantLabel: true, colourByQuadrant: true }))
        )
      ),

      h('p', { style: { fontSize: 11.5, color: '#4A4A48', marginTop: '2rem', textAlign: 'center' } }, 'completed tasks clear themselves after two weeks')
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
