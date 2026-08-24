const STORAGE_KEY = window.VB_PROJECTS_STORAGE_KEY || "vinicius-banhara-projects";
const DEFAULT_PROJECTS = window.VB_DEFAULT_PROJECTS || [];

let projects = loadProjects();
let editingIndex = -1;

const form = document.querySelector("#projectForm");
const formMode = document.querySelector("#formMode");
const cancelEdit = document.querySelector("#cancelEdit");
const statusMessage = document.querySelector("#statusMessage");
const adminProjectList = document.querySelector("#adminProjectList");
const importData = document.querySelector("#importData");
const exportData = document.querySelector("#exportData");
const resetData = document.querySelector("#resetData");

const fields = {
  title: document.querySelector("#projectTitleInput"),
  year: document.querySelector("#projectYearInput"),
  text: document.querySelector("#projectTextInput"),
  thumbUrl: document.querySelector("#thumbUrlInput"),
  thumbFile: document.querySelector("#thumbFileInput"),
  imageUrls: document.querySelector("#imageUrlsInput"),
  imageFiles: document.querySelector("#imageFilesInput"),
  replaceImages: document.querySelector("#replaceImagesInput")
};

function normalizeProject(project) {
  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
  const fallback = DEFAULT_PROJECTS[0]?.thumb || "";

  return {
    title: String(project.title || "Untitled project").trim(),
    year: String(project.year || "").trim(),
    text: String(project.text || "").trim(),
    thumb: String(project.thumb || images[0] || fallback).trim(),
    images
  };
}

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      return saved.map(normalizeProject);
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }

  return DEFAULT_PROJECTS.map(normalizeProject);
}

function saveProjects(nextProjects = projects) {
  projects = nextProjects.map(normalizeProject);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    setStatus("Projetos salvos. Recarregue o site para ver as mudanças.");
    renderProjects();
    return true;
  } catch (error) {
    setStatus("Não foi possível salvar. Reduza o tamanho das imagens ou use URLs externas.");
    return false;
  }
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getUrlLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(fileList) {
  return Promise.all(Array.from(fileList).map(readFileAsDataUrl));
}

function resetForm() {
  editingIndex = -1;
  form.reset();
  formMode.textContent = "Novo projeto";
  cancelEdit.hidden = true;
  fields.replaceImages.checked = false;
}

function editProject(index) {
  const project = projects[index];
  editingIndex = index;
  fields.title.value = project.title;
  fields.year.value = project.year;
  fields.text.value = project.text;
  fields.thumbUrl.value = project.thumb.startsWith("data:") ? "" : project.thumb;
  fields.imageUrls.value = "";
  fields.replaceImages.checked = false;
  formMode.textContent = `Editando ${project.title}`;
  cancelEdit.hidden = false;
  setStatus("Ao editar, novas imagens sao adicionadas. Marque substituir para trocar a galeria.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function moveProject(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= projects.length) return;

  const next = [...projects];
  [next[index], next[target]] = [next[target], next[index]];
  saveProjects(next);
}

function deleteProject(index) {
  const project = projects[index];
  const confirmed = window.confirm(`Remover o projeto "${project.title}"?`);
  if (!confirmed) return;

  saveProjects(projects.filter((_, projectIndex) => projectIndex !== index));
  if (editingIndex === index) resetForm();
}

function renderProjects() {
  if (!projects.length) {
    adminProjectList.innerHTML = "<p class=\"status\">Nenhum projeto cadastrado.</p>";
    return;
  }

  adminProjectList.innerHTML = projects.map((project, index) => `
    <article class="admin-project">
      <img src="${project.thumb}" alt="">
      <div class="project-body">
        <p class="project-meta">${String(index + 1).padStart(2, "0")} / ${escapeHtml(project.year || "Sem ano")} / ${project.images.length} imagens</p>
        <h3 class="project-title">${escapeHtml(project.title)}</h3>
        <p class="project-text">${escapeHtml(project.text)}</p>
        <div class="project-actions">
          <button type="button" data-action="edit" data-index="${index}">Editar</button>
          <button type="button" data-action="up" data-index="${index}">Subir</button>
          <button type="button" data-action="down" data-index="${index}">Descer</button>
          <button type="button" data-action="delete" data-index="${index}">Remover</button>
        </div>
      </div>
    </article>
  `).join("");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Salvando...");

  const currentProject = projects[editingIndex];
  const thumbFiles = await readFilesAsDataUrls(fields.thumbFile.files);
  const uploadedImages = await readFilesAsDataUrls(fields.imageFiles.files);
  const urlImages = getUrlLines(fields.imageUrls.value);
  const incomingImages = [...urlImages, ...uploadedImages];
  const shouldKeepImages = currentProject && !fields.replaceImages.checked;
  const images = incomingImages.length
    ? shouldKeepImages ? [...currentProject.images, ...incomingImages] : incomingImages
    : currentProject?.images || [];

  const project = normalizeProject({
    title: fields.title.value,
    year: fields.year.value,
    text: fields.text.value,
    thumb: thumbFiles[0] || fields.thumbUrl.value || currentProject?.thumb || images[0],
    images
  });

  const next = [...projects];
  if (editingIndex >= 0) {
    next[editingIndex] = project;
  } else {
    next.push(project);
  }

  if (saveProjects(next)) resetForm();
});

cancelEdit.addEventListener("click", resetForm);

adminProjectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "edit") editProject(index);
  if (action === "up") moveProject(index, -1);
  if (action === "down") moveProject(index, 1);
  if (action === "delete") deleteProject(index);
});

exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vinicius-banhara-projects.json";
  link.click();
  URL.revokeObjectURL(url);
});

importData.addEventListener("change", async () => {
  const file = importData.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error("Invalid data");
    saveProjects(data);
    resetForm();
  } catch (error) {
    setStatus("Arquivo inválido. Importe um JSON exportado por este painel.");
  } finally {
    importData.value = "";
  }
});

resetData.addEventListener("click", () => {
  const confirmed = window.confirm("Restaurar os projetos demo e apagar alterações locais?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  projects = DEFAULT_PROJECTS.map(normalizeProject);
  resetForm();
  renderProjects();
  setStatus("Demo restaurada.");
});

renderProjects();
