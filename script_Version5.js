// SDG Explorers — updated: SDG6 internal subtabs (definition, causes, effects, solutions)
// plus Formspree feedback + local save + CSV export
document.addEventListener('DOMContentLoaded', () => {
  // --- Main tab switching ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  function showTab(name) {
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.id === name));
    history.replaceState(null, '', `#${name}`);
  }
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // goto buttons on home cards may include a data-sub to open a subpanel in sdg6
  document.querySelectorAll('.goto').forEach(b => {
    b.addEventListener('click', () => {
      const target = b.dataset.tabTarget;
      const sub = b.dataset.sub;
      showTab(target);
      if(target === 'sdg6' && sub) showSubTab(sub);
    });
  });

  // initial tab from hash
  const initialHash = location.hash.replace('#','');
  if(initialHash && document.getElementById(initialHash)){
    showTab(initialHash);
  } else {
    showTab('home');
  }

  // --- SDG6 subtabs ---
  const subtabs = document.querySelectorAll('.sub-nav .subtab');
  const subpanels = document.querySelectorAll('.subpanel');
  function showSubTab(name) {
    subtabs.forEach(s => s.classList.toggle('active', s.dataset.sub === name));
    subpanels.forEach(p => p.classList.toggle('active', p.id === 'sub-' + name));
    // move focus for accessibility
    const active = document.querySelector('.sub-nav .subtab.active');
    active?.focus();
    // update URL hash to include sub (optional)
    history.replaceState(null, '', `#sdg6-${name}`);
  }
  subtabs.forEach(st => st.addEventListener('click', () => showSubTab(st.dataset.sub)));

  // On load, if hash indicates sdg6-sub, open it
  if(location.hash.startsWith('#sdg6-')){
    const sub = location.hash.replace('#sdg6-','');
    showTab('sdg6');
    showSubTab(sub);
  }

  // --- Resource filtering for other sections ---
  document.querySelectorAll('.filter').forEach(input => {
    const topic = input.dataset.filterFor;
    const list = document.querySelector(`[data-resources-for="${topic}"]`);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if(!list) return;
      Array.from(list.children).forEach(li => {
        const text = (li.textContent + ' ' + (li.dataset.tags||'')).toLowerCase();
        li.style.display = text.includes(q) ? '' : 'none';
      });
    });
  });

  // --- Quizzes (supports different topics) ---
  document.querySelectorAll('.quiz').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const topic = form.dataset.topic || 'climate';
      const choice = form.querySelector('input[type="radio"]:checked');
      const feedbackEl = form.querySelector('.quiz-feedback');
      if(!choice) {
        feedbackEl.textContent = 'Please choose an answer.';
        feedbackEl.style.color = 'var(--muted)';
        return;
      }
      // correct answers (simple map)
      const correct = {
        climate: 'b',
        water: 'a',
        consumption: 'a',
        education: 'a',
        definition: 'b',
        effects: 'b'
      };
      const isCorrect = choice.value === (correct[topic] || 'a');
      feedbackEl.textContent = isCorrect ? 'Correct ✅ Great job!' : 'Not quite — read the resources and try again!';
      feedbackEl.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
      // Save a simple score locally
      const scores = JSON.parse(localStorage.getItem('sdg-scores') || '{}');
      scores[topic] = scores[topic] ? scores[topic] + (isCorrect ? 1 : 0) : (isCorrect ? 1 : 0);
      localStorage.setItem('sdg-scores', JSON.stringify(scores));
    });
  });

  // --- Causes: click-to-explain buttons ---
  document.querySelectorAll('.click-list .explain').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.explain;
      const out = document.getElementById('explain-output');
      let txt = '';
      if(mode === 'pollution') {
        txt = 'Pollution: Runoff from farms (fertilisers, pesticides) and untreated sewage introduce nitrates, microbes and chemicals into water supplies.';
      } else if(mode === 'overuse') {
        txt = 'Overuse: Too much extraction for irrigation and industry lowers groundwater levels and reduces supplies for communities and ecosystems.';
      } else if(mode === 'sanitation') {
        txt = 'Poor sanitation: Lack of sewage treatment allows pathogens to contaminate drinking water and spread disease.';
      } else {
        txt = 'Cause details not available.';
      }
      out.textContent = txt;
    });
  });

  // --- SDG6 Tools: Water Quality Checker + Water Estimator (kept in Solutions subpanel) ---
  document.getElementById('check-water')?.addEventListener('click', () => {
    const ph = parseFloat(document.getElementById('w-ph').value);
    const turb = parseFloat(document.getElementById('w-turbidity').value);
    const nitrate = parseFloat(document.getElementById('w-nitrate').value);
    const out = document.getElementById('water-check-result');
    if(isNaN(ph) && isNaN(turb) && isNaN(nitrate)){
      out.textContent = 'Please enter at least one measurement.';
      out.style.color = 'var(--muted)';
      return;
    }
    const messages = [];
    if(!isNaN(ph)){
      if(ph >= 6.5 && ph <= 8.5) messages.push('pH: within typical safe range (6.5–8.5).');
      else if(ph < 6.5) messages.push('pH: acidic — may be a concern for pipes and ecosystems.');
      else messages.push('pH: alkaline — could affect taste and treatment needs.');
    }
    if(!isNaN(turb)){
      if(turb <= 5) messages.push('Turbidity: low — water looks clear.');
      else if(turb <= 50) messages.push('Turbidity: moderate — may indicate particles; treatment recommended.');
      else messages.push('Turbidity: high — unsafe without treatment.');
    }
    if(!isNaN(nitrate)){
      if(nitrate <= 10) messages.push('Nitrate: within typical safe limits for drinking water (≤10 mg/L).');
      else messages.push('Nitrate: elevated — may be unsafe for infants and should be investigated.');
    }
    out.innerHTML = messages.map(m => `• ${m}`).join('\n');
    out.style.color = '#e6eef8';
    // Save quick check
    const checks = JSON.parse(localStorage.getItem('sdg-water-checks') || '[]');
    checks.unshift({ph: isNaN(ph)?null:ph, turbidity: isNaN(turb)?null:turb, nitrate: isNaN(nitrate)?null:nitrate, at: new Date().toISOString()});
    localStorage.setItem('sdg-water-checks', JSON.stringify(checks.slice(0,50)));
  });

  function estimateWaterUse(showerMin, flushes, dishesMin){
    const showerFlow = 9; // L/min
    const flushPer = 6; // L/flush
    const dishFlow = 8; // L per 10 minutes
    const shower = Math.max(0, showerMin) * showerFlow;
    const toilet = Math.max(0, flushes) * flushPer;
    const dishes = Math.max(0, dishesMin) * (dishFlow/10);
    const daily = Math.round((shower + toilet + dishes) * 10) / 10;
    const weekly = Math.round(daily * 7 * 10) / 10;
    const monthly = Math.round(daily * 30 * 10) / 10;
    return {daily, weekly, monthly, breakdown:{shower, toilet, dishes}};
  }
  document.getElementById('estimate-water')?.addEventListener('click', () => {
    const shower = parseFloat(document.getElementById('est-shower').value) || 0;
    const flushes = parseFloat(document.getElementById('est-flushes').value) || 0;
    const dishes = parseFloat(document.getElementById('est-dishes').value) || 0;
    const res = estimateWaterUse(shower, flushes, dishes);
    const el = document.getElementById('water-estimate-result');
    el.innerHTML = `<strong>Estimated use</strong><br/>Daily: ${res.daily} L — Weekly: ${res.weekly} L — Monthly: ${res.monthly} L
      <div style="margin-top:6px;color:var(--muted)">Tip: cutting shower time by 2 min saves ~${2*9} L per shower.</div>`;
  });
  document.getElementById('save-water-estimate')?.addEventListener('click', () => {
    const shower = parseFloat(document.getElementById('est-shower').value) || 0;
    const flushes = parseFloat(document.getElementById('est-flushes').value) || 0;
    const dishes = parseFloat(document.getElementById('est-dishes').value) || 0;
    const res = estimateWaterUse(shower, flushes, dishes);
    const el = document.getElementById('water-estimate-saved');
    const saves = JSON.parse(localStorage.getItem('sdg-water-estimates') || '[]');
    saves.unshift({shower, flushes, dishes, res, at: new Date().toISOString()});
    localStorage.setItem('sdg-water-estimates', JSON.stringify(saves.slice(0,50)));
    el.textContent = 'Estimate saved locally ✅';
    setTimeout(()=> el.textContent = '', 2000);
  });

  // --- Checklist save reused ---
  document.getElementById('save-checklist')?.addEventListener('click', () => {
    const c1 = document.getElementById('check1')?.checked || false;
    const c2 = document.getElementById('check2')?.checked || false;
    const c3 = document.getElementById('check3')?.checked || false;
    const el = document.getElementById('checklist-saved');
    localStorage.setItem('sdg-checklist', JSON.stringify({c1,c2,c3, date: new Date().toISOString()}));
    el && (el.textContent = 'Checklist saved ✅');
    setTimeout(()=> el && (el.textContent = ''), 2200);
  });

  // --- Activity creator ---
  document.getElementById('create-activity')?.addEventListener('click', () => {
    const topic = document.getElementById('activity-topic').value.trim() || 'a topic';
    const duration = document.getElementById('activity-duration').value.trim() || '10 min';
    const result = document.getElementById('activity-result');
    const durNum = parseInt(duration) || 10;
    const template = `Activity: Quick "${topic}" session — Duration: ${duration}.
Steps:
1) Intro (2 min) — ask learners what they already know.
2) Hands-on (${Math.max(5, durNum)} min) — short task or demonstration.
3) Share (3 min) — one takeaway each.
`;
    result.textContent = template;
  });

  // --- Feedback: local save + Formspree POST + CSV export ---
  const fbForm = document.getElementById('feedback-form');
  const fbStatus = document.getElementById('fb-status');
  const feedbackListEl = document.getElementById('feedback-items');
  const clearBtn = document.getElementById('clear-feedback');
  const exportBtn = document.getElementById('export-feedback');

  function loadLocalFeedback(){ return JSON.parse(localStorage.getItem('sdg-feedback') || '[]'); }
  function saveLocalFeedback(items){ localStorage.setItem('sdg-feedback', JSON.stringify(items.slice(0,500))); }
  function renderFeedbackList(){
    const items = loadLocalFeedback();
    feedbackListEl.innerHTML = '';
    if(!items.length){ feedbackListEl.innerHTML = '<li class="muted">No feedback yet — be the first!</li>'; return; }
    items.forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(entry.name)}</strong> <em>(${escapeHtml(entry.topic)}, ${escapeHtml(entry.rating)}⭐)</em><br/>
        <small class="muted">${new Date(entry.at).toLocaleString()}</small>
        <p>${escapeHtml(entry.message)}</p>`;
      feedbackListEl.appendChild(li);
    });
  }

  exportBtn?.addEventListener('click', () => {
    const items = loadLocalFeedback();
    if(!items.length){ fbStatus.textContent = 'No local feedback to export.'; return; }
    const headers = ['name','email','topic','rating','message','at'];
    const csvRows = [headers.join(',')];
    items.forEach(it => {
      const row = headers.map(h => {
        const val = it[h] == null ? '' : ('' + it[h]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      csvRows.push(row);
    });
    const blob = new Blob([csvRows.join('\n')], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdg-feedback-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    fbStatus.textContent = 'Export complete.';
    setTimeout(()=> fbStatus.textContent = '', 2500);
  });

  clearBtn?.addEventListener('click', () => {
    if(confirm('Clear saved feedback locally? This cannot be undone.')) {
      localStorage.removeItem('sdg-feedback');
      renderFeedbackList();
      fbStatus.textContent = 'Local feedback cleared.';
      setTimeout(()=> fbStatus.textContent = '', 2000);
    }
  });

  fbForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fb-name').value.trim();
    const email = document.getElementById('fb-email').value.trim();
    const topic = document.getElementById('fb-topic').value;
    const message = document.getElementById('fb-message').value.trim();
    const rating = document.getElementById('fb-rating').value;
    const saveLocalChecked = document.getElementById('fb-save-local')?.checked ?? true;
    if(!name || !email || !message){ fbStatus.textContent = 'Please fill all required fields.'; return; }

    const entry = {name, email, topic, message, rating, at: new Date().toISOString()};

    if(saveLocalChecked){
      const items = loadLocalFeedback();
      items.unshift(entry);
      saveLocalFeedback(items);
      renderFeedbackList();
    }

    const endpoint = fbForm.dataset.endpoint && fbForm.dataset.endpoint.indexOf('YOUR_FORM_ID') === -1
      ? fbForm.dataset.endpoint.trim()
      : '';
    if(!endpoint){
      fbStatus.textContent = 'Feedback saved locally. (Remote endpoint not configured.)';
      fbForm.reset();
      setTimeout(()=> fbStatus.textContent = '', 3000);
      return;
    }

    fbStatus.textContent = 'Sending feedback to server...';
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json','Accept': 'application/json'},
        body: JSON.stringify({name, email, topic, message, rating})
      });
      if(resp.ok){
        fbStatus.textContent = 'Feedback sent to server and saved locally ✅';
        fbForm.reset();
      } else {
        let errText = '';
        try { const data = await resp.json(); errText = data?.error || JSON.stringify(data); } catch(_) { errText = resp.statusText || 'unknown error'; }
        fbStatus.textContent = `Saved locally. Failed to send to server: ${errText}`;
      }
    } catch (err) {
      console.error('Send error', err);
      fbStatus.textContent = 'Saved locally. Failed to send to server (network error).';
    }
    setTimeout(()=> fbStatus.textContent = '', 4500);
  });

  renderFeedbackList();

  // --- Small accessibility: left/right main tabs ---
  let focusedTab = 0;
  document.addEventListener('keydown', (e) => {
    if(['ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();
      if(e.key === 'ArrowLeft') focusedTab = (focusedTab - 1 + tabButtons.length) % tabButtons.length;
      if(e.key === 'ArrowRight') focusedTab = (focusedTab + 1) % tabButtons.length;
      tabButtons[focusedTab].focus();
      showTab(tabButtons[focusedTab].dataset.tab);
    }
  });

  // --- Utility escape ---
  function escapeHtml(s){
    return (s+'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // Default to definition if sdg6 open without sub hash
  if(document.getElementById('sdg6') && !location.hash.startsWith('#sdg6-')){
    showSubTab('definition');
  }
});