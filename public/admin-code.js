/**
 * Admin Code Proposals UI
 */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  const adminToken = getToken();
  const userToken = getUserToken();
  if (!adminToken && !userToken) {
    window.location.href = '/login.html';
    return;
  }
  window.__DEFAULT_USE_USER_TOKEN = !adminToken && !!userToken;

  const fileInput = document.getElementById('code-file');
  const noteInput = document.getElementById('code-note');
  const contentInput = document.getElementById('code-content');
  const submitBtn = document.getElementById('code-submit');
  const refreshBtn = document.getElementById('code-refresh');
  const proposalList = document.getElementById('proposal-list');
  const statusEl = document.getElementById('code-status');
  const themeToggle = document.getElementById('code-theme-toggle');
  const logoutBtn = document.getElementById('code-logout');
  const testRunBtn = document.getElementById('test-run');
  const testRunCustomBtn = document.getElementById('test-run-custom');
  const testOutputEl = document.getElementById('test-output');
  const reviewBtn = document.getElementById('review-file');
  const autoReviewBtn = document.getElementById('auto-review-suggest');
  const applyPatchBtn = document.getElementById('apply-patch');
  const progressFill = document.getElementById('progress-fill');
  const structuredEditBtn = document.getElementById('structured-edit');
  let progressTimer = null;

  function setStatus(text) {
    statusEl.textContent = text || '';
  }

  function startProgress() {
    if (!progressFill) return;
    let pct = 5;
    progressFill.style.width = `${pct}%`;
    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      pct = Math.min(95, pct + 5);
      progressFill.style.width = `${pct}%`;
    }, 500);
  }

  function endProgress() {
    if (!progressFill) return;
    clearInterval(progressTimer);
    progressFill.style.width = '100%';
    setTimeout(() => {
      progressFill.style.width = '0%';
    }, 500);
  }

  function renderProposals(items = []) {
    proposalList.innerHTML = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = 'No proposals yet.';
      proposalList.appendChild(li);
      return;
    }

    items.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'proposal-card';

      const title = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = p.filePath;
      title.appendChild(strong);
      li.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'muted-line';
      meta.textContent = `${p.note || 'No note'} • ${p.status || 'pending'} • ${p.createdAt || ''}`;
      li.appendChild(meta);

      if (p.content) {
        const preview = document.createElement('pre');
        preview.className = 'muted-line';
        preview.style.whiteSpace = 'pre-wrap';
        preview.textContent = (p.content || '').slice(0, 400);
        li.appendChild(preview);
      } else if (p.contentPreview) {
        const preview = document.createElement('pre');
        preview.className = 'muted-line';
        preview.style.whiteSpace = 'pre-wrap';
        preview.textContent = p.contentPreview;
        li.appendChild(preview);
      }

      const badge = document.createElement('span');
      badge.className = `badge ${p.status === 'applied' ? 'applied' : 'pending'}`;
      badge.textContent = p.status === 'applied' ? 'applied' : 'pending';
      li.appendChild(badge);

      const actions = document.createElement('div');
      actions.className = 'proposal-actions';
      const diffBtn = document.createElement('button');
      diffBtn.className = 'btn btn-secondary btn-sm';
      diffBtn.textContent = 'View diff';
      diffBtn.addEventListener('click', () => showDiff(p.id));
      actions.appendChild(diffBtn);
      if (p.status !== 'applied') {
        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-success btn-sm';
        applyBtn.textContent = 'Apply';
        applyBtn.addEventListener('click', () => applyProposal(p.id));
        actions.appendChild(applyBtn);
      }
      proposalList.appendChild(li);
      if (actions.children.length) li.appendChild(actions);
    });
  }

  async function showDiff(id) {
    if (!id) return;
    try {
      setStatus('Loading diff...');
      const res = await apiCall(`/admin/code-proposals/${id}/diff`, { method: 'GET' });
      if (res && res.diff) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.maxHeight = '320px';
        pre.style.overflowY = 'auto';
        pre.textContent = res.diff;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.maxWidth = '900px';
        content.style.whiteSpace = 'pre-wrap';
        content.appendChild(pre);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary btn-sm';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => modal.remove());
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);
      } else {
        Toast.warning('No diff available.');
      }
    } catch (err) {
      Toast.error(`Diff failed: ${err.message}`);
    } finally {
      setStatus('');
    }
  }

  async function loadProposals() {
    try {
      const res = await apiCall('/admin/code-proposals', { method: 'GET' });
      renderProposals(res && res.proposals ? res.proposals : []);
    } catch (err) {
      Toast.error(`Failed to load proposals: ${err.message}`);
    }
  }

  async function applyProposal(id) {
    if (!id) return;
    try {
      setStatus('Applying...');
      const res = await apiCall(`/admin/code-proposals/${id}/apply`, { method: 'POST' });
      if (res && res.applied) {
        Toast.success(`Applied. Backup: ${res.backup || 'none'}`);
        await loadProposals();
      }
    } catch (err) {
      Toast.error(`Apply failed: ${err.message}`);
    } finally {
      setStatus('');
    }
  }

  async function runTests(command) {
    try {
      setStatus('Running tests...');
      startProgress();
      testOutputEl.textContent = '';
      const res = await apiCall('/admin/run-tests', {
        method: 'POST',
        body: JSON.stringify({ command }),
      });
      testOutputEl.textContent = res.output || '';
      setStatus(`Tests finished (code ${res.code}${res.signal ? `, signal ${res.signal}` : ''}${res.durationMs ? `, ${res.durationMs}ms` : ''})`);
    } catch (err) {
      testOutputEl.textContent = '';
      setStatus('Tests failed to run');
      Toast.error(`Test run failed: ${err.message}`);
    } finally {
      endProgress();
    }
  }

  async function reviewFile() {
    const filePath = (fileInput.value || '').trim();
    if (!filePath) {
      Toast.warning('Enter a file path to review.');
      return;
    }
    try {
      setStatus('Reviewing file...');
      startProgress();
      testOutputEl.textContent = '';
      const res = await apiCall('/admin/code-review', {
        method: 'POST',
        body: JSON.stringify({ filePath }),
      });
      const lines = [];
      if (res.check && typeof res.check.code === 'number') {
        lines.push(`node --check exit code: ${res.check.code}${res.check.signal ? ` (signal ${res.check.signal})` : ''}`);
      }
      if (res.check && res.check.output) {
        lines.push(res.check.output);
      }
      if (res.lint && res.lint.length) {
        lines.push('Lint results:');
        res.lint.forEach(l => lines.push(`${l.name}: exit ${l.code}${l.durationMs ? `, ${l.durationMs}ms` : ''}`));
      }
      if (res.suggestions && res.suggestions.length) {
        lines.push('Suggestions:');
        res.suggestions.forEach(s => lines.push(`- ${s}`));
      }
      testOutputEl.textContent = lines.join('\n');
      setStatus('Review complete');
    } catch (err) {
      testOutputEl.textContent = '';
      setStatus('Review failed');
      Toast.error(`Review failed: ${err.message}`);
    } finally {
      endProgress();
    }
  }

  async function autoReviewSuggest() {
    const filePath = (fileInput.value || '').trim();
    if (!filePath) {
      Toast.warning('Enter a file path to review.');
      return;
    }
    try {
      const runTests = window.confirm('Run tests as part of the review?');
      setStatus('Auto reviewing...');
      startProgress();
      testOutputEl.textContent = '';
      const res = await apiCall('/admin/review-and-suggest', {
        method: 'POST',
        body: JSON.stringify({ filePath, runTests }),
      });
      const lines = [];
      if (res.check) {
        lines.push(`node --check exit: ${res.check.code}`);
        if (res.check.output) lines.push(res.check.output);
      }
      if (res.tests) {
        lines.push(`tests exit: ${res.tests.code}`);
        if (res.tests.output) lines.push(res.tests.output);
      }
      if (res.lint) {
        lines.push('lint results:');
        res.lint.forEach(l => lines.push(`${l.name}: exit ${l.code}${l.durationMs ? `, ${l.durationMs}ms` : ''}`));
      }
      if (res.knowledge) {
        lines.push(`knowledge: ${res.knowledge.title} -> ${res.knowledge.url}`);
      }
      testOutputEl.textContent = lines.join('\n');
      setStatus('Auto review complete (proposal created). Reloading proposals...');
      await loadProposals();
    } catch (err) {
      testOutputEl.textContent = '';
      setStatus('Auto review failed');
      Toast.error(`Auto review failed: ${err.message}`);
    } finally {
      endProgress();
    }
  }

  async function applyPatchFlow() {
    const filePath = (fileInput.value || '').trim();
    if (!filePath) {
      Toast.warning('Enter a file path first.');
      return;
    }
    const patch = prompt('Paste unified diff (---/+++ @@ hunks)...');
    if (!patch) return;
    try {
      setStatus('Applying patch...');
      startProgress();
      const res = await apiCall('/admin/code-patch', {
        method: 'POST',
        body: JSON.stringify({ filePath, patch }),
      });
      setStatus('Patch applied; proposal created. Reloading proposals...');
      await loadProposals();
      Toast.success(`Patch applied. Backup: ${res.backup || 'none'}`);
    } catch (err) {
      setStatus('Patch apply failed');
      Toast.error(`Patch failed: ${err.message}`);
    } finally {
      endProgress();
    }
  }

  async function structuredEditFlow() {
    const filePath = (fileInput.value || '').trim();
    if (!filePath) {
      Toast.warning('Enter a file path first.');
      return;
    }
    const startLine = parseInt(prompt('Start line (1-based)'), 10);
    const endLine = parseInt(prompt('End line (inclusive)'), 10);
    const replacement = prompt('Replacement text (use \\n for newlines):', '') || '';
    if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine) {
      Toast.warning('Invalid line range.');
      return;
    }
    try {
      setStatus('Applying structured edit...');
      startProgress();
      const body = {
        filePath,
        startLine,
        endLine,
        replacement: replacement.replace(/\\n/g, '\n'),
      };
      const res = await apiCall('/admin/code-edit', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setStatus('Structured edit applied; proposal created. Reloading proposals...');
      await loadProposals();
      Toast.success(`Edit applied. Backup: ${res.backup || 'none'}`);
    } catch (err) {
      setStatus('Structured edit failed');
      Toast.error(`Edit failed: ${err.message}`);
    } finally {
      endProgress();
    }
  }

  submitBtn.addEventListener('click', async () => {
    const filePath = (fileInput.value || '').trim();
    const content = contentInput.value || '';
    const note = noteInput.value || '';
    if (!filePath || !content) {
      Toast.warning('File path and content required.');
      return;
    }
    try {
      setStatus('Submitting...');
      const res = await apiCall('/admin/code-proposals', {
        method: 'POST',
        body: JSON.stringify({ filePath, content, note }),
      });
      if (res && res.proposal) {
        Toast.success('Proposal submitted.');
        await loadProposals();
      }
    } catch (err) {
      Toast.error(`Submit failed: ${err.message}`);
    } finally {
      setStatus('');
    }
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadProposals);
  }

  if (testRunBtn) {
    testRunBtn.addEventListener('click', () => runTests('npm test'));
  }

  if (testRunCustomBtn) {
    testRunCustomBtn.addEventListener('click', () => {
      const cmd = prompt('Enter test command', 'npm test');
      if (cmd) runTests(cmd);
    });
  }

  if (reviewBtn) {
    reviewBtn.addEventListener('click', reviewFile);
  }

  if (autoReviewBtn) {
    autoReviewBtn.addEventListener('click', autoReviewSuggest);
  }

  if (applyPatchBtn) {
    applyPatchBtn.addEventListener('click', applyPatchFlow);
  }

  if (structuredEditBtn) {
    structuredEditBtn.addEventListener('click', structuredEditFlow);
  }

  if (themeToggle) {
    setThemeButtonLabel(themeToggle);
    themeToggle.addEventListener('click', () => {
      const next = toggleTheme();
      setThemeButtonLabel(themeToggle);
      Toast.info(`Theme: ${next}`);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      clearUserToken();
      Toast.info('Logged out.');
      setTimeout(() => (window.location.href = '/login.html'), 200);
    });
  }

  loadProposals();
});
