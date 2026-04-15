// ─── DOM refs ─────────────────────────────────────────────────────────────────
const list            = document.querySelector(".list");
const newCompBtn      = document.querySelector(".cta--primary");
const modalNewComp    = document.querySelector(".new-compModal");
const overlay         = document.querySelector(".overlay");
const mainEl          = document.querySelector("main");
const nav1            = document.querySelector(".appbar");
const nav2            = document.querySelector(".subnav");
const myCompBtn       = document.querySelector(".myCompBtn");
const container       = document.querySelector(".container");
const pendingCompBtn  = document.querySelector(".pendingCompBtn");
const trackStatusBtn  = document.querySelector(".trackStatusBtn");
const resolvedCompBtn = document.querySelector(".resolvedCompBtn");
const quickActions    = document.querySelector(".quick-actions");
const recentTitle     = document.querySelector("#recent-activity");
const dashboardBtn    = document.querySelector(".dashboardBtn");

// ─── Render helpers ───────────────────────────────────────────────────────────
function makeItem(complaint) {
  return `
  <li class="list__item">
    <div class="list__head">
      <strong>ID: ${complaint._id}</strong>
      <span class="status status--${complaint.status}">${complaint.status}</span>
    </div>
    <div class="list__sub">${complaint.complaint}</div>
  </li>`;
}

function showAll() {
  list.innerHTML = "";
  obj.complaints.forEach(c => list.insertAdjacentHTML("beforeend", makeItem(c)));
}

function showRecent() {
  list.innerHTML = "";
  const recent = obj.complaints.length >= 4
    ? obj.complaints.slice(-4).reverse()
    : [...obj.complaints].reverse();
  recent.forEach(c => list.insertAdjacentHTML("beforeend", makeItem(c)));
}

// ─── Nav helpers ──────────────────────────────────────────────────────────────
const navItems = [dashboardBtn, myCompBtn, pendingCompBtn];
function setActive(btn) { navItems.forEach(b => b?.classList.remove("active")); btn?.classList.add("active"); }

function goFullWidth() {
  container.classList.remove("grid-two");
  container.classList.add("grid-one");
  quickActions.classList.add("hidden");
}
function goSplit() {
  container.classList.remove("grid-one");
  container.classList.add("grid-two");
  quickActions.classList.remove("hidden");
}

// ─── Initial render ───────────────────────────────────────────────────────────
showRecent();

// ─── Modal open/close ─────────────────────────────────────────────────────────
function openModal() {
  modalNewComp.classList.remove("hidden");
  overlay.classList.remove("hidden");
}
function closeModal() {
  modalNewComp.classList.add("hidden");
  overlay.classList.add("hidden");
}

newCompBtn.addEventListener("click", openModal);
overlay.addEventListener("click", closeModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ─── Nav events ───────────────────────────────────────────────────────────────
dashboardBtn.addEventListener("click", () => {
  setActive(dashboardBtn);
  goSplit();
  recentTitle.textContent = "Recent Activity";
  showRecent();
});

myCompBtn.addEventListener("click", () => {
  setActive(myCompBtn);
  goFullWidth();
  recentTitle.textContent = "All Complaints";
  showAll();
});

pendingCompBtn.addEventListener("click", () => {
  setActive(pendingCompBtn);
  goFullWidth();
  recentTitle.textContent = "Pending Complaints";
  list.innerHTML = "";
  obj.complaints
    .filter(c => c.status === "Pending")
    .forEach(c => list.insertAdjacentHTML("beforeend", makeItem(c)));
});

trackStatusBtn?.addEventListener("click", () => {
  goFullWidth();
  recentTitle.textContent = "In Progress";
  list.innerHTML = "";
  obj.complaints
    .filter(c => c.status === "Assign")
    .forEach(c => list.insertAdjacentHTML("beforeend", makeItem(c)));
});

resolvedCompBtn?.addEventListener("click", () => {
  goFullWidth();
  recentTitle.textContent = "Resolved Complaints";
  list.innerHTML = "";
  obj.complaints
    .filter(c => c.status === "Resolved")
    .forEach(c => list.insertAdjacentHTML("beforeend", makeItem(c)));
});