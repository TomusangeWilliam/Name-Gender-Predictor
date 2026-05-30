(function () {
  let userName = localStorage.getItem('rt-username');
  if (!userName || userName.trim() === '') {
    userName = prompt('Enter your display name for real-time collaboration (e.g., your name):');
    if (!userName || userName.trim() === '') {
      userName = 'Guest-' + Math.floor(Math.random() * 9000 + 1000);
    }
    localStorage.setItem('rt-username', userName.trim());
  }

  const socket = io({
    auth: {
      username: userName.trim()
    }
  });
  const listeners = [];

  // Create a small status indicator if it doesn't exist
  function createIndicator() {
    if (document.getElementById('rt-status')) return;
    const indicator = document.createElement('div');
    indicator.id = 'rt-status';
    indicator.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 6px 12px;
      background: rgba(43, 45, 59, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 9999;
      pointer-events: none;
      transition: all 0.3s ease;
    `;
    indicator.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; display: inline-block;" id="rt-dot"></span>
      <span id="rt-text">Connecting...</span>
    `;
    document.body.appendChild(indicator);
  }

  function updateStatus(status) {
    const dot = document.getElementById('rt-dot');
    const text = document.getElementById('rt-text');
    if (!dot || !text) return;

    if (status === 'connected') {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px #10b981';
      text.textContent = 'Live Sync Active';
    } else {
      dot.style.background = '#f87171';
      dot.style.boxShadow = 'none';
      text.textContent = 'Offline';
    }
  }

  socket.on('connect', () => {
    createIndicator();
    updateStatus('connected');
  });

  socket.on('disconnect', () => {
    updateStatus('disconnected');
  });

  const presenceListeners = [];

  socket.on('data-changed', (data) => {
    console.log('Real-time update received:', data);
    listeners.forEach(cb => cb(data));

    // Show a brief flash on the indicator to show something happened
    const indicator = document.getElementById('rt-status');
    if (indicator) {
      indicator.style.borderColor = 'rgba(165, 178, 235, 0.5)';
      setTimeout(() => {
        indicator.style.borderColor = 'rgba(255,255,255,0.05)';
      }, 500);
    }
  });

  socket.on('presence-sync', (presences) => {
    // Filter out our own presence
    const others = presences.filter(p => p.id !== socket.id);
    presenceListeners.forEach(cb => cb(others));
  });

  // Global API for pages to use
  window.RealTimeSync = {
    onDataChange: (callback) => {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },
    onPresenceSync: (callback) => {
      if (typeof callback === 'function') {
        presenceListeners.push(callback);
      }
    },
    sendPresence: (cellId) => {
      socket.emit('presence-update', { cellId });
    }
  };
})();
