const searchCategoryEl = document.getElementById("searchCategory");
const searchQueryEl = document.getElementById("searchQuery");
const searchLengthEl = document.getElementById("searchLength");
const searchBtn = document.getElementById("searchBtn");
const resultsBody = document.getElementById("resultsBody");
const selectAllEl = document.getElementById("selectAll");
const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
const selectedCountEl = document.getElementById("selectedCount");
const statusMsg = document.getElementById("statusMsg");

const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

let currentCategory = "female";
let currentPage = 1;
let totalPages = 1;
let currentResults = [];
let selectedNames = new Set();

function showStatus(msg, isError = false) {
  statusMsg.style.display = "flex";
  statusMsg.className = `status-msg ${isError ? 'error' : 'ok'}`;
  statusMsg.innerHTML = isError ? `<i class="ph ph-warning"></i> ${msg}` : `<i class="ph ph-check-circle"></i> ${msg}`;
  setTimeout(() => { statusMsg.style.display = "none"; }, 4000);
}

async function performSearch(page = 1) {
  const cat = searchCategoryEl.value;
  const q = searchQueryEl.value.trim();
  const len = searchLengthEl.value.trim();
  
  try {
    searchBtn.disabled = true;
    let url = `/api/explorer/search?category=${encodeURIComponent(cat)}&page=${page}&limit=50`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (len) url += `&length=${encodeURIComponent(len)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed");

    currentCategory = cat;
    currentPage = data.page;
    totalPages = data.totalPages;
    currentResults = data.data;
    selectedNames.clear();
    
    renderTable();
    updatePagination(data.totalMatches);
    updateBulkDeleteButton();
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    searchBtn.disabled = false;
  }
}

function renderTable() {
  selectAllEl.checked = false;
  if (currentResults.length === 0) {
    resultsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 40px;">No names found matching your criteria.</td></tr>`;
    return;
  }

  resultsBody.innerHTML = currentResults.map(name => `
    <tr>
      <td><input type="checkbox" class="checkbox-custom row-checkbox" data-name="${name.replace(/"/g, '&quot;')}" /></td>
      <td class="name-cell">${name}</td>
      <td style="color: var(--text-muted); font-size:13px;">${name.length}</td>
      <td class="actions-cell" style="justify-content: flex-end;">
        <button class="btn-icon edit-btn" data-name="${name.replace(/"/g, '&quot;')}"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn-icon danger delete-btn" data-name="${name.replace(/"/g, '&quot;')}"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const name = e.target.getAttribute('data-name');
      if (e.target.checked) selectedNames.add(name);
      else selectedNames.delete(name);
      updateBulkDeleteButton();
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const oldName = e.currentTarget.getAttribute('data-name');
      const newName = prompt(`Edit name '${oldName}':`, oldName);
      if (newName && newName !== oldName) {
        editName(oldName, newName);
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = e.currentTarget.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete '${name}'?`)) {
        deleteNames([name]);
      }
    });
  });
}

function updatePagination(totalMatches) {
  pageInfo.textContent = `Showing page ${currentPage} of ${totalPages || 1} (${totalMatches.toLocaleString()} total matches)`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function updateBulkDeleteButton() {
  if (selectedNames.size > 0) {
    bulkDeleteBtn.style.display = "inline-flex";
    selectedCountEl.textContent = selectedNames.size;
  } else {
    bulkDeleteBtn.style.display = "none";
  }
}

selectAllEl.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.checked = isChecked;
    const name = cb.getAttribute('data-name');
    if (isChecked) selectedNames.add(name);
    else selectedNames.delete(name);
  });
  updateBulkDeleteButton();
});

searchBtn.addEventListener('click', () => performSearch(1));

prevPageBtn.addEventListener('click', () => performSearch(currentPage - 1));
nextPageBtn.addEventListener('click', () => performSearch(currentPage + 1));

async function editName(oldName, newName) {
  try {
    const res = await fetch(`/api/explorer/${encodeURIComponent(currentCategory)}/${encodeURIComponent(oldName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Edit failed");
    showStatus(`Successfully updated '${oldName}' to '${data.updatedName}'.`);
    performSearch(currentPage);
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function deleteNames(namesArray) {
  try {
    bulkDeleteBtn.disabled = true;
    const res = await fetch(`/api/explorer/${encodeURIComponent(currentCategory)}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: namesArray })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    showStatus(`Successfully deleted ${data.deleted} name(s).`);
    selectedNames.clear();
    performSearch(currentPage);
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    bulkDeleteBtn.disabled = false;
  }
}

bulkDeleteBtn.addEventListener('click', () => {
  if (confirm(`Are you sure you want to delete ${selectedNames.size} selected name(s)?`)) {
    deleteNames(Array.from(selectedNames));
  }
});

// Sidebar Toggle Functionality
const sidebarToggleEl = document.getElementById('sidebarToggle');
if (sidebarToggleEl) {
  const sideNav = document.querySelector('.side-nav');
  
  // Check localStorage for saved state
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true') {
    sideNav.classList.add('collapsed');
  }
  
  sidebarToggleEl.addEventListener('click', () => {
    sideNav.classList.toggle('collapsed');
    const isCollapsed = sideNav.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });
}
