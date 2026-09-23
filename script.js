/* ====================== STUDY PLANNER — SCRIPT.JS ====================== */

/* ---------- Storage helpers ---------- */
const DB = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};

const KEYS = {
  profile:'sp_userProfile', tasks:'sp_tasks', subjects:'sp_subjects', targets:'sp_targets',
  timetable:'sp_timetable', notes:'sp_notes', exams:'sp_exams', habits:'sp_habits',
  sessions:'sp_studySessions', settings:'sp_settings', theme:'sp_theme', streak:'sp_streak',
  habitLog:'sp_habitLog'
};

let state = {
  profile: DB.get(KEYS.profile, null),
  tasks: DB.get(KEYS.tasks, []),
  subjects: DB.get(KEYS.subjects, []),
  targets: DB.get(KEYS.targets, []),
  timetable: DB.get(KEYS.timetable, []),
  notes: DB.get(KEYS.notes, []),
  exams: DB.get(KEYS.exams, []),
  habits: DB.get(KEYS.habits, []),
  sessions: DB.get(KEYS.sessions, []),
  settings: DB.get(KEYS.settings, {studyMin:25, shortBreak:5, longBreak:20}),
  streak: DB.get(KEYS.streak, {current:0, longest:0, totalDays:0, lastActiveDate:null}),
  habitLog: DB.get(KEYS.habitLog, {}) // {date: {habitId: true}}
};

function saveAll(){
  DB.set(KEYS.profile, state.profile);
  DB.set(KEYS.tasks, state.tasks);
  DB.set(KEYS.subjects, state.subjects);
  DB.set(KEYS.targets, state.targets);
  DB.set(KEYS.timetable, state.timetable);
  DB.set(KEYS.notes, state.notes);
  DB.set(KEYS.exams, state.exams);
  DB.set(KEYS.habits, state.habits);
  DB.set(KEYS.sessions, state.sessions);
  DB.set(KEYS.settings, state.settings);
  DB.set(KEYS.streak, state.streak);
  DB.set(KEYS.habitLog, state.habitLog);
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function fmtDate(d){
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  return dt.toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
}

/* ---------- Date helpers (ISO <-> DD/MM/YYYY) ---------- */
function isoToDMY(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function getDateISO(id){
  const el = document.getElementById(id);
  return el ? (el.dataset.iso || '') : '';
}
function setDateISO(id, iso){
  const el = document.getElementById(id);
  if(!el) return;
  el.dataset.iso = iso || '';
  el.value = iso ? isoToDMY(iso) : '';
}

/* ---------- Custom Date Picker (works consistently on every device) ---------- */
let activeDatePopup = null;
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function closeDatePicker(){
  if(activeDatePopup){ activeDatePopup.remove(); activeDatePopup = null; }
}
document.addEventListener('click', (e)=>{
  if(activeDatePopup && !activeDatePopup.contains(e.target) && !e.target.classList.contains('date-picker-input')){
    closeDatePicker();
  }
});

function attachDatePicker(inputEl){
  inputEl.addEventListener('click', (e)=>{
    e.stopPropagation();
    openDatePicker(inputEl);
  });
}

function openDatePicker(inputEl){
  closeDatePicker();
  const iso = inputEl.dataset.iso;
  let viewDate = iso ? new Date(iso+'T00:00:00') : new Date();
  let viewYear = viewDate.getFullYear();
  let viewMonth = viewDate.getMonth();

  const popup = document.createElement('div');
  popup.className = 'datepicker-popup';
  document.body.appendChild(popup);
  activeDatePopup = popup;

  function draw(){
    const first = new Date(viewYear, viewMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
    const todayISO = todayStr();
    let cells = '';
    for(let i=0;i<startDow;i++) cells += `<button class="dp-day dp-empty"></button>`;
    for(let d=1; d<=daysInMonth; d++){
      const cellISO = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = cellISO === todayISO;
      const isSelected = cellISO === inputEl.dataset.iso;
      cells += `<button type="button" class="dp-day ${isToday?'dp-today':''} ${isSelected?'dp-selected':''}" data-iso="${cellISO}">${d}</button>`;
    }
    popup.innerHTML = `
      <div class="dp-header">
        <button type="button" class="dp-nav" data-nav="-1">‹</button>
        <span>${MONTH_NAMES[viewMonth]} ${viewYear}</span>
        <button type="button" class="dp-nav" data-nav="1">›</button>
      </div>
      <div class="dp-grid">
        ${DOW.map(d=>`<div class="dp-dow">${d}</div>`).join('')}
        ${cells}
      </div>
      <div class="dp-footer"><button type="button" class="dp-clear">Clear</button></div>
    `;
    popup.querySelectorAll('.dp-nav').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        viewMonth += parseInt(b.dataset.nav);
        if(viewMonth < 0){ viewMonth = 11; viewYear--; }
        if(viewMonth > 11){ viewMonth = 0; viewYear++; }
        draw();
      });
    });
    popup.querySelectorAll('.dp-day:not(.dp-empty)').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        setDateISO(inputEl.id, b.dataset.iso);
        closeDatePicker();
      });
    });
    popup.querySelector('.dp-clear').addEventListener('click', (ev)=>{
      ev.stopPropagation();
      setDateISO(inputEl.id, '');
      closeDatePicker();
    });
  }
  draw();

  const rect = inputEl.getBoundingClientRect();
  popup.style.top = (window.scrollY + rect.bottom + 6) + 'px';
  let left = window.scrollX + rect.left;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - 280;
  if(left > maxLeft) left = Math.max(10, maxLeft);
  popup.style.left = left + 'px';
}

function initAllDatePickers(){
  document.querySelectorAll('.date-picker-input').forEach(attachDatePicker);
}

/* ---------- Toasts ---------- */
function toast(msg){
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>{ t.remove(); }, 2800);
}

/* ---------- Initials Avatar ---------- */
function getInitials(name){
  if(!name) return '?';
  const parts = name.trim().split(/\s+/);
  let initials = parts[0][0] || '';
  if(parts.length > 1) initials += parts[1][0] || '';
  return initials.toUpperCase();
}

/* ====================== SETUP SCREEN ====================== */
const setupScreen = document.getElementById('setupScreen');
const appShell = document.getElementById('appShell');

function initApp(){
  if(!state.profile){
    setupScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
  } else {
    setupScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    renderAll();
  }
}

document.getElementById('setupForm').addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('setupName').value.trim();
  const cls = document.getElementById('setupClass').value.trim();
  const school = document.getElementById('setupSchool').value.trim();
  const city = document.getElementById('setupCity').value.trim();
  const goal = document.getElementById('setupGoal').value.trim();

  if(!name || !cls || !school){
    toast('Please fill all required fields');
    return;
  }

  state.profile = { name, class: cls, school, city, goal };
  saveAll();
  toast('Profile created successfully!');
  setupScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  renderAll();
});

/* ====================== NAVIGATION ====================== */
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    navItems.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+btn.dataset.page).classList.add('active');
    closeSidebar();
    renderAll();
  });
});

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
document.getElementById('hamburgerBtn').addEventListener('click', ()=>{
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
});
sidebarOverlay.addEventListener('click', closeSidebar);
function closeSidebar(){
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

/* ====================== THEME ====================== */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  DB.set(KEYS.theme, theme);
  const label = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  document.getElementById('themeToggleDesktop').textContent = label;
  document.getElementById('themeToggleMobile').textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(cur);
}
document.getElementById('themeToggleDesktop').addEventListener('click', toggleTheme);
document.getElementById('themeToggleMobile').addEventListener('click', toggleTheme);
document.getElementById('settingsThemeToggle').addEventListener('click', toggleTheme);
applyTheme(DB.get(KEYS.theme, 'light'));

/* ====================== LOGOUT ====================== */
function doLogout(){
  // Keep data saved but just show setup/login-like screen again by clearing "session" not the whole data.
  // Since there's no backend, "logout" simply returns user to the welcome/setup screen.
  sessionStorage.setItem('sp_loggedOut','1');
  appShell.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  toast('Logged out. Your data is safe.');
}
document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('settingsLogoutBtn').addEventListener('click', doLogout);

// If a profile exists but user pressed logout previously in this browser tab session,
// show setup screen with a quick "continue" prefill option (still requires clicking button since no backend auth).
if(state.profile && sessionStorage.getItem('sp_loggedOut') === '1'){
  document.getElementById('setupName').value = state.profile.name;
  document.getElementById('setupClass').value = state.profile.class;
  document.getElementById('setupSchool').value = state.profile.school;
  document.getElementById('setupCity').value = state.profile.city || '';
  document.getElementById('setupGoal').value = state.profile.goal || '';
}

/* ====================== SUBJECT DROPDOWNS ====================== */
const SUBJECT_SELECT_IDS = ['taskSubject','targetSubject','ttSubject','noteSubject','examSubject'];
function fillSubjectSelects(){
  SUBJECT_SELECT_IDS.forEach(id=>{
    const sel = document.getElementById(id);
    const current = sel.value;
    sel.innerHTML = '<option value="">No Subject</option>'
      + state.subjects.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')
      + '<option value="__add_new__" class="add-subject-option">➕ Add New Subject...</option>';
    sel.value = current;
  });
}

// Handle picking "Add New Subject" directly from any dropdown
SUBJECT_SELECT_IDS.forEach(id=>{
  const sel = document.getElementById(id);
  sel.addEventListener('change', function(){
    if(this.value === '__add_new__'){
      const name = prompt('New subject name:');
      if(name && name.trim()){
        const newSubject = { id: uid(), name: name.trim(), teacher:'', color: randomSubjectColor(), target: 100 };
        state.subjects.push(newSubject);
        saveAll();
        fillSubjectSelects();
        this.value = newSubject.id;
        toast('Subject "' + name.trim() + '" added!');
        renderSubjects();
      } else {
        this.value = '';
      }
    }
  });
});
function randomSubjectColor(){
  const palette = ['#4f46e5','#0ea5e9','#16a34a','#d97706','#dc2626','#7c3aed','#0d9488','#db2777'];
  return palette[Math.floor(Math.random()*palette.length)];
}
function subjectName(id){
  const s = state.subjects.find(x=>x.id===id);
  return s ? s.name : '—';
}
function subjectColor(id){
  const s = state.subjects.find(x=>x.id===id);
  return s ? s.color : '#94a3b8';
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ====================== DASHBOARD ====================== */
function renderDashboard(){
  const name = state.profile.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('greeting').textContent = `${greet}, ${name} 👋`;
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'long', year:'numeric'});

  const quotes = [
    "Small progress every day creates big results.",
    "Discipline beats motivation.",
    "Consistency is the key to mastery.",
    "Your future is created by what you do today.",
    "Push yourself, because no one else is going to do it for you.",
    "Success is the sum of small efforts repeated daily."
  ];
  document.getElementById('motivationText').textContent = quotes[Math.floor(Math.random()*quotes.length)];

  const today = todayStr();
  const todayTasks = state.tasks.filter(t=>t.date===today);
  const completedTasks = todayTasks.filter(t=>t.completed);
  const remaining = todayTasks.length - completedTasks.length;
  const progressPct = todayTasks.length ? Math.round(completedTasks.length/todayTasks.length*100) : 0;
  const todayMinutes = state.sessions.filter(s=>s.date===today).reduce((a,s)=>a+s.minutes,0);

  document.getElementById('statTotalTasks').textContent = todayTasks.length;
  document.getElementById('statCompleted').textContent = completedTasks.length;
  document.getElementById('statRemaining').textContent = remaining;
  document.getElementById('statProgress').textContent = progressPct + '%';
  document.getElementById('statStudyTime').textContent = minutesToHM(todayMinutes);
  document.getElementById('statStreak').textContent = state.streak.current + ' 🔥';
  document.getElementById('progressPercentText').textContent = progressPct + '%';
  document.getElementById('dashProgressFill').style.width = progressPct + '%';

  const targetsToday = state.targets.filter(t=>true).slice(-6).reverse();
  const dashTargets = document.getElementById('dashTargetsList');
  dashTargets.innerHTML = targetsToday.length ? targetsToday.map(t=>`
    <div class="item-card ${t.completed?'completed':''}">
      <input type="checkbox" class="item-checkbox" ${t.completed?'checked':''} onchange="toggleTarget('${t.id}')">
      <div class="item-body"><div class="item-title">${escapeHtml(t.title)}</div>
      <div class="item-meta"><span>${escapeHtml(subjectName(t.subject))}</span></div></div>
    </div>`).join('') : emptyState('No targets yet.', 'Add your first study target to get started.');

  const dashSubjects = document.getElementById('dashSubjectsList');
  dashSubjects.innerHTML = state.subjects.length ? state.subjects.map(s=>subjectMiniRow(s)).join('') : emptyState('No subjects yet.', 'Add subjects to track progress.');

  const dashExams = document.getElementById('dashExamsList');
  const upcoming = state.exams.filter(e=> new Date(e.date) >= new Date(today)).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,4);
  dashExams.innerHTML = upcoming.length ? upcoming.map(e=>{
    const days = daysRemaining(e.date);
    return `<div class="item-card"><div class="item-body"><div class="item-title">${escapeHtml(e.name)}</div>
    <div class="item-meta"><span>${fmtDate(e.date)}</span><span>${days} Days Remaining</span></div></div></div>`;
  }).join('') : emptyState('No exams added.', 'Add exams to see countdown.');
}

function subjectMiniRow(s){
  const pct = subjectProgress(s.id);
  return `<div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
      <span><span class="subject-dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</span><span>${pct}%</span>
    </div>
    <div class="subject-bar-bg"><div class="subject-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
  </div>`;
}

function subjectProgress(subjectId){
  const related = state.tasks.filter(t=>t.subject===subjectId);
  if(!related.length) return 0;
  const done = related.filter(t=>t.completed).length;
  return Math.round(done/related.length*100);
}

function daysRemaining(dateStr){
  const diff = Math.ceil((new Date(dateStr) - new Date(todayStr())) / 86400000);
  return diff < 0 ? 0 : diff;
}
function minutesToHM(mins){
  const h = Math.floor(mins/60), m = mins%60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function emptyState(title, sub, btnLabel, btnAction){
  return `<div class="empty-state"><p style="font-weight:700;">${title}</p><p>${sub}</p>${btnLabel?`<button class="btn-primary" onclick="${btnAction}">${btnLabel}</button>`:''}</div>`;
}

window.toggleTarget = function(id){
  const t = state.targets.find(x=>x.id===id);
  t.completed = !t.completed;
  saveAll();
  checkStreak();
  renderAll();
};

/* ====================== STREAK ====================== */
function checkStreak(){
  const today = todayStr();
  const anyCompletedToday = state.targets.some(t=>t.completed) || state.tasks.some(t=>t.completed && t.date===today);
  if(!anyCompletedToday) return;
  if(state.streak.lastActiveDate === today) return; // already counted today

  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(state.streak.lastActiveDate === yesterday){
    state.streak.current += 1;
  } else {
    state.streak.current = 1;
  }
  state.streak.lastActiveDate = today;
  state.streak.longest = Math.max(state.streak.longest, state.streak.current);
  state.streak.totalDays += 1;
  saveAll();
}

/* ====================== TASKS ====================== */
const taskModal = document.getElementById('taskModal');
let editingTaskId = null;

document.getElementById('openTaskModal').addEventListener('click', ()=>{
  editingTaskId = null;
  clearTaskForm();
  taskModal.classList.remove('hidden');
});
document.getElementById('cancelTaskBtn').addEventListener('click', ()=> taskModal.classList.add('hidden'));

function clearTaskForm(){
  ['taskName','taskDesc','taskStart','taskEnd','taskEstTime'].forEach(id=>document.getElementById(id).value='');
  setDateISO('taskDate', '');
  setDateISO('taskDeadline', '');
  document.getElementById('taskSubject').value='';
  document.getElementById('taskPriority').value='Medium';
  document.getElementById('taskCategory').value='Homework';
}

document.getElementById('saveTaskBtn').addEventListener('click', ()=>{
  const name = document.getElementById('taskName').value.trim();
  const date = getDateISO('taskDate');
  if(!name){ toast('Task name required'); return; }

  const taskData = {
    id: editingTaskId || uid(),
    name,
    subject: document.getElementById('taskSubject').value,
    desc: document.getElementById('taskDesc').value.trim(),
    date: date || todayStr(),
    start: document.getElementById('taskStart').value,
    end: document.getElementById('taskEnd').value,
    priority: document.getElementById('taskPriority').value,
    category: document.getElementById('taskCategory').value,
    deadline: getDateISO('taskDeadline'),
    estTime: document.getElementById('taskEstTime').value.trim(),
    completed: false
  };

  if(editingTaskId){
    const idx = state.tasks.findIndex(t=>t.id===editingTaskId);
    taskData.completed = state.tasks[idx].completed;
    state.tasks[idx] = taskData;
    toast('Task updated!');
  } else {
    state.tasks.push(taskData);
    toast('Task added successfully!');
  }
  saveAll();
  taskModal.classList.add('hidden');
  renderAll();
});

window.editTask = function(id){
  const t = state.tasks.find(x=>x.id===id);
  editingTaskId = id;
  document.getElementById('taskName').value = t.name;
  document.getElementById('taskSubject').value = t.subject;
  document.getElementById('taskDesc').value = t.desc;
  setDateISO('taskDate', t.date);
  document.getElementById('taskStart').value = t.start;
  document.getElementById('taskEnd').value = t.end;
  document.getElementById('taskPriority').value = t.priority;
  document.getElementById('taskCategory').value = t.category;
  setDateISO('taskDeadline', t.deadline);
  document.getElementById('taskEstTime').value = t.estTime;
  taskModal.classList.remove('hidden');
};

window.deleteTask = function(id){
  state.tasks = state.tasks.filter(t=>t.id!==id);
  saveAll();
  toast('Task deleted.');
  renderAll();
};

window.toggleTaskComplete = function(id){
  const t = state.tasks.find(x=>x.id===id);
  t.completed = !t.completed;
  saveAll();
  checkStreak();
  toast(t.completed ? 'Task completed!' : 'Task marked pending.');
  renderAll();
};

window.duplicateTask = function(id){
  const t = state.tasks.find(x=>x.id===id);
  const copy = {...t, id: uid(), completed:false};
  state.tasks.push(copy);
  saveAll();
  toast('Task duplicated.');
  renderAll();
};

function renderTasks(){
  const search = document.getElementById('taskSearch').value.toLowerCase();
  const filter = document.getElementById('taskFilter').value;
  const sortBy = document.getElementById('taskSort').value;
  const today = todayStr();

  let list = state.tasks.filter(t=>{
    const matchesSearch = t.name.toLowerCase().includes(search) || subjectName(t.subject).toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    if(!matchesSearch) return false;
    if(filter==='today') return t.date===today;
    if(filter==='upcoming') return t.date > today && !t.completed;
    if(filter==='completed') return t.completed;
    if(filter==='pending') return !t.completed;
    if(filter==='high') return t.priority==='High';
    return true;
  });

  if(sortBy==='date') list.sort((a,b)=> (a.date||'').localeCompare(b.date||''));
  if(sortBy==='priority'){ const order={High:0,Medium:1,Low:2}; list.sort((a,b)=>order[a.priority]-order[b.priority]); }
  if(sortBy==='subject') list.sort((a,b)=> subjectName(a.subject).localeCompare(subjectName(b.subject)));

  const container = document.getElementById('tasksList');
  if(!list.length){
    container.innerHTML = emptyState('No tasks yet.', 'Add your first study task to get started.', '+ Add Task', "document.getElementById('openTaskModal').click()");
    return;
  }
  container.innerHTML = list.map(t=>`
    <div class="item-card ${t.completed?'completed':''}">
      <input type="checkbox" class="item-checkbox" ${t.completed?'checked':''} onchange="toggleTaskComplete('${t.id}')">
      <div class="item-body">
        <div class="item-title">${escapeHtml(t.name)}</div>
        <div class="item-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          <span>${escapeHtml(subjectName(t.subject))}</span>
          <span>${t.category}</span>
          <span>${fmtDate(t.date)}</span>
          ${t.estTime?`<span>⏱️ ${escapeHtml(t.estTime)}</span>`:''}
        </div>
      </div>
      <div class="item-actions">
        <button class="icon-action" onclick="duplicateTask('${t.id}')" title="Duplicate">⧉</button>
        <button class="icon-action" onclick="editTask('${t.id}')" title="Edit">✎</button>
        <button class="icon-action" onclick="deleteTask('${t.id}')" title="Delete">🗑</button>
      </div>
    </div>`).join('');
}

document.getElementById('taskSearch').addEventListener('input', renderTasks);
document.getElementById('taskFilter').addEventListener('change', renderTasks);
document.getElementById('taskSort').addEventListener('change', renderTasks);

/* ====================== TARGETS ====================== */
document.getElementById('addTargetBtn').addEventListener('click', ()=>{
  const title = document.getElementById('targetTitle').value.trim();
  if(!title){ toast('Target title required'); return; }
  state.targets.push({
    id: uid(), title,
    subject: document.getElementById('targetSubject').value,
    desc: document.getElementById('targetDesc').value.trim(),
    time: document.getElementById('targetTime').value.trim(),
    priority: document.getElementById('targetPriority').value,
    deadline: getDateISO('targetDeadline'),
    date: todayStr(),
    completed:false
  });
  saveAll();
  ['targetTitle','targetDesc','targetTime'].forEach(id=>document.getElementById(id).value='');
  setDateISO('targetDeadline', '');
  toast('Target added!');
  renderAll();
});

window.deleteTarget = function(id){
  state.targets = state.targets.filter(t=>t.id!==id);
  saveAll(); toast('Target deleted.'); renderAll();
};
window.editTargetPrompt = function(id){
  const t = state.targets.find(x=>x.id===id);
  const newTitle = prompt('Edit target title:', t.title);
  if(newTitle && newTitle.trim()){ t.title = newTitle.trim(); saveAll(); renderAll(); }
};

function renderTargets(){
  const container = document.getElementById('targetsList');
  if(!state.targets.length){
    container.innerHTML = emptyState('No targets yet.', 'Add your first study target to get started.');
    return;
  }
  container.innerHTML = state.targets.slice().reverse().map(t=>`
    <div class="item-card ${t.completed?'completed':''}">
      <input type="checkbox" class="item-checkbox" ${t.completed?'checked':''} onchange="toggleTarget('${t.id}')">
      <div class="item-body">
        <div class="item-title">${escapeHtml(t.title)}</div>
        <div class="item-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          <span>${escapeHtml(subjectName(t.subject))}</span>
          ${t.time?`<span>⏱️ ${escapeHtml(t.time)}</span>`:''}
          ${t.deadline?`<span>📅 ${fmtDate(t.deadline)}</span>`:''}
        </div>
      </div>
      <div class="item-actions">
        <button class="icon-action" onclick="editTargetPrompt('${t.id}')">✎</button>
        <button class="icon-action" onclick="deleteTarget('${t.id}')">🗑</button>
      </div>
    </div>`).join('');
}

/* ====================== SUBJECTS ====================== */
document.getElementById('addSubjectBtn').addEventListener('click', ()=>{
  const name = document.getElementById('subjectName').value.trim();
  if(!name){ toast('Subject name required'); return; }
  state.subjects.push({
    id: uid(), name,
    teacher: document.getElementById('subjectTeacher').value.trim(),
    color: document.getElementById('subjectColor').value,
    target: document.getElementById('subjectTarget').value || 100
  });
  saveAll();
  ['subjectName','subjectTeacher','subjectTarget'].forEach(id=>document.getElementById(id).value='');
  toast('Subject added!');
  renderAll();
});
window.deleteSubject = function(id){
  state.subjects = state.subjects.filter(s=>s.id!==id);
  saveAll(); toast('Subject deleted.'); renderAll();
};

function renderSubjects(){
  const container = document.getElementById('subjectsList');
  if(!state.subjects.length){
    container.innerHTML = emptyState('No subjects yet.', 'Add a subject to start tracking progress.');
    return;
  }
  container.innerHTML = state.subjects.map(s=>{
    const pct = subjectProgress(s.id);
    return `<div class="subject-card">
      <div class="subject-top">
        <strong><span class="subject-dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</strong>
        <button class="icon-action" onclick="deleteSubject('${s.id}')">🗑</button>
      </div>
      <div class="muted" style="font-size:12px;">${s.teacher?('Teacher: '+escapeHtml(s.teacher)):''}</div>
      <div class="muted" style="font-size:12px;">Target: ${s.target}%</div>
      <div class="subject-bar-bg"><div class="subject-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
      <div class="muted" style="font-size:12px;margin-top:4px;">${pct}% Complete</div>
    </div>`;
  }).join('');
}

/* ====================== TIMETABLE ====================== */
document.getElementById('addTimetableBtn').addEventListener('click', ()=>{
  const activity = document.getElementById('ttActivity').value.trim();
  const start = document.getElementById('ttStart').value;
  const end = document.getElementById('ttEnd').value;
  if(!start || !end){ toast('Start/End time required'); return; }
  state.timetable.push({
    id: uid(), day: document.getElementById('ttDay').value, start, end,
    subject: document.getElementById('ttSubject').value, activity
  });
  saveAll();
  document.getElementById('ttActivity').value='';
  toast('Timetable entry added!');
  renderAll();
});
window.deleteTimetable = function(id){
  state.timetable = state.timetable.filter(x=>x.id!==id);
  saveAll(); toast('Entry deleted.'); renderAll();
};

const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function renderTimetable(){
  const container = document.getElementById('timetableList');
  if(!state.timetable.length){
    container.innerHTML = emptyState('No timetable entries yet.', 'Add your weekly schedule.');
    return;
  }
  const sorted = state.timetable.slice().sort((a,b)=> dayOrder.indexOf(a.day)-dayOrder.indexOf(b.day) || a.start.localeCompare(b.start));
  container.innerHTML = sorted.map(e=>`
    <div class="item-card">
      <div class="item-body">
        <div class="item-title">${e.day} • ${e.start} - ${e.end}</div>
        <div class="item-meta"><span>${escapeHtml(subjectName(e.subject))}</span>${e.activity?`<span>${escapeHtml(e.activity)}</span>`:''}</div>
      </div>
      <div class="item-actions"><button class="icon-action" onclick="deleteTimetable('${e.id}')">🗑</button></div>
    </div>`).join('');
}

/* ====================== STUDY TIMER ====================== */
let timerMode = 'timer'; // 'timer' | 'pomodoro'
let timerTotalSeconds = 25*60;
let timerRemaining = timerTotalSeconds;
let timerInterval = null;
let timerRunning = false;
let pomoSession = 1;
let pomoPhase = 'Study'; // Study | Short Break | Long Break
const CIRC = 565.5;

document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    timerMode = btn.dataset.mode;
    document.getElementById('simpleTimerDurations').classList.toggle('hidden', timerMode==='pomodoro');
    document.getElementById('pomodoroInfo').classList.toggle('hidden', timerMode!=='pomodoro');
    if(timerMode==='pomodoro'){
      pomoSession = 1;
      pomoPhase = 'Study';
      timerTotalSeconds = state.settings.studyMin*60;
    } else {
      const activeDur = document.querySelector('.dur-btn.active');
      timerTotalSeconds = activeDur ? parseInt(activeDur.dataset.min)*60 : 25*60;
    }
    resetTimer();
  });
});

document.querySelectorAll('.dur-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.dur-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    timerTotalSeconds = parseInt(btn.dataset.min)*60;
    resetTimer();
  });
});
document.getElementById('customDuration').addEventListener('change', function(){
  const val = parseInt(this.value);
  if(val > 0){
    document.querySelectorAll('.dur-btn').forEach(b=>b.classList.remove('active'));
    timerTotalSeconds = val*60;
    resetTimer();
  }
});

function updateTimerDisplay(){
  const m = Math.floor(timerRemaining/60).toString().padStart(2,'0');
  const s = (timerRemaining%60).toString().padStart(2,'0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
  const offset = CIRC - (timerRemaining/timerTotalSeconds)*CIRC;
  document.getElementById('timerProgressCircle').style.strokeDashoffset = offset;
  document.getElementById('pomoSessionNum').textContent = pomoSession;
  document.getElementById('pomoPhase').textContent = pomoPhase;
}

function resetTimer(){
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = timerTotalSeconds;
  updateTimerDisplay();
}

document.getElementById('timerStartBtn').addEventListener('click', ()=>{
  if(timerRunning) return;
  if(timerMode==='pomodoro'){
    timerTotalSeconds = state.settings.studyMin*60;
    if(timerRemaining<=0 || timerRemaining>timerTotalSeconds) timerRemaining = timerTotalSeconds;
  }
  timerRunning = true;
  timerInterval = setInterval(()=>{
    timerRemaining--;
    if(timerRemaining <= 0){
      clearInterval(timerInterval);
      timerRunning = false;
      handleTimerComplete();
      return;
    }
    updateTimerDisplay();
  },1000);
});

document.getElementById('timerPauseBtn').addEventListener('click', ()=>{
  clearInterval(timerInterval);
  timerRunning = false;
});
document.getElementById('timerResetBtn').addEventListener('click', resetTimer);

function handleTimerComplete(){
  toast('Study session completed! 🎉');
  const minutesStudied = timerMode==='pomodoro' ? state.settings.studyMin : Math.round(timerTotalSeconds/60);
  if(pomoPhase==='Study' || timerMode==='timer'){
    state.sessions.push({id:uid(), date: todayStr(), minutes: minutesStudied});
    saveAll();
    checkStreak();
  }

  if(timerMode==='pomodoro'){
    if(pomoPhase==='Study'){
      if(pomoSession % 4 === 0){
        pomoPhase = 'Long Break'; timerTotalSeconds = state.settings.longBreak*60;
      } else {
        pomoPhase = 'Short Break'; timerTotalSeconds = state.settings.shortBreak*60;
      }
    } else {
      pomoPhase = 'Study'; timerTotalSeconds = state.settings.studyMin*60;
      pomoSession = pomoSession % 4 + 1;
    }
    timerRemaining = timerTotalSeconds;
  } else {
    timerRemaining = timerTotalSeconds;
  }
  updateTimerDisplay();
  renderAll();
}

/* ====================== NOTES ====================== */
document.getElementById('addNoteBtn').addEventListener('click', ()=>{
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  if(!title || !content){ toast('Title and content required'); return; }
  state.notes.push({id:uid(), title, content, subject: document.getElementById('noteSubject').value, date: todayStr()});
  saveAll();
  document.getElementById('noteTitle').value=''; document.getElementById('noteContent').value='';
  toast('Note added!');
  renderAll();
});
window.deleteNote = function(id){
  state.notes = state.notes.filter(n=>n.id!==id);
  saveAll(); toast('Note deleted.'); renderAll();
};
window.editNotePrompt = function(id){
  const n = state.notes.find(x=>x.id===id);
  const newContent = prompt('Edit note:', n.content);
  if(newContent !== null){ n.content = newContent; saveAll(); renderAll(); }
};

document.getElementById('noteSearch').addEventListener('input', renderNotes);

function renderNotes(){
  const search = (document.getElementById('noteSearch').value || '').toLowerCase();
  const container = document.getElementById('notesList');
  const filtered = state.notes.filter(n=> n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search));
  if(!filtered.length){
    container.innerHTML = emptyState('No notes yet.', 'Write your first study note.');
    return;
  }
  container.innerHTML = filtered.slice().reverse().map(n=>`
    <div class="subject-card">
      <div class="subject-top"><strong>${escapeHtml(n.title)}</strong>
        <div class="item-actions">
          <button class="icon-action" onclick="editNotePrompt('${n.id}')">✎</button>
          <button class="icon-action" onclick="deleteNote('${n.id}')">🗑</button>
        </div>
      </div>
      <div class="muted" style="font-size:12px;">${escapeHtml(subjectName(n.subject))} • ${fmtDate(n.date)}</div>
      <p style="margin-top:8px;font-size:13px;">${escapeHtml(n.content)}</p>
    </div>`).join('');
}

document.getElementById('quickNoteSave').addEventListener('click', ()=>{
  const content = document.getElementById('quickNoteInput').value.trim();
  if(!content){ toast('Write something first'); return; }
  state.notes.push({id:uid(), title:'Quick Note', content, subject:'', date: todayStr()});
  saveAll();
  document.getElementById('quickNoteInput').value='';
  toast('Note saved!');
});

/* ====================== EXAMS ====================== */
document.getElementById('addExamBtn').addEventListener('click', ()=>{
  const name = document.getElementById('examName').value.trim();
  const date = getDateISO('examDate');
  if(!name || !date){ toast('Exam name and date required'); return; }
  state.exams.push({id:uid(), name, subject: document.getElementById('examSubject').value, date});
  saveAll();
  document.getElementById('examName').value=''; setDateISO('examDate', '');
  toast('Exam added!');
  renderAll();
});
window.deleteExam = function(id){
  state.exams = state.exams.filter(e=>e.id!==id);
  saveAll(); toast('Exam deleted.'); renderAll();
};

function renderExams(){
  const container = document.getElementById('examsList');
  if(!state.exams.length){
    container.innerHTML = emptyState('No exams added.', 'Add exam dates to track countdown.');
    return;
  }
  const sorted = state.exams.slice().sort((a,b)=> new Date(a.date)-new Date(b.date));
  container.innerHTML = sorted.map(e=>{
    const days = daysRemaining(e.date);
    return `<div class="subject-card">
      <div class="subject-top"><strong>${escapeHtml(e.name)}</strong>
        <button class="icon-action" onclick="deleteExam('${e.id}')">🗑</button>
      </div>
      <div class="muted" style="font-size:12px;">${escapeHtml(subjectName(e.subject))}</div>
      <div style="margin-top:8px;">📅 ${fmtDate(e.date)}</div>
      <div style="font-weight:800;color:var(--primary);margin-top:4px;">${days} Days Remaining</div>
    </div>`;
  }).join('');
}

/* ====================== HABITS ====================== */
document.getElementById('addHabitBtn').addEventListener('click', ()=>{
  const name = document.getElementById('habitName').value.trim();
  if(!name){ toast('Habit name required'); return; }
  state.habits.push({id:uid(), name});
  saveAll();
  document.getElementById('habitName').value='';
  toast('Habit added!');
  renderAll();
});
window.deleteHabit = function(id){
  state.habits = state.habits.filter(h=>h.id!==id);
  saveAll(); toast('Habit deleted.'); renderAll();
};
window.toggleHabitToday = function(id){
  const today = todayStr();
  if(!state.habitLog[today]) state.habitLog[today] = {};
  state.habitLog[today][id] = !state.habitLog[today][id];
  saveAll();
  renderAll();
};

function renderHabits(){
  const container = document.getElementById('habitsList');
  if(!state.habits.length){
    container.innerHTML = emptyState('No habits yet.', 'Add a daily study habit to track.');
    return;
  }
  const today = todayStr();
  container.innerHTML = state.habits.map(h=>{
    const done = state.habitLog[today] && state.habitLog[today][h.id];
    // weekly consistency
    let weekCount = 0;
    for(let i=0;i<7;i++){
      const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
      if(state.habitLog[d] && state.habitLog[d][h.id]) weekCount++;
    }
    return `<div class="item-card ${done?'completed':''}">
      <input type="checkbox" class="item-checkbox" ${done?'checked':''} onchange="toggleHabitToday('${h.id}')">
      <div class="item-body"><div class="item-title">${escapeHtml(h.name)}</div>
      <div class="item-meta"><span>${weekCount}/7 days this week</span></div></div>
      <div class="item-actions"><button class="icon-action" onclick="deleteHabit('${h.id}')">🗑</button></div>
    </div>`;
  }).join('');
}

/* ====================== PROGRESS ====================== */
function renderProgress(){
  const chart = document.getElementById('weeklyChart');
  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    days.push(d);
  }
  const maxTasks = Math.max(1, ...days.map(d=> state.tasks.filter(t=>t.date===d && t.completed).length));
  chart.innerHTML = days.map(d=>{
    const count = state.tasks.filter(t=>t.date===d && t.completed).length;
    const height = Math.round((count/maxTasks)*140)+10;
    const label = new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short'});
    return `<div class="week-bar-col"><div class="week-bar" style="height:${height}px" title="${count} tasks"></div><div class="week-bar-label">${label}</div></div>`;
  }).join('');

  const now = new Date();
  const monthTasks = state.tasks.filter(t=> t.date && t.date.startsWith(now.toISOString().slice(0,7)));
  const monthCompleted = monthTasks.filter(t=>t.completed);
  const totalHours = state.sessions.filter(s=>s.date.startsWith(now.toISOString().slice(0,7))).reduce((a,s)=>a+s.minutes,0);
  const subjectCounts = {};
  monthCompleted.forEach(t=>{ subjectCounts[t.subject] = (subjectCounts[t.subject]||0)+1; });
  let bestSubjectId = Object.keys(subjectCounts).sort((a,b)=>subjectCounts[b]-subjectCounts[a])[0];

  const grid = document.getElementById('monthlyStatsGrid');
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-icon">📋</div><div><div class="stat-num">${monthTasks.length}</div><div class="stat-label">Total Tasks</div></div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-num">${monthCompleted.length}</div><div class="stat-label">Completed Tasks</div></div></div>
    <div class="stat-card"><div class="stat-icon">📈</div><div><div class="stat-num">${monthTasks.length?Math.round(monthCompleted.length/monthTasks.length*100):0}%</div><div class="stat-label">Completion Rate</div></div></div>
    <div class="stat-card"><div class="stat-icon">⏱️</div><div><div class="stat-num">${minutesToHM(totalHours)}</div><div class="stat-label">Total Study Time</div></div></div>
    <div class="stat-card"><div class="stat-icon">📚</div><div><div class="stat-num" style="font-size:15px;">${bestSubjectId?escapeHtml(subjectName(bestSubjectId)):'—'}</div><div class="stat-label">Most Studied Subject</div></div></div>
    <div class="stat-card"><div class="stat-icon">🔥</div><div><div class="stat-num">${state.streak.longest}</div><div class="stat-label">Longest Streak</div></div></div>
  `;
}

/* ====================== PROFILE ====================== */
function renderProfile(){
  if(!state.profile) return;
  document.getElementById('profileName').value = state.profile.name;
  document.getElementById('profileClass').value = state.profile.class;
  document.getElementById('profileSchool').value = state.profile.school;
  document.getElementById('profileCity').value = state.profile.city || '';
  document.getElementById('profileGoal').value = state.profile.goal || '';
  const initials = getInitials(state.profile.name);
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = state.profile.name;
  document.getElementById('sidebarClass').textContent = state.profile.class;
}

document.getElementById('saveProfileBtn').addEventListener('click', ()=>{
  const name = document.getElementById('profileName').value.trim();
  const cls = document.getElementById('profileClass').value.trim();
  const school = document.getElementById('profileSchool').value.trim();
  if(!name || !cls || !school){ toast('Name, class and school required'); return; }
  state.profile = {
    name, class: cls, school,
    city: document.getElementById('profileCity').value.trim(),
    goal: document.getElementById('profileGoal').value.trim()
  };
  saveAll();
  toast('Profile updated.');
  renderAll();
});

/* ====================== SETTINGS ====================== */
document.getElementById('saveTimerSettingsBtn').addEventListener('click', ()=>{
  state.settings.studyMin = parseInt(document.getElementById('settingStudyMin').value) || 25;
  state.settings.shortBreak = parseInt(document.getElementById('settingShortBreak').value) || 5;
  state.settings.longBreak = parseInt(document.getElementById('settingLongBreak').value) || 20;
  saveAll();
  toast('Timer settings saved.');
});

document.getElementById('exportDataBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  downloadBlob(blob, 'study-planner-backup.json');
  toast('Data exported successfully.');
});

document.getElementById('importDataInput').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    try{
      const data = JSON.parse(ev.target.result);
      state = Object.assign(state, data);
      saveAll();
      toast('Data imported successfully!');
      initApp();
    }catch(err){
      toast('Invalid backup file.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('clearCompletedBtn').addEventListener('click', ()=>{
  state.tasks = state.tasks.filter(t=>!t.completed);
  saveAll();
  toast('Completed tasks cleared.');
  renderAll();
});

let pendingClearAll = false;
document.getElementById('clearAllBtn').addEventListener('click', ()=>{
  showConfirm('Clear All Data?', 'This action cannot be undone. All your data will be permanently deleted.', ()=>{
    localStorage.clear();
    location.reload();
  });
});

function showConfirm(title, text, onConfirm){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmModal').classList.remove('hidden');
  const okBtn = document.getElementById('confirmOkBtn');
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', ()=>{
    document.getElementById('confirmModal').classList.add('hidden');
    onConfirm();
  });
}
document.getElementById('confirmCancelBtn').addEventListener('click', ()=>{
  document.getElementById('confirmModal').classList.add('hidden');
});

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* Download today's plan */
function buildPlanData(){
  const today = todayStr();
  const todayTasks = state.tasks.filter(t=>t.date===today);
  const completed = todayTasks.filter(t=>t.completed);
  const remaining = todayTasks.filter(t=>!t.completed);
  const pct = todayTasks.length ? Math.round(completed.length/todayTasks.length*100) : 0;
  const minutes = state.sessions.filter(s=>s.date===today).reduce((a,s)=>a+s.minutes,0);
  return { today, todayTasks, completed, remaining, pct, minutes };
}

document.getElementById('downloadPlanBtn').addEventListener('click', generateTodayPlan);
function generateTodayPlan(){
  const { today, todayTasks, completed, remaining, pct, minutes } = buildPlanData();

  let text = `STUDY PLAN\n`;
  text += `================================\n`;
  text += `Student: ${state.profile.name}\n`;
  text += `Date: ${fmtDate(today)}\n\n`;
  text += `Goal: ${state.profile.goal || '—'}\n\n`;
  text += `TODAY'S TASKS (${todayTasks.length})\n--------------------------------\n`;
  todayTasks.forEach(t=>{
    text += `[${t.completed?'x':' '}] ${t.name} | ${subjectName(t.subject)} | ${t.priority}${t.deadline?' | Deadline: '+t.deadline:''}\n`;
  });
  text += `\nSUBJECTS\n--------------------------------\n`;
  state.subjects.forEach(s=> text += `${s.name}: ${subjectProgress(s.id)}%\n`);
  text += `\nSUMMARY\n--------------------------------\n`;
  text += `Completed: ${completed.length}\nRemaining: ${remaining.length}\nProgress: ${pct}%\nStudy Time: ${minutesToHM(minutes)}\n`;

  const blob = new Blob([text], {type:'text/plain'});
  const safeName = state.profile.name.replace(/\s+/g,'-');
  downloadBlob(blob, `${safeName}-Study-Plan-${today}.txt`);
  toast('Plan downloaded!');
}

document.getElementById('printPlanBtn').addEventListener('click', ()=>{
  window.print();
});

/* ---------- Download today's plan as a PNG image (pure canvas, no libraries) ---------- */
document.getElementById('downloadPlanImageBtn').addEventListener('click', generateTodayPlanImage);
function generateTodayPlanImage(){
  const { today, todayTasks, completed, remaining, pct, minutes } = buildPlanData();

  const W = 720;
  const lineH = 26;
  // Estimate height first
  let estimatedLines = 10 + todayTasks.length + state.subjects.length + 6;
  const H = Math.max(500, estimatedLines * lineH + 140);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#eef0ff'); bg.addColorStop(1,'#ffffff');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Header bar
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0,0,W,90);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Segoe UI, Arial';
  ctx.fillText('📚 Today\'s Study Plan', 30, 40);
  ctx.font = '14px Segoe UI, Arial';
  ctx.fillText(`${state.profile.name}  •  ${state.profile.class}  •  ${fmtDate(today)}`, 30, 68);

  let y = 130;
  ctx.fillStyle = '#1f2433';

  ctx.font = 'bold 16px Segoe UI, Arial';
  ctx.fillText(`Goal: ${state.profile.goal || '—'}`, 30, y);
  y += 36;

  ctx.font = 'bold 16px Segoe UI, Arial';
  ctx.fillText(`Today's Tasks (${todayTasks.length})`, 30, y);
  y += 8;
  ctx.strokeStyle = '#e5e7eb'; ctx.beginPath(); ctx.moveTo(30,y); ctx.lineTo(W-30,y); ctx.stroke();
  y += 24;

  ctx.font = '14px Segoe UI, Arial';
  if(!todayTasks.length){
    ctx.fillStyle = '#6b7280';
    ctx.fillText('No tasks scheduled for today.', 30, y);
    y += lineH;
  } else {
    todayTasks.forEach(t=>{
      ctx.fillStyle = t.completed ? '#16a34a' : '#1f2433';
      const mark = t.completed ? '✔' : '☐';
      ctx.fillText(`${mark}  ${t.name}  —  ${subjectName(t.subject)}  (${t.priority})`, 30, y);
      y += lineH;
    });
  }

  y += 12;
  ctx.fillStyle = '#1f2433';
  ctx.font = 'bold 16px Segoe UI, Arial';
  ctx.fillText('Subjects Progress', 30, y);
  y += 8;
  ctx.beginPath(); ctx.moveTo(30,y); ctx.lineTo(W-30,y); ctx.stroke();
  y += 24;
  ctx.font = '14px Segoe UI, Arial';
  if(!state.subjects.length){
    ctx.fillStyle = '#6b7280';
    ctx.fillText('No subjects added.', 30, y);
    y += lineH;
  } else {
    state.subjects.forEach(s=>{
      const p = subjectProgress(s.id);
      ctx.fillStyle = s.color;
      ctx.fillRect(30, y-14, 12, 12);
      ctx.fillStyle = '#1f2433';
      ctx.fillText(`${s.name} — ${p}%`, 50, y);
      y += lineH;
    });
  }

  y += 12;
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(30, y-20, W-60, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Segoe UI, Arial';
  ctx.fillText(`Completed: ${completed.length}   Remaining: ${remaining.length}   Progress: ${pct}%`, 46, y+8);
  ctx.fillText(`Study Time Today: ${minutesToHM(minutes)}`, 46, y+34);

  ctx.fillStyle = '#9aa0b4';
  ctx.font = '11px Segoe UI, Arial';
  ctx.fillText('Generated by Study Planner — Developed by Hassnain Raza', 30, H-16);

  canvas.toBlob(function(blob){
    const safeName = state.profile.name.replace(/\s+/g,'-');
    downloadBlob(blob, `${safeName}-Study-Plan-${today}.png`);
    toast('Plan downloaded as image!');
  }, 'image/png');
}

/* ====================== RENDER ALL ====================== */
function renderAll(){
  if(!state.profile) return;
  fillSubjectSelects();
  renderProfile();
  renderDashboard();
  renderTasks();
  renderTargets();
  renderSubjects();
  renderTimetable();
  renderNotes();
  renderExams();
  renderHabits();
  renderProgress();
  updateTimerDisplay();
}

/* ====================== KEYBOARD SHORTCUTS ====================== */
document.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.key==='k'){ e.preventDefault(); document.querySelector('.nav-item[data-page="tasks"]').click(); }
  if(e.key==='Escape'){ taskModal.classList.add('hidden'); document.getElementById('confirmModal').classList.add('hidden'); }
});

/* ====================== INIT ====================== */
initApp();
initAllDatePickers();
updateTimerDisplay();
