// -----------------------------
// Matrimony Demo - script.js
// Client-only frontend. Data stored in localStorage under "matrimony_profiles".
// -----------------------------

// Simple DOM helper
const $ = id => document.getElementById(id);

// Utilities
function uid(){ return 'id_'+Math.random().toString(36).slice(2,9); }
function saveProfiles(arr){ localStorage.setItem('matrimony_profiles', JSON.stringify(arr)); }
function loadProfiles(){ try { return JSON.parse(localStorage.getItem('matrimony_profiles') || '[]'); } catch(e) { return []; } }

function placeholderFor(g){
  const colors = { Female:'#ffd6e0', Male:'#d6e8ff', Other:'#e6e6e6' };
  const bg = colors[g] || '#eee';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
      <rect width="100%" height="100%" fill="${bg}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#6b6b6b">No Photo</text>
    </svg>`
  );
}

function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// -----------------------------
// Rendering
// -----------------------------
const profilesEl = $('profiles');

function render(){
  let list = loadProfiles();
  const q = $('quickSearch').value.trim().toLowerCase();
  const nameQ = $('searchName').value.trim().toLowerCase();
  const city = $('city').value.trim().toLowerCase();
  const gender = $('gender').value;
  const ageMin = parseInt($('ageMin').value || 0);
  const ageMax = parseInt($('ageMax').value || 0);

  list = list.filter(p => {
    if(q && !p.name.toLowerCase().includes(q)) return false;
    if(nameQ && !(p.name.toLowerCase().includes(nameQ) || (p.profession||'').toLowerCase().includes(nameQ) || (p.about||'').toLowerCase().includes(nameQ))) return false;
    if(city && !(p.city||'').toLowerCase().includes(city)) return false;
    if(gender !== 'any' && p.gender !== gender) return false;
    if(ageMin && p.age < ageMin) return false;
    if(ageMax && ageMax !== 0 && p.age > ageMax) return false;
    return true;
  });

  const sort = $('sortBy').value;
  if(sort === 'ageAsc') list.sort((a,b) => a.age - b.age);
  else if(sort === 'ageDesc') list.sort((a,b) => b.age - a.age);
  else list.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  profilesEl.innerHTML = '';
  if(list.length === 0){
    profilesEl.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">No profiles found — try \"Load Sample\"</div>';
    return;
  }

  list.forEach(p => {
    const card = document.createElement('div'); card.className = 'profile';
    const img = document.createElement('img'); img.src = p.photo || placeholderFor(p.gender);
    card.appendChild(img);

    const meta = document.createElement('div'); meta.className = 'meta';
    const left = document.createElement('div');
    left.innerHTML = `<h4>${escapeHtml(p.name)}</h4><p class="muted">${p.age} • ${escapeHtml(p.city || 'Unknown')}</p>`;
    const right = document.createElement('div');
    right.innerHTML = `<button class="btn" data-id="${p.id}">View</button>`;
    meta.appendChild(left); meta.appendChild(right);
    card.appendChild(meta);
    profilesEl.appendChild(card);

    right.querySelector('button').addEventListener('click', () => openView(p.id));
  });
}

// -----------------------------
// Modal / Form handling
// -----------------------------
const modalBackdrop = $('modalBackdrop');
const viewBackdrop = $('viewBackdrop');

function openModal(data){
  $('modalTitle').textContent = data ? 'Edit profile' : 'Create profile';
  modalBackdrop.style.display = 'flex';
  if(data){
    $('name').value = data.name || '';
    $('age').value = data.age || '';
    $('pgender').value = data.gender || 'Female';
    $('pcity').value = data.city || '';
    $('profession').value = data.profession || '';
    $('about').value = data.about || '';
    if(data.photo) showPreview(data.photo);
    $('profileForm').dataset.editId = data.id;
  } else {
    $('profileForm').reset();
    delete $('profileForm').dataset.editId;
    clearPreview();
  }
}
function closeModal(){ modalBackdrop.style.display = 'none'; }

$('openRegister').addEventListener('click', () => openModal());
$('closeModal').addEventListener('click', () => closeModal());
$('cancelForm').addEventListener('click', () => closeModal());

// Photo preview
const photoInput = $('photo');
photoInput.addEventListener('change', (e) => {
  const f = e.target.files[0]; if(!f) return clearPreview();
  const reader = new FileReader();
  reader.onload = () => showPreview(reader.result);
  reader.readAsDataURL(f);
});
function showPreview(src){
  const img = $('photoPreview');
  img.src = src;
  img.style.display = 'block';
  $('photoPlaceholder').style.display = 'none';
}
function clearPreview(){
  const img = $('photoPreview');
  img.src = '';
  img.style.display = 'none';
  $('photoPlaceholder').style.display = 'block';
  $('photo').value = '';
}

// Save profile
$('profileForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const id = $('profileForm').dataset.editId || uid();
  const p = {
    id,
    name: $('name').value.trim() || 'Anonymous',
    age: parseInt($('age').value) || 0,
    gender: $('pgender').value,
    city: $('pcity').value.trim(),
    profession: $('profession').value.trim(),
    about: $('about').value.trim(),
    photo: $('photoPreview').src || '',
    createdAt: Date.now()
  };
  const arr = loadProfiles();
  const idx = arr.findIndex(x => x.id === id);
  if(idx > -1) arr[idx] = p; else arr.unshift(p);
  saveProfiles(arr);
  closeModal();
  render();
});

// -----------------------------
// Sample data + filters
// -----------------------------
$('loadSample').addEventListener('click', () => {
  const sample = [
    { id: uid(), name: 'Priya Sharma', age: 27, gender: 'Female', city: 'Mumbai', profession: 'Software Engineer', about: 'Loves trekking and food', photo: '', createdAt: Date.now() },
    { id: uid(), name: 'Amit Verma', age: 30, gender: 'Male', city: 'Delhi', profession: 'Civil Engineer', about: 'Family oriented', photo: '', createdAt: Date.now() - 10000000 },
    { id: uid(), name: 'Neha R', age: 25, gender: 'Female', city: 'Bengaluru', profession: 'Data Analyst', about: 'Coffee addict', photo: '', createdAt: Date.now() - 20000000 }
  ];
  saveProfiles(sample);
  render();
});

$('applyFilters').addEventListener('click', render);
$('resetFilters').addEventListener('click', () => {
  $('searchName').value = ''; $('ageMin').value = ''; $('ageMax').value = ''; $('gender').value = 'any'; $('city').value = '';
  render();
});
$('quickSearch').addEventListener('input', () => render());
$('sortBy').addEventListener('change', () => render());

// -----------------------------
// View profile modal (View/Edit/Delete/Contact)
// -----------------------------
function openView(id){
  const p = loadProfiles().find(x => x.id === id);
  if(!p) return alert('Profile not found');

  const el = $('viewModal');
  // Build modal content (escaped)
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <h3>${escapeHtml(p.name)}</h3>
      <div><button class="btn secondary" id="closeView">Close</button></div>
    </div>
    <div class="row">
      <img src="${p.photo || placeholderFor(p.gender)}" alt="profile-photo" />
      <div class="info" style="flex:1">
        <p class="muted">${p.age} • ${escapeHtml(p.city || '')}</p>
        <p style="margin-top:12px">${escapeHtml(p.about || 'No bio provided.')}</p>
        <div style="margin-top:12px"><span class="pill">${escapeHtml(p.profession || '')}</span></div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn" id="contactBtn">Contact</button>
          <button class="btn secondary" id="editBtn">Edit</button>
          <button class="btn secondary" id="deleteBtn">Delete</button>
        </div>
      </div>
    </div>
  `;
  viewBackdrop.style.display = 'flex';

  // Close handler
  $('closeView').addEventListener('click', () => viewBackdrop.style.display = 'none');

  // Contact (demo: copies a small contact text to clipboard)
  $('contactBtn').addEventListener('click', () => {
    const contactText = `Contact ${p.name} — (demo). City: ${p.city || 'N/A'}.`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(contactText).then(() => alert('Contact copied to clipboard (demo)'));
    } else {
      prompt('Copy contact (demo):', contactText);
    }
  });

  // Edit
  $('editBtn').addEventListener('click', () => {
    viewBackdrop.style.display = 'none';
    openModal(p);
  });

  // Delete
  $('deleteBtn').addEventListener('click', () => {
    if(confirm('Delete this profile?')){
      const remaining = loadProfiles().filter(x => x.id !== p.id);
      saveProfiles(remaining);
      viewBackdrop.style.display = 'none';
      render();
    }
  });
}

// Close on backdrop click
modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) closeModal(); });
viewBackdrop.addEventListener('click', (e) => { if(e.target === viewBackdrop) viewBackdrop.style.display = 'none'; });

// Keyboard shortcut (N to open register)
document.addEventListener('keydown', (e) => { if(e.key && e.key.toLowerCase() === 'n') openModal(); });

// Initialize
(function init(){
  render();
})();
