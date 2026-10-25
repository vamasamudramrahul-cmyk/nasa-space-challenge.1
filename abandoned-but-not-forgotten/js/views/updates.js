/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Updates Feed View: In-website dated release feed and optional browser notification opt-in.
 */

const UpdatesView = (() => {

  function render(container) {
    const updates = DataService.getUpdates();
    const permState = NotificationService.getPermissionState();

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Project Releases & Changelog</span>
          <h1 class="section-title">Website Updates Feed</h1>
          <p class="section-description">
            Track new verified equipment additions, data audits, interactive feature deployments, and research updates for Abandoned but Not Forgotten.
          </p>
        </div>

        <!-- Optional Browser Notification Opt-In Card -->
        <div class="detail-card" style="background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: 2.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <h3 style="margin: 0; padding: 0; border: none; font-size: 1.15rem;">Optional Browser Notifications</h3>
                <span id="notification-status-badge" class="status-badge ${permState === 'granted' ? 'green' : 'yellow'}">
                  ${permState === 'granted' ? 'Notifications Active' : (permState === 'denied' ? 'Notifications Blocked' : 'Not Enabled')}
                </span>
              </div>
              <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 0; max-width: 650px;">
                Opt in to receive optional browser alerts whenever new verified NASA hardware records or major planetary stories are published.
                Permission is requested only upon your explicit action. The in-website feed below remains fully functional even if notifications are denied or unsupported.
              </p>
            </div>

            <div>
              <button type="button" class="btn btn-primary" id="enable-notifications-btn" ${permState === 'granted' ? 'disabled' : ''}>
                ${permState === 'granted' ? '✓ Notifications Enabled' : 'Enable Browser Notifications 🔔'}
              </button>
            </div>
          </div>
        </div>

        <!-- Updates Stream -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${updates.map(upd => `
            <article class="detail-card" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-nasa-blue); text-transform: uppercase; letter-spacing: 0.08em;">
                  ${upd.category}
                </span>
                <span style="font-size: 0.85rem; font-family: monospace; color: #64748b;">
                  ${upd.date}
                </span>
              </div>

              <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 0.5rem;">
                ${upd.title}
              </h2>

              <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 1rem;">
                ${upd.summary}
              </p>

              <div>
                <a href="${upd.link}" class="btn btn-sm btn-secondary">Explore Linked Content →</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    const enableBtn = container.querySelector('#enable-notifications-btn');
    const statusBadge = container.querySelector('#notification-status-badge');

    if (enableBtn) {
      enableBtn.addEventListener('click', async () => {
        const result = await NotificationService.requestOptIn((newStatus) => {
          if (newStatus === 'granted') {
            statusBadge.className = 'status-badge green';
            statusBadge.textContent = 'Notifications Active';
            enableBtn.textContent = '✓ Notifications Enabled';
            enableBtn.disabled = true;
          } else if (newStatus === 'denied') {
            statusBadge.className = 'status-badge red';
            statusBadge.textContent = 'Notifications Blocked';
            enableBtn.textContent = 'Blocked in Browser Settings';
            enableBtn.disabled = true;
          } else if (newStatus === 'unsupported') {
            statusBadge.className = 'status-badge yellow';
            statusBadge.textContent = 'Unsupported';
            enableBtn.textContent = 'Notifications Unsupported';
            enableBtn.disabled = true;
          }
        });
      });
    }
  }

  return { render };
})();

window.UpdatesView = UpdatesView;
