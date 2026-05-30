async function loadAnalytics() {
  try {
    const res = await fetch("/api/analytics");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("Failed to load analytics");

    const analytics = data.analytics;
    const audit = data.audit || { female:{added:0,deleted:0}, male:{added:0,deleted:0}, unisex:{added:0,deleted:0} };
    
    // Summary Stats
    document.getElementById("totalOverall").textContent = analytics.overall.total.toLocaleString();
    
    // Audit Stats
    document.getElementById("addF").textContent = audit.female.added.toLocaleString();
    document.getElementById("addM").textContent = audit.male.added.toLocaleString();
    document.getElementById("addU").textContent = audit.unisex.added.toLocaleString();
    document.getElementById("delF").textContent = audit.female.deleted.toLocaleString();
    document.getElementById("delM").textContent = audit.male.deleted.toLocaleString();
    document.getElementById("delU").textContent = audit.unisex.deleted.toLocaleString();
    document.getElementById("avgLength").textContent = analytics.overall.avgLength.toFixed(2);

    // Longest names lists
    const makeList = (arr) => arr.map(n => `<li>${n} <span class="len">${n.length} chars</span></li>`).join('');
    document.getElementById("longestFemale").innerHTML = makeList(analytics.female.longest);
    document.getElementById("longestMale").innerHTML = makeList(analytics.male.longest);
    document.getElementById("longestUnisex").innerHTML = makeList(analytics.unisex.longest);

    // Hide loader, show content
    document.getElementById("loading").style.display = "none";
    document.getElementById("analytics-content").style.display = "block";

    // Charts Config
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = 'Inter';

    // 1. Gender Distribution Pie (Doughnut)
    const ctxGender = document.getElementById('genderChart').getContext('2d');
    new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: ['Female', 'Male', 'Unisex'],
        datasets: [{
          data: [analytics.female.total, analytics.male.total, analytics.unisex.total],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)', // Green (Female)
            'rgba(165, 178, 235, 0.7)', // Lavender (Male)
            'rgba(218, 147, 93, 0.7)'  // Orange (Unisex)
          ],
          borderColor: 'rgba(24, 24, 27, 1)',
          borderWidth: 2,
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20 } }
        },
        cutout: '70%'
      }
    });

    // 2. Name Length Clusters (Bubble Chart)
    const ctxBubble = document.getElementById('bubbleChart').getContext('2d');
    const lengthDist = analytics.overall.lengthDist || {};
    const bubbleData = Object.entries(lengthDist).map(([len, count]) => ({
      x: parseInt(len),
      y: count,
      r: Math.max(5, Math.min(25, count / 5)) // Scale radius
    }));

    new Chart(ctxBubble, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Frequency',
          data: bubbleData,
          backgroundColor: 'rgba(129, 140, 248, 0.5)',
          borderColor: 'rgba(129, 140, 248, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Chars Length', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Occurrences', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 3. Dataset Growth History (Line Chart)
    const ctxGrowth = document.getElementById('growthChart').getContext('2d');
    const history = data.history || [];
    
    // Process history into cumulative data points
    // We sort by time and calculate a running total
    const sortedHistory = [...history].sort((a, b) => a.t - b.t);
    const growthLabels = [];
    const growthData = [];
    let runningTotal = 0;

    // For the initial point, if we have records but no history, 
    // we'll assume the current total started at the first timestamp.
    // But since we migrated, we use the Base points.
    sortedHistory.forEach(entry => {
      runningTotal += (entry.a - entry.d);
      growthLabels.push(new Date(entry.t).toLocaleDateString());
      growthData.push(runningTotal);
    });

    new Chart(ctxGrowth, {
      type: 'line',
      data: {
        labels: growthLabels,
        datasets: [{
          label: 'Total Records',
          data: growthData,
          borderColor: '#10b981',
          background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.2), transparent)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    // 4. Alphabetical Distribution (Radar Chart)
    const ctxAlpha = document.getElementById('alphaChart').getContext('2d');
    const labels = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i));
    const getCounts = (letterMap) => labels.map(l => letterMap[l] || 0);

    new Chart(ctxAlpha, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Female',
            data: getCounts(analytics.female.letters),
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 0.8)',
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2
          },
          {
            label: 'Male',
            data: getCounts(analytics.male.letters),
            backgroundColor: 'rgba(165, 178, 235, 0.2)',
            borderColor: 'rgba(165, 178, 235, 0.8)',
            pointBackgroundColor: 'rgba(165, 178, 235, 1)',
            borderWidth: 2
          },
          {
            label: 'Unisex',
            data: getCounts(analytics.unisex.letters),
            backgroundColor: 'rgba(218, 147, 93, 0.2)',
            borderColor: 'rgba(218, 147, 93, 0.8)',
            pointBackgroundColor: 'rgba(218, 147, 93, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: { line: { tension: 0.1 } },
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.05)' },
            grid: { color: 'rgba(255,255,255,0.1)' },
            pointLabels: { color: '#94a3b8', font: { size: 11 } },
            ticks: { display: false, backdropColor: 'transparent' }
          }
        },
        plugins: {
          legend: { position: 'right' }
        }
      }
    });

  } catch (e) {
    console.error(e);
    document.getElementById("loading").textContent = "Error loading analytics: " + e.message;
    document.getElementById("loading").className = "status-msg error";
  }
}

loadAnalytics();

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
