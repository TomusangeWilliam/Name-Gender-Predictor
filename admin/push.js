document.addEventListener("DOMContentLoaded", () => {
  const loadingEl = document.getElementById("loading");
  const contentEl = document.getElementById("content");
  const branchNameEl = document.getElementById("branchName");
  const fileListEl = document.getElementById("fileList");
  const commitBtn = document.getElementById("commitBtn");
  const pushBtn = document.getElementById("pushBtn");
  const commitMsgEl = document.getElementById("commitMsg");
  const gitConsole = document.getElementById("gitConsole");

  async function loadStatus() {
    loadingEl.style.display = "block";
    contentEl.style.display = "none";
    try {
      const [statusRes, diffRes] = await Promise.all([
        fetch("/api/git/status"),
        fetch("/api/git/diff-summary")
      ]);
      const statusData = await statusRes.json();
      const diffData = await diffRes.json();

      if (!statusData.ok) throw new Error(statusData.error || "Status failed");
      
      const diffMap = {};
      if (diffData.ok && diffData.diffs) {
        diffData.diffs.forEach(d => { diffMap[d.file] = d; });
      }

      branchNameEl.textContent = `Branch: ${statusData.branch}`;
      
      fileListEl.innerHTML = "";
      if (statusData.files && statusData.files.length > 0) {
        statusData.files.forEach(f => {
          const div = document.createElement("div");
          div.className = "file-item";
          
          let badgeClass = "M"; // modified
          if (f.status.includes("A")) badgeClass = "A"; // added
          if (f.status.includes("D")) badgeClass = "D"; // deleted
          if (f.status.includes("?")) badgeClass = "U"; // untracked
          
          const diffInfo = diffMap[f.file];
          const diffHtml = diffInfo ? `
            <div class="diff-summary">
              ${diffInfo.added ? `<span class="diff-count diff-plus">+${diffInfo.added}</span>` : ''}
              ${diffInfo.deleted ? `<span class="diff-count diff-minus">-${diffInfo.deleted}</span>` : ''}
            </div>
          ` : '';

          div.innerHTML = `
            <span class="status-badge ${badgeClass}">${f.status}</span>
            <span>${f.file}</span>
            ${diffHtml}
          `;
          fileListEl.appendChild(div);
        });
      } else {
        fileListEl.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
            <i class="ph ph-check-circle" style="font-size: 24px; color: #34d399; display:block; margin-bottom:8px;"></i>
            Working directory is clean. No uncommitted changes.
          </div>
        `;
      }
    } catch (err) {
      fileListEl.innerHTML = `<div style="padding: 16px; color: #fca5a5;">Error: ${err.message}</div>`;
    } finally {
      loadingEl.style.display = "none";
      contentEl.style.display = "grid";
    }
  }

  const magicBrushBtn = document.getElementById("magicBrushBtn");
  magicBrushBtn.addEventListener("click", async () => {
    try {
      magicBrushBtn.classList.add("pulse");
      const res = await fetch("/api/git/diff-summary");
      const data = await res.json();
      if (!data.ok || !data.diffs || data.diffs.length === 0) {
          commitMsgEl.value = "Update datasets";
          return;
      }

      let totalAdd = 0;
      let totalDel = 0;
      let files = 0;
      data.diffs.forEach(d => {
          totalAdd += d.added;
          totalDel += d.deleted;
          files++;
      });

      const emoji = totalAdd > totalDel ? "✨" : "🛠️";
      const parts = [];
      if (totalAdd) parts.push(`added ${totalAdd} items`);
      if (totalDel) parts.push(`cleaned ${totalDel} items`);
      
      const fileText = files === 1 ? "1 file" : `${files} files`;
      commitMsgEl.value = `${emoji} ${parts.join(" and ")} across ${fileText}`;
      
    } catch (e) {
      commitMsgEl.value = "Minor updates to datasets";
    } finally {
      magicBrushBtn.classList.remove("pulse");
    }
  });

  function appendConsole(text) {
    if (!text) return;
    gitConsole.textContent += "\n" + text;
    gitConsole.scrollTop = gitConsole.scrollHeight;
  }

  commitBtn.addEventListener("click", async () => {
    const msg = commitMsgEl.value.trim();
    if (!msg) {
        alert("Please enter a commit message.");
        return;
    }

    commitBtn.disabled = true;
    commitBtn.innerHTML = `<i class="ph ph-spinner-gap pulse"></i> Committing...`;
    gitConsole.textContent = "> git commit...";

    try {
      const res = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      
      if (!data.ok) throw new Error(data.error || data.stderr || "Commit failed");

      if (data.stdout) appendConsole(data.stdout);
      if (data.stderr) appendConsole(data.stderr);
      if (data.message) appendConsole(data.message);

      commitMsgEl.value = "";
      await loadStatus(); // refresh status
    } catch (err) {
      appendConsole(`Error: ${err.message}`);
      // Show more detail if possible
      if (err.message.includes("Git command failed")) {
          appendConsole("Check standard error below for clues.");
      }
    } finally {
      commitBtn.disabled = false;
      commitBtn.innerHTML = `<i class="ph ph-git-commit"></i> Commit Changes`;
    }
  });

  pushBtn.addEventListener("click", async () => {
    pushBtn.disabled = true;
    pushBtn.innerHTML = `<i class="ph ph-spinner-gap pulse"></i> Pushing...`;
    gitConsole.textContent = "> git push...";

    try {
      const res = await fetch("/api/git/push", {
        method: "POST"
      });
      const data = await res.json();
      
      if (!data.ok) throw new Error(data.error || data.stderr || "Push failed");

      if (data.stdout) appendConsole(data.stdout);
      if (data.stderr) appendConsole(data.stderr);
      appendConsole("Success: Push completed.");
      await loadStatus(); // Refresh status after push
    } catch (err) {
      appendConsole(`Error: ${err.message}`);
    } finally {
      pushBtn.disabled = false;
      pushBtn.innerHTML = `<i class="ph ph-upload-simple"></i> Push to GitLab`;
    }
  });

  // Init
  loadStatus();

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
});
