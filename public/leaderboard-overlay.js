(() => {
  const params = new URLSearchParams(window.location.search);
  const channel = params.get('channel') || '';
  const channelEl = document.getElementById('lb-channel');
  if (channelEl) {
    channelEl.textContent = channel ? `Channel: ${channel}` : 'Global leaderboard';
  }

  const listEl = document.getElementById('lb-list');

  async function loadLeaderboard() {
    if (!listEl) return;
    try {
      const res = await fetch('/leaderboard.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderList(Array.isArray(data) ? data : []);
    } catch (err) {
      listEl.innerHTML = `<li class="lb-error">Leaderboard unavailable (${err.message})</li>`;
    }
  }

  function renderList(items) {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<li class="lb-empty">No games played yet</li>';
      return;
    }
    const top = items.slice(0, 10);
    listEl.innerHTML = top
      .map((entry, idx) => {
        const chips = entry.totalWon ?? entry.chips ?? entry.score ?? 0;
        const name = entry.username || entry.login || 'Player';
        return `
          <li class="lb-item">
            <div class="lb-rank">#${idx + 1}</div>
            <div class="lb-name">${name}</div>
            <div class="lb-chips">${chips.toLocaleString ? chips.toLocaleString() : chips}</div>
          </li>
        `;
      })
      .join('');
  }

  loadLeaderboard();
  setInterval(loadLeaderboard, 20000);
})();
