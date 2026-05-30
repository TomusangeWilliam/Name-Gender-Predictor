const $ = (id) => document.getElementById(id);

const categoryEl = $("category");
const namesEl = $("names");
const saveEl = $("save");
const clearEl = $("clear");
const resultEl = $("result");
const loadStatsEl = $("loadStats");
const refreshOverviewEl = $("refreshOverview");
const dedupeEl = $("dedupe");
const cleanUnisexEl = $("cleanUnisex");
const statsEl = $("stats");
const overviewFemaleEl = $("overviewFemale");
const overviewMaleEl = $("overviewMale");
const overviewUnisexEl = $("overviewUnisex");
const updateFemaleEl = $("updateFemale");
const updateMaleEl = $("updateMale");
const updateUnisexEl = $("updateUnisex");
const sidebarToggleEl = $("sidebarToggle");

// Bulk Operations Elements
const bulkFemaleEl = $("bulkFemale");
const bulkMaleEl = $("bulkMale");
const bulkUnisexEl = $("bulkUnisex");
const bulkDedupeEl = $("bulkDedupe");
const bulkAuditEl = $("bulkAudit");
const operationQueueEl = $("operationQueue");
const queueListEl = $("queueList");
const queueCountEl = $("queueCount");
const progressFillEl = $("progressFill");
const progressStatusEl = $("progressStatus");
const progressPercentEl = $("progressPercent");

function formatUpdate(dateString) {
  if (!dateString) return "Last update: Unknown";
  const d = new Date(dateString);
  return `Last update: ${d.toLocaleString()}`;
}
const jsonChipEl = $("jsonChip");
const jsonFileInputEl = $("jsonFileInput");

function setResult(kind, text) {
  if (!resultEl) return;
  // Support both old `.result` and dashboard `.status-msg` styling.
  resultEl.className = `status-msg ${kind || ""}`.trim();
  resultEl.textContent = text || "";
}

function formatCount(n) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString();
}

async function save() {
  if (!categoryEl || !namesEl) return;
  const category = categoryEl.value;
  const names = namesEl.value;

  setResult("", "Saving…");
  if (saveEl) saveEl.disabled = true;
  if (clearEl) clearEl.disabled = true;

  try {
    const res = await fetch(`/api/names/${encodeURIComponent(category)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Request failed (${res.status})`;
      setResult("error", msg);
      return;
    }

    const added = data?.added ?? 0;
    const total = data?.total ?? "?";
    const fileLabel =
      category === "female"
        ? "female-names.json"
        : category === "male"
          ? "male-names.json"
          : category === "unisex"
            ? "unisex-names.json"
            : category;
    setResult("ok", `Saved to ${fileLabel}. Added ${added} name(s). Total now: ${total}.`);
    await refreshOverview();
  } catch (e) {
    setResult("error", e && e.message ? e.message : String(e));
  } finally {
    if (saveEl) saveEl.disabled = false;
    if (clearEl) clearEl.disabled = false;
  }
}

if (saveEl) saveEl.addEventListener("click", save);
if (clearEl) {
  clearEl.addEventListener("click", () => {
    if (!namesEl) return;
    namesEl.value = "";
    setResult("", "Cleared.");
    namesEl.focus();
  });
}

function setStats(text) {
  if (!statsEl) return;
  statsEl.textContent = text || "";
}

async function loadStats() {
  if (!categoryEl) return;
  const category = categoryEl.value;
  setResult("", "Loading JSON stats…");
  if (loadStatsEl) loadStatsEl.disabled = true;
  if (dedupeEl) dedupeEl.disabled = true;
  try {
    const res = await fetch(`/api/names/${encodeURIComponent(category)}/stats`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Request failed (${res.status})`;
      setResult("error", msg);
      return;
    }
    const total = data?.total ?? "?";
    const unique = data?.unique ?? "?";
    const dups = data?.duplicates ?? 0;
    const preview = (data?.duplicatesPreview || []).slice(0, 8).join(", ");
    setResult("ok", "Loaded JSON stats.");
    setStats(
      `Total: ${total} • Unique: ${unique} • Duplicates: ${dups}` +
        (preview ? `\nExamples: ${preview}` : ""),
    );
  } catch (e) {
    setResult("error", e && e.message ? e.message : String(e));
  } finally {
    if (loadStatsEl) loadStatsEl.disabled = false;
    if (dedupeEl) dedupeEl.disabled = false;
  }
}

async function refreshOverview() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return;

    const female = data?.byCategory?.female?.total;
    const male = data?.byCategory?.male?.total;
    const unisex = data?.byCategory?.unisex?.total;

    if (overviewFemaleEl) overviewFemaleEl.textContent = formatCount(female);
    if (overviewMaleEl) overviewMaleEl.textContent = formatCount(male);
    if (overviewUnisexEl) overviewUnisexEl.textContent = formatCount(unisex);

    if (updateFemaleEl && data?.byCategory?.female?.lastUpdate) {
      updateFemaleEl.textContent = formatUpdate(data.byCategory.female.lastUpdate);
    }
    if (updateMaleEl && data?.byCategory?.male?.lastUpdate) {
      updateMaleEl.textContent = formatUpdate(data.byCategory.male.lastUpdate);
    }
    if (updateUnisexEl && data?.byCategory?.unisex?.lastUpdate) {
      updateUnisexEl.textContent = formatUpdate(data.byCategory.unisex.lastUpdate);
    }
  } catch {
    // ignore; overview is optional
  }
}

async function deduplicate() {
  if (!categoryEl) return;
  const category = categoryEl.value;
  setResult("", "Removing duplicates…");
  if (loadStatsEl) loadStatsEl.disabled = true;
  if (dedupeEl) dedupeEl.disabled = true;
  try {
    const res = await fetch(`/api/names/${encodeURIComponent(category)}/deduplicate`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Request failed (${res.status})`;
      setResult("error", msg);
      return;
    }
    const removed = data?.removed ?? 0;
    const total = data?.total ?? "?";
    setResult("ok", `Done. Removed ${removed} duplicate(s). Total now: ${total}.`);
    await refreshOverview();
    await loadStats();
  } catch (e) {
    setResult("error", e && e.message ? e.message : String(e));
  } finally {
    if (loadStatsEl) loadStatsEl.disabled = false;
    if (dedupeEl) dedupeEl.disabled = false;
  }
}

async function cleanUnisex() {
  setResult("", "Cleaning unisex names from datasets…");
  if (loadStatsEl) loadStatsEl.disabled = true;
  if (dedupeEl) dedupeEl.disabled = true;
  if (cleanUnisexEl) cleanUnisexEl.disabled = true;
  try {
    const res = await fetch(`/api/clean-unisex`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data && data.error ? data.error : `Request failed (${res.status})`);
    
    setResult("ok", `Done. Removed ${data.removedFemale} from Female and ${data.removedMale} from Male.`);
    await refreshOverview();
  } catch (e) {
    setResult("error", e && e.message ? e.message : String(e));
  } finally {
    if (loadStatsEl) loadStatsEl.disabled = false;
    if (dedupeEl) dedupeEl.disabled = false;
    if (cleanUnisexEl) cleanUnisexEl.disabled = false;
  }
}

if (loadStatsEl) loadStatsEl.addEventListener("click", loadStats);
if (dedupeEl) dedupeEl.addEventListener("click", deduplicate);
if (cleanUnisexEl) cleanUnisexEl.addEventListener("click", cleanUnisex);
if (categoryEl) {
  categoryEl.addEventListener("change", () => {
    setStats("Tip: dedupe is case-insensitive and keeps the first occurrence.");
  });
}

if (refreshOverviewEl) refreshOverviewEl.addEventListener("click", refreshOverview);
refreshOverview();

function applyTemplateFromJson(obj) {
  if (!categoryEl || !namesEl) return;

  const cat = categoryEl.value;
  let list = [];

  if (Array.isArray(obj.femaleUnknowns) && cat === "female") {
    list = obj.femaleUnknowns;
  } else if (Array.isArray(obj.maleUnknowns) && cat === "male") {
    list = obj.maleUnknowns;
  } else if (Array.isArray(obj.unisexUnknowns) && cat === "unisex") {
    list = obj.unisexUnknowns;
  }

  if (!list.length) {
    setResult("error", "No names found in the JSON for this category.");
    return;
  }

  namesEl.value = list.join("\n");
  setResult(
    "ok",
    `Loaded ${list.length} name(s) from JSON into the editor. Click \"Save names\" to append to the list.`
  );
}

// Sidebar Toggle Functionality
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

if (jsonChipEl && jsonFileInputEl) {
  jsonChipEl.addEventListener("click", () => {
    jsonFileInputEl.value = "";
    jsonFileInputEl.click();
  });

  jsonFileInputEl.addEventListener("change", () => {
    const file = jsonFileInputEl.files && jsonFileInputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        applyTemplateFromJson(parsed);
      } catch (e) {
        setResult("error", e && e.message ? e.message : "Could not parse JSON file.");
      }
    };
    reader.onerror = () => {
      setResult("error", "Failed to read JSON file.");
    };
    reader.readAsText(file, "utf-8");
  });
}

// ==================== BULK OPERATIONS QUEUE ====================

let operationQueue = [];
let isProcessing = false;

function getSelectedCategories() {
  const categories = [];
  if (bulkFemaleEl && bulkFemaleEl.checked) categories.push('female');
  if (bulkMaleEl && bulkMaleEl.checked) categories.push('male');
  if (bulkUnisexEl && bulkUnisexEl.checked) categories.push('unisex');
  return categories;
}

function updateBulkButtons() {
  const selected = getSelectedCategories();
  const hasSelection = selected.length > 0;
  
  if (bulkDedupeEl) bulkDedupeEl.disabled = !hasSelection || isProcessing;
  if (bulkAuditEl) bulkAuditEl.disabled = !hasSelection || isProcessing;
}

function addToQueue(operation) {
  operationQueue.push({
    id: Date.now() + Math.random(),
    ...operation,
    status: 'pending',
    timestamp: new Date()
  });
  renderQueue();
}

function renderQueue() {
  if (!operationQueueEl || !queueListEl || !queueCountEl) return;
  
  if (operationQueue.length === 0) {
    operationQueueEl.style.display = 'none';
    return;
  }
  
  operationQueueEl.style.display = 'block';
  queueCountEl.textContent = operationQueue.length;
  
  queueListEl.innerHTML = operationQueue.map(op => {
    const icon = getStatusIcon(op.status);
    const statusText = getStatusText(op.status);
    const time = op.timestamp.toLocaleTimeString();
    
    return `
      <div class="queue-item ${op.status}">
        <div class="queue-item-icon">${icon}</div>
        <div class="queue-item-content">
          <div class="queue-item-title">${op.title}</div>
          <div class="queue-item-status">${statusText} • ${time}</div>
        </div>
      </div>
    `;
  }).join('');
  
  updateProgress();
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending': return '<i class="ph ph-clock"></i>';
    case 'processing': return '<i class="ph ph-spinner animate-spin"></i>';
    case 'completed': return '<i class="ph ph-check-circle"></i>';
    case 'failed': return '<i class="ph ph-x-circle"></i>';
    default: return '<i class="ph ph-circle"></i>';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending': return 'Waiting';
    case 'processing': return 'Processing...';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    default: return 'Unknown';
  }
}

function updateProgress() {
  if (!progressFillEl || !progressStatusEl || !progressPercentEl) return;
  
  const total = operationQueue.length;
  if (total === 0) {
    progressFillEl.style.width = '0%';
    progressStatusEl.textContent = 'Ready';
    progressPercentEl.textContent = '0%';
    return;
  }
  
  const completed = operationQueue.filter(op => op.status === 'completed').length;
  const failed = operationQueue.filter(op => op.status === 'failed').length;
  const processing = operationQueue.filter(op => op.status === 'processing').length;
  const percent = Math.round((completed / total) * 100);
  
  progressFillEl.style.width = `${percent}%`;
  progressPercentEl.textContent = `${percent}%`;
  
  if (processing > 0) {
    progressStatusEl.textContent = 'Processing...';
  } else if (failed > 0) {
    progressStatusEl.textContent = `${completed}/${total} completed, ${failed} failed`;
  } else if (completed === total) {
    progressStatusEl.textContent = 'All operations completed';
  } else {
    progressStatusEl.textContent = `${completed}/${total} completed`;
  }
}

async function processQueue() {
  if (isProcessing || operationQueue.length === 0) return;
  
  isProcessing = true;
  updateBulkButtons();
  
  for (let i = 0; i < operationQueue.length; i++) {
    const op = operationQueue[i];
    if (op.status !== 'pending') continue;
    
    // Mark as processing
    op.status = 'processing';
    renderQueue();
    
    try {
      if (op.type === 'dedupe') {
        await executeDedupe(op.category);
      } else if (op.type === 'audit') {
        await executeAudit(op.category);
      }
      
      op.status = 'completed';
      op.result = 'Success';
    } catch (error) {
      op.status = 'failed';
      op.result = error.message || 'Unknown error';
    }
    
    renderQueue();
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  isProcessing = false;
  updateBulkButtons();
  
  // Auto-refresh overview after all operations
  await refreshOverview();
}

async function executeDedupe(category) {
  const res = await fetch(`/api/names/${encodeURIComponent(category)}/deduplicate`, {
    method: "POST",
  });
  const data = await res.json().catch(() => null);
  
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : `Request failed (${res.status})`);
  }
  
  return data;
}

async function executeAudit(category) {
  const res = await fetch(`/api/names/${encodeURIComponent(category)}/stats`);
  const data = await res.json().catch(() => null);
  
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : `Request failed (${res.status})`);
  }
  
  return data;
}

// Event listeners for bulk operations
if (bulkFemaleEl) bulkFemaleEl.addEventListener('change', updateBulkButtons);
if (bulkMaleEl) bulkMaleEl.addEventListener('change', updateBulkButtons);
if (bulkUnisexEl) bulkUnisexEl.addEventListener('change', updateBulkButtons);

if (bulkDedupeEl) {
  bulkDedupeEl.addEventListener('click', () => {
    const categories = getSelectedCategories();
    if (categories.length === 0) return;
    
    categories.forEach(category => {
      addToQueue({
        type: 'dedupe',
        category: category,
        title: `Deduplicate ${category.charAt(0).toUpperCase() + category.slice(1)} Names`
      });
    });
    
    processQueue();
  });
}

if (bulkAuditEl) {
  bulkAuditEl.addEventListener('click', async () => {
    const categories = getSelectedCategories();
    if (categories.length === 0) return;
    
    categories.forEach(category => {
      addToQueue({
        type: 'audit',
        category: category,
        title: `Audit ${category.charAt(0).toUpperCase() + category.slice(1)} Dataset`
      });
    });
    
    processQueue();
  });
}

