const fallbackProjects = window.VB_DEFAULT_PROJECTS || [
  {
    title: "Still Light",
    year: "2025",
    text: "Quiet urban photographs built around night, windows and the small distance between people and the city.",
    thumb: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2200&q=85",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=85"
    ]
  },
  {
    title: "After Rain",
    year: "2024",
    text: "A sequence about wet streets, soft reflection and the suspended feeling that appears after weather changes.",
    thumb: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=2200&q=85",
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1800&q=85"
    ]
  },
  {
    title: "Urban Room",
    year: "2024",
    text: "Fragments of interiors, crossings and public space, treated as a visual diary of light moving through surfaces.",
    thumb: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85",
      "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=85"
    ]
  }
];
const PROJECT_STORAGE_KEY = window.VB_PROJECTS_STORAGE_KEY || "vinicius-banhara-projects";

function normalizeProject(project) {
  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
  const preface = Array.isArray(project.preface)
    ? project.preface.filter(Boolean).map((paragraph) => String(paragraph).trim())
    : String(project.preface || "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return {
    title: String(project.title || "Untitled project").trim(),
    year: String(project.year || "").trim(),
    text: String(project.text || "").trim(),
    thumb: String(project.thumb || images[0] || "").trim(),
    images,
    preface,
    hideCaptions: Boolean(project.hideCaptions),
    noFilter: Boolean(project.noFilter)
  };
}

function projectKey(project) {
  return normalizeProject(project).title.toLowerCase();
}

function mergeDefaultProjects(savedProjects) {
  const saved = Array.isArray(savedProjects) ? savedProjects.map(normalizeProject) : [];
  const defaults = fallbackProjects.map(normalizeProject);
  const defaultKeys = new Set(defaults.map(projectKey));
  return [
    ...defaults,
    ...saved.filter((project) => !defaultKeys.has(projectKey(project)))
  ];
}

function loadProjects() {
  let saved = null;

  try {
    saved = JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || "null");
  } catch (error) {
    try {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    } catch (storageError) {
      saved = null;
    }
  }

  if (Array.isArray(saved) && saved.length) {
    return mergeDefaultProjects(saved);
  }

  return fallbackProjects.map(normalizeProject);
}

const projects = loadProjects();

const projectList = document.querySelector("#projectList");
const projectView = document.querySelector("#projectView");
const projectTitle = document.querySelector("#projectTitle");
const projectText = document.querySelector("#projectText");
const projectCounter = document.querySelector("#projectCounter");
const projectPreface = document.querySelector("#projectPreface");
const projectImages = document.querySelector("#projectImages");
const closeProject = document.querySelector(".close-project");
const cursor = document.querySelector(".cursor");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const menuLinks = document.querySelectorAll(".site-nav a");

function buildProjects() {
  projectList.innerHTML = projects.map((project, index) => `
    <button class="project-card${project.noFilter ? " is-unfiltered" : ""}" type="button" data-project="${index}">
      <span>${String(index + 1).padStart(2, "0")} / ${project.year}</span>
      <img src="${project.thumb}" alt="${project.title} project thumbnail.">
      <div>
        <h3>${project.title}</h3>
      </div>
      <span class="arrow" aria-hidden="true">-></span>
      <p>${project.text}</p>
    </button>
  `).join("");
}

function openProject(index) {
  const project = projects[index];
  projectTitle.textContent = project.title;
  projectText.textContent = project.text;
  projectCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${projects.length}`;
  projectPreface.innerHTML = project.preface.length
    ? `
      <div class="project-preface-inner">
        ${project.preface.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </div>
    `
    : "";
  projectImages.innerHTML = project.images.map((src, imageIndex) => `
    <figure>
      <img src="${src}" alt="${project.title} photograph ${imageIndex + 1}.">
      ${project.hideCaptions ? "" : `<figcaption>${project.title} / Image ${String(imageIndex + 1).padStart(2, "0")}</figcaption>`}
    </figure>
  `).join("");
  projectView.classList.toggle("is-unfiltered", project.noFilter);
  projectView.classList.add("is-open");
  projectView.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProjectView() {
  projectView.classList.remove("is-open");
  projectView.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateHeroState() {
  const frames = document.querySelectorAll(".hero-frame");
  const center = window.innerHeight * 0.5;

  frames.forEach((frame) => {
    const rect = frame.getBoundingClientRect();
    const active = rect.top <= center && rect.bottom >= center;
    frame.classList.toggle("is-active", active);
  });
}

function updateHeaderState() {
  siteHeader.classList.toggle("is-solid", window.scrollY > 32);
}

function setMenuState(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function updateCursor(event) {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
}

buildProjects();
updateHeroState();
updateHeaderState();

projectList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project]");
  if (!card) return;
  openProject(Number(card.dataset.project));
});

closeProject.addEventListener("click", closeProjectView);

menuToggle.addEventListener("click", (event) => {
  event.preventDefault();
  setMenuState(!document.body.classList.contains("menu-open"));
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeProjectView();
  setMenuState(false);
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  });
});

window.addEventListener("scroll", () => {
  updateHeroState();
  updateHeaderState();
}, { passive: true });

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("mousemove", updateCursor);
  document.addEventListener("mouseover", (event) => {
    cursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button")));
  });
}
