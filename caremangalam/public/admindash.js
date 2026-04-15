// ─── DOM refs ─────────────────────────────────────────────────────────────────
const complaintsRow = document.getElementById("complaintsRow");
const priorityTabs = document.getElementById("priorityTabs");
const sectionTitle = document.querySelector(".section-title");
const statsRow = document.querySelector(".stats-row");
const sidebar = document.querySelector(".sidebar");

const dashboardBtn = document.querySelector(".dashboardBtn");
const allComplaintsBtn = document.querySelector(".allComplaintsBtn");
const assignedComplaintsBtn = document.querySelector(".assignedComplaintsBtn");
const resolvedCompBtn = document.querySelector(".resolvedCompBtn");
const priorityTabBtn = document.querySelector(".priorityTabBtn");

const ptabs = document.querySelectorAll(".ptab");

// Current active priority sub-tab
let activePtab = "manual";

// ─── Build card HTML ──────────────────────────────────────────────────────────
function buildCard(c) {
  const id = c._id;
  const status = c.status || "Pending";
  const priority = c.priority || "Medium";
  const category = c.category || "";
  const authority = c.authority || "";
  const needsReview = !!c.needs_manual_review;
  const conf = Math.round((c.overall_confidence || 0) * 100);

  // Workflow action
  let route = "pending",
    label = "Assign";
  if (status === "Assign") {
    route = "assign";
    label = "Mark Solved";
  }
  if (status === "Resolved") {
    route = "Resolved";
    label = "Resolved";
  }

  // Confidence colour
  const confClass =
    conf >= 80 ? "conf-high" : conf >= 50 ? "conf-medium" : "conf-low";

  // AI badge
  const aiBadge = needsReview
    ? `<span class="ai-badge ai-badge--manual">⚠ Needs Review</span>`
    : `<span class="ai-badge ai-badge--auto">✦ Auto-Classified</span>`;

  // Category chip
  const catChip = category
    ? `<span class="category-chip">${category}</span>`
    : "";

  // Confidence bar
  const confBar = c.overall_confidence
    ? `
    <div class="confidence-wrap">
      <div class="confidence-label">
        <span>AI Confidence</span>
        <span>${conf}%</span>
      </div>
      <div class="confidence-bar">
        <div class="confidence-fill ${confClass}" style="width:${conf}%"></div>
      </div>
    </div>`
    : "";

  // Authority
  const authRow = authority
    ? `
    <p class="authority-text">
      <i class="fa-solid fa-user-tie"></i>${authority}
    </p>`
    : "";

  // Action button class
  const btnClass = status === "Resolved" ? "allotBtn resolved" : "allotBtn";
  const categoryEditor = needsReview
    ? `
<div class="priority-editor">
  <label>Category:</label>
  <select class="category-select" data-id="${id}">
    <option value="Hostel">Hostel</option>
    <option value="Infrastructure">Infrastructure</option>
    <option value="Academic">Academic</option>
    <option value="Administrative">Administrative</option>
    <option value="Financial">Financial</option>
    <option value="Harassment">Harassment</option>
    <option value="Health & Safety">Health & Safety</option>
    <option value="Placement">Placement</option>
  </select>

  <button class="save-category-btn" data-id="${id}">
    Save Category
  </button>
</div>
`
    : "";

  return `
  <div class="complaint-card ${needsReview ? "needs-review" : ""}" data-id="${id}"
       data-complaint="${escAttr(c.complaint)}"
       data-category="${escAttr(category)}"
       data-authority="${escAttr(authority)}">

    <h4>ID: ${id}</h4>
    <p class="comp-text">${c.complaint}</p>

    <div class="card-meta">
      <span class="priority-badge priority-${priority}" data-priority-badge>${priority}</span>
      <span class="ai-badge-wrap">${aiBadge}</span>
      ${catChip}
    </div>  

    ${authRow}
    ${confBar}
    ${categoryEditor}

    <!-- Priority Editor -->
    <div class="priority-editor">
      <label>Priority:</label>
      <select class="priority-select" data-id="${id}">
        <option value="High"   ${priority === "High" ? "selected" : ""}>High</option>
        <option value="Medium" ${priority === "Medium" ? "selected" : ""}>Medium</option>
        <option value="Low"    ${priority === "Low" ? "selected" : ""}>Low</option>
      </select>
      <button class="save-priority-btn" data-id="${id}">Save</button>
      <button class="reclassify-btn" data-id="${id}">↻ Re-classify</button>
      <span class="saved-msg" id="saved-${id}">✓ Saved</span>
    </div>

    <!-- Workflow -->
    <div class="card-footer">
      <form action="/status/${id}/${route}" style="margin:0;">
        <button class="${btnClass}" type="submit">${label}</button>
      </form>
      <span class="tag ${status}">${status}</span>
    </div>
  </div>`;
}

function escAttr(str) {
  return (str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ─── Render list of complaints ────────────────────────────────────────────────
function render(list, asList = false) {
  complaintsRow.innerHTML = "";
  if (asList) {
    complaintsRow.classList.add("complaints-row--list");
    complaintsRow.classList.remove("complaints-row");
    complaintsRow.classList.add("complaints-row");
  } else {
    complaintsRow.classList.remove("complaints-row--list");
  }

  if (!list.length) {
    complaintsRow.innerHTML = `<p style="color:var(--muted);padding:20px 0;grid-column:1/-1;">No complaints found.</p>`;
    return;
  }
  list.forEach((c) =>
    complaintsRow.insertAdjacentHTML("beforeend", buildCard(c)),
  );
}

// ─── Nav state ────────────────────────────────────────────────────────────────
const navBtns = [
  dashboardBtn,
  allComplaintsBtn,
  assignedComplaintsBtn,
  resolvedCompBtn,
  priorityTabBtn,
];
function setNav(btn) {
  navBtns.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

// ─── Dashboard (default) ─────────────────────────────────────────────────────
function showDashboard() {
  setNav(dashboardBtn);
  sidebar.classList.remove("hidden");
  statsRow.classList.remove("hidden");
  priorityTabs.classList.add("hidden");
  complaintsRow.classList.remove("complaints-row--list");
  sectionTitle.textContent = "Recent Complaints";
  render(allComplaint.slice(0, 3), false);
}

// ─── All complaints ───────────────────────────────────────────────────────────
allComplaintsBtn.addEventListener("click", () => {
  setNav(allComplaintsBtn);
  sidebar.classList.add("hidden");
  statsRow.classList.add("hidden");
  priorityTabs.classList.add("hidden");
  sectionTitle.textContent = "All Complaints";
  render(allComplaint, true);
});

// ─── Assigned ────────────────────────────────────────────────────────────────
assignedComplaintsBtn.addEventListener("click", () => {
  setNav(assignedComplaintsBtn);
  sidebar.classList.add("hidden");
  statsRow.classList.add("hidden");
  priorityTabs.classList.add("hidden");
  sectionTitle.textContent = "Assigned Complaints";
  render(
    allComplaint.filter((c) => c.status === "Assign"),
    true,
  );
});

// ─── Resolved ────────────────────────────────────────────────────────────────
resolvedCompBtn.addEventListener("click", () => {
  setNav(resolvedCompBtn);
  sidebar.classList.add("hidden");
  statsRow.classList.add("hidden");
  priorityTabs.classList.add("hidden");
  sectionTitle.textContent = "Resolved Complaints";
  render(
    allComplaint.filter((c) => c.status === "Resolved"),
    true,
  );
});

// ─── Priority tab (two sub-tabs) ──────────────────────────────────────────────
priorityTabBtn.addEventListener("click", () => {
  setNav(priorityTabBtn);
  sidebar.classList.add("hidden");
  statsRow.classList.add("hidden");
  priorityTabs.classList.remove("hidden");
  sectionTitle.textContent = "Priority Management";
  renderPriorityTab(activePtab);
});

function renderPriorityTab(tab) {
  activePtab = tab;
  ptabs.forEach((b) => {
    b.classList.toggle("ptab--active", b.dataset.tab === tab);
  });
  if (tab === "manual") {
    render(
      allComplaint.filter((c) => c.needs_manual_review),
      true,
    );
  } else {
    render(
      allComplaint.filter((c) => !c.needs_manual_review),
      true,
    );
  }
}

ptabs.forEach((btn) => {
  btn.addEventListener("click", () => renderPriorityTab(btn.dataset.tab));
});

dashboardBtn.addEventListener("click", showDashboard);

// ─── Priority save (event delegation) ────────────────────────────────────────
complaintsRow.addEventListener("click", async (e) => {
  // Save priority button
  if (e.target.classList.contains("save-priority-btn")) {
    const id = e.target.dataset.id;
    const sel = complaintsRow.querySelector(
      `.priority-select[data-id="${id}"]`,
    );
    if (!sel) return;

    e.target.disabled = true;
    try {
      const res = await fetch(`/priority/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: sel.value }),
      });
      const data = await res.json();
      if (data.success) {
        // Update in local data
        const comp = allComplaint.find((c) => c._id === id);
        if (comp) {
          comp.priority = sel.value;
          comp.needs_manual_review = false;
        }
        updateCardAfterSave(id, sel.value, false);
        flashSaved(id);
      }
    } catch (err) {
      console.error(err);
    }
    e.target.disabled = false;
  }

  if (e.target.classList.contains("save-category-btn")) {
    const id = e.target.dataset.id;

    const sel = complaintsRow.querySelector(
      `.category-select[data-id="${id}"]`,
    );

    const category = sel.value;

    await fetch(`/category/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    });

    location.reload();
  }

  // Re-classify button
  if (e.target.classList.contains("reclassify-btn")) {
    const id = e.target.dataset.id;
    const card = complaintsRow.querySelector(
      `.complaint-card[data-id="${id}"]`,
    );
    if (!card) return;

    e.target.textContent = "↻ Classifying…";
    e.target.disabled = true;

    // We need to send the complaint text along with a POST
    // We'll call a dedicated /reclassify/:id endpoint
    // The card stores the complaint text in data-complaint
    const complaintText = card.dataset.complaint || "";

    try {
      const res = await fetch(`/reclassify/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintText }),
      });
      const ai = await res.json();
      if (ai.success) {
        // Update local data
        const comp = allComplaint.find((c) => c._id === id);
        if (comp) {
          comp.category = ai.category;
          comp.priority = ai.priority;
          comp.authority = ai.authority;
          comp.needs_manual_review = ai.needs_manual_review;
          comp.overall_confidence = ai.overall_confidence;
          comp.category_confidence = ai.category_confidence;
          comp.priority_confidence = ai.priority_confidence;
        }
        // Re-render just this card
        card.outerHTML; // just reference; we'll replace it
        const newHtml = buildCard(allComplaint.find((c) => c._id === id));
        card.insertAdjacentHTML("afterend", newHtml);
        card.remove();
        flashSaved(id);
      } else {
        alert("AI service unavailable. Try again later.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting AI service.");
    }
    // Re-attach button state if card wasn't replaced
    const newBtn = complaintsRow.querySelector(
      `.reclassify-btn[data-id="${id}"]`,
    );
    if (newBtn) {
      newBtn.textContent = "↻ Re-classify";
      newBtn.disabled = false;
    }
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function updateCardAfterSave(id, priority, needsReview, manual=false) {
  const card = complaintsRow.querySelector(`.complaint-card[data-id="${id}"]`);
  if (!card) return;

  // Priority badge
  const badge = card.querySelector("[data-priority-badge]");
  if (badge) {
    badge.className = `priority-badge priority-${priority}`;
    badge.textContent = priority;
  }

  const aiBadgeWrap = card.querySelector(".ai-badge-wrap");

  // manual classification
  if (manual) {
    aiBadgeWrap.innerHTML =
      `<span class="ai-badge ai-badge--manual">👤 Manually Classified</span>`;
    card.classList.remove("needs-review");
    return;
  }

  // auto classification
  if (!needsReview) {
    aiBadgeWrap.innerHTML =
      `<span class="ai-badge ai-badge--auto">✦ Auto-Classified</span>`;
    card.classList.remove("needs-review");
  }
}

function flashSaved(id) {
  const msg = document.getElementById(`saved-${id}`);
  if (!msg) return;
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2200);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
showDashboard();
