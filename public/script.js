const fallbackProjects = window.VB_DEFAULT_PROJECTS || [];
const PROJECT_STORAGE_KEY = window.VB_PROJECTS_STORAGE_KEY || "vinicius-banhara-projects";
const disableLocalProjects = Boolean(window.VB_DISABLE_LOCAL_PROJECTS);
const SLIDESHOW_INTERVAL = 4600;

const translations = {
  en: {
    menu: "Menu",
    close: "Close",
    navWork: "Work",
    navAbout: "About",
    navContact: "Contact",
    heroRole: "Photographer",
    heroText: "Exploring displacement, distance and belonging through a poetic approach to documentary photography.",
    workKicker: "Work",
    aboutKicker: "About",
    contactKicker: "Contact",
    contactNote: "For commissions, print enquiries and collaborations.",
    contactMeta: "Dublin, Ireland / Available for selected projects",
    about: [
      "Vinicius Banhara is a Brazilian photographer based in Dublin, Ireland. His work moves between street and documentary photography, as well as a more poetic and contemplative approach, exploring people, place, identity and the different ways we experience a sense of belonging.",
      "His practice is rooted in observation. Walking, waiting and allowing encounters to shape the work are central to his process. He is drawn to quiet, ambiguous and often fleeting moments, seeking not only to document what he encounters, but also to reveal the atmosphere, emotions and relationships that exist between people and the spaces they inhabit.",
      "Banhara studied Social Sciences and Marketing, and his interest in society and human behaviour continues to influence his photographic approach. He is currently developing his practice through independent projects and mentorships with Brazilian painter and printmaker Sergio Fingermann and photographer Osvaldo Santos Lima.",
      "His ongoing project Limiares explores displacement, identity and the space between belonging and being a foreigner, reflecting on the experience of living between places and cultures."
    ]
  },
  pt: {
    menu: "Menu",
    close: "Fechar",
    navWork: "Projetos",
    navAbout: "Sobre",
    navContact: "Contato",
    heroRole: "Fotógrafo",
    heroText: "Explorando deslocamento, distância e pertencimento por meio de uma abordagem poética da fotografia documental.",
    workKicker: "Projetos",
    aboutKicker: "Sobre",
    contactKicker: "Contato",
    contactNote: "Para encomendas, prints e colaborações.",
    contactMeta: "Dublin, Irlanda / Disponível para projetos selecionados",
    about: [
      "Vinicius Banhara é um fotógrafo brasileiro baseado em Dublin, Irlanda. Seu trabalho transita entre a fotografia de rua e documental, assim como por uma abordagem mais poética e contemplativa, explorando pessoas, lugares, identidade e as diferentes formas como vivenciamos o senso de pertencimento.",
      "Sua prática nasce da observação. Caminhar, esperar e permitir que os encontros moldem o trabalho são partes centrais de seu processo. Ele se interessa por momentos silenciosos, ambíguos e muitas vezes fugazes, buscando não apenas documentar o que encontra, mas também revelar a atmosfera, as emoções e as relações que existem entre as pessoas e os espaços que habitam.",
      "Banhara estudou Ciências Sociais e Marketing, e seu interesse pela sociedade e pelo comportamento humano continua influenciando sua abordagem fotográfica. Atualmente desenvolve sua prática por meio de projetos independentes e mentorias com o pintor e gravador brasileiro Sergio Fingermann e o fotógrafo Osvaldo Santos Lima.",
      "Seu projeto em andamento Limiares explora deslocamento, identidade e o espaço entre pertencer e ser estrangeiro, refletindo sobre a experiência de viver entre lugares e culturas."
    ]
  }
};

let currentLanguage = "en";
let activeHeroIndex = 0;
let activeProjectImageIndex = 0;

const projectList = document.querySelector("#projectList");
const projectView = document.querySelector("#projectView");
const projectTitle = document.querySelector("#projectTitle");
const projectText = document.querySelector("#projectText");
const projectCounter = document.querySelector("#projectCounter");
const projectPreface = document.querySelector("#projectPreface");
const projectImages = document.querySelector("#projectImages");
const projectImageCounter = document.querySelector("#projectImageCounter");
const carouselButtons = document.querySelectorAll("[data-carousel]");
const closeProject = document.querySelector(".close-project");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const menuLabel = document.querySelector(".menu-label");
const menuLinks = document.querySelectorAll(".site-nav a");
const languageButtons = document.querySelectorAll("[data-language]");
const heroFrames = Array.from(document.querySelectorAll(".hero-frame"));

const navItems = {
  work: document.querySelector('.site-nav a[href="#work"]'),
  about: document.querySelector('.site-nav a[href="#about"]'),
  contact: document.querySelector('.site-nav a[href="#contact"]')
};

const staticCopy = {
  heroRole: document.querySelector(".hero-caption p:first-of-type"),
  heroText: document.querySelector(".hero-caption p:last-of-type"),
  workKicker: document.querySelector("#work .section-kicker"),
  aboutKicker: document.querySelector("#about .section-kicker"),
  contactKicker: document.querySelector("#contact .section-kicker"),
  contactNote: document.querySelector(".contact-note"),
  contactMeta: document.querySelector(".contact-meta"),
  aboutCopy: document.querySelector(".about-copy")
};

function normalizeProject(project) {
  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
  const details = Array.isArray(project.details)
    ? project.details.filter(Boolean).map((paragraph) => String(paragraph).trim())
    : String(project.details || "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return {
    title: String(project.title || "Untitled project").trim(),
    year: String(project.year || "").trim(),
    text: String(project.text || "").trim(),
    details,
    copy: project.copy || {},
    thumb: String(project.thumb || images[0] || "").trim(),
    images,
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
  if (disableLocalProjects) {
    return fallbackProjects.map(normalizeProject);
  }

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

function getProjectCopy(project) {
  const localized = project.copy?.[currentLanguage] || {};
  return {
    text: localized.text || project.text,
    details: Array.isArray(localized.details) ? localized.details : project.details
  };
}

function buildProjects() {
  projectList.innerHTML = projects.map((project, index) => {
    const copy = getProjectCopy(project);
    return `
      <button class="project-card${project.noFilter ? " is-unfiltered" : ""}" type="button" data-project="${index}">
        <figure class="project-thumb">
          <img src="${project.thumb}" alt="${project.title} project thumbnail.">
        </figure>
        <div>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(copy.text)}</p>
        </div>
      </button>
    `;
  }).join("");
}

function openProject(index) {
  const project = projects[index];
  const copy = getProjectCopy(project);
  projectTitle.textContent = project.title;
  projectText.innerHTML = copy.details.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  projectCounter.textContent = "";
  projectPreface.innerHTML = "";
  activeProjectImageIndex = 0;
  projectImages.innerHTML = project.images.map((src, imageIndex) => `
    <figure class="${imageIndex === 0 ? "is-active" : ""}">
      <img src="${src}" alt="${project.title} photograph ${imageIndex + 1}.">
      ${project.hideCaptions ? "" : `<figcaption>${project.title} / Image ${String(imageIndex + 1).padStart(2, "0")}</figcaption>`}
    </figure>
  `).join("");
  updateProjectCarousel();
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

function updateProjectCarousel() {
  const slides = Array.from(projectImages.querySelectorAll("figure"));
  if (!slides.length) {
    projectImageCounter.textContent = "";
    projectImages.style.removeProperty("height");
    return;
  }

  activeProjectImageIndex = (activeProjectImageIndex + slides.length) % slides.length;
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeProjectImageIndex);
  });
  projectImageCounter.textContent = `${String(activeProjectImageIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  fitProjectCarouselImage(slides[activeProjectImageIndex].querySelector("img"));
}

function moveProjectCarousel(direction) {
  if (!projectView.classList.contains("is-open")) return;
  activeProjectImageIndex += direction;
  updateProjectCarousel();
}

function fitProjectCarouselImage(image) {
  if (!image) return;

  const applySize = () => {
    const isMobile = window.matchMedia("(max-width: 820px)").matches;
    const viewportCap = window.innerHeight * (isMobile ? 0.72 : 0.78);
    const minHeight = isMobile ? 230 : 520;
    const stageWidth = projectImages.clientWidth || window.innerWidth;
    const imageRatio = image.naturalWidth ? image.naturalHeight / image.naturalWidth : 0.66;
    const fittedHeight = Math.min(stageWidth * imageRatio, viewportCap);
    projectImages.style.height = `${Math.max(fittedHeight, minHeight)}px`;
  };

  if (image.complete && image.naturalWidth) {
    applySize();
    return;
  }

  image.addEventListener("load", applySize, { once: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHeroFrame(index) {
  if (!heroFrames.length) return;
  activeHeroIndex = index % heroFrames.length;
  heroFrames.forEach((frame, frameIndex) => {
    frame.classList.toggle("is-active", frameIndex === activeHeroIndex);
  });
}

function startHeroSlideshow() {
  if (heroFrames.length < 2) return;
  setInterval(() => {
    setHeroFrame(activeHeroIndex + 1);
  }, SLIDESHOW_INTERVAL);
}

function updateHeaderState() {
  siteHeader.classList.toggle("is-solid", window.scrollY > 32);
}

function setMenuState(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  siteHeader.classList.toggle("is-menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    siteHeader.style.background = "#050505";
    siteHeader.style.color = "#f5f2ec";
    siteHeader.style.height = "72px";
    siteHeader.style.paddingTop = "18px";
    siteHeader.style.paddingBottom = "18px";
    siteHeader.style.boxShadow = "none";
    siteHeader.style.backdropFilter = "none";
    return;
  }

  siteHeader.style.removeProperty("background");
  siteHeader.style.removeProperty("color");
  siteHeader.style.removeProperty("height");
  siteHeader.style.removeProperty("padding-top");
  siteHeader.style.removeProperty("padding-bottom");
  siteHeader.style.removeProperty("box-shadow");
  siteHeader.style.removeProperty("backdrop-filter");
  updateHeaderState();
}

function setLanguage(language) {
  currentLanguage = translations[language] ? language : "en";
  const copy = translations[currentLanguage];
  document.body.dataset.language = currentLanguage;
  document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : "en";

  menuLabel.textContent = copy.menu;
  closeProject.textContent = copy.close;
  navItems.work.textContent = copy.navWork;
  navItems.about.textContent = copy.navAbout;
  navItems.contact.textContent = copy.navContact;
  staticCopy.heroRole.textContent = copy.heroRole;
  staticCopy.heroText.textContent = copy.heroText;
  staticCopy.workKicker.textContent = copy.workKicker;
  staticCopy.aboutKicker.textContent = copy.aboutKicker;
  staticCopy.contactKicker.textContent = copy.contactKicker;
  staticCopy.contactNote.textContent = copy.contactNote;
  staticCopy.contactMeta.textContent = copy.contactMeta;
  staticCopy.aboutCopy.querySelectorAll("p").forEach((paragraph, index) => {
    paragraph.textContent = copy.about[index] || paragraph.textContent;
  });

  languageButtons.forEach((button) => {
    const isCurrent = button.dataset.language === currentLanguage;
    button.classList.toggle("is-active", isCurrent);
    button.setAttribute("aria-pressed", String(isCurrent));
  });

  buildProjects();
}

setLanguage("en");
setHeroFrame(0);
startHeroSlideshow();
updateHeaderState();

projectList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project]");
  if (!card) return;
  openProject(Number(card.dataset.project));
});

closeProject.addEventListener("click", closeProjectView);

carouselButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moveProjectCarousel(button.dataset.carousel === "next" ? 1 : -1);
  });
});

menuToggle.addEventListener("click", (event) => {
  event.preventDefault();
  setMenuState(!document.body.classList.contains("menu-open"));
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProjectView();
    setMenuState(false);
  }

  if (event.key === "ArrowRight") {
    moveProjectCarousel(1);
  }

  if (event.key === "ArrowLeft") {
    moveProjectCarousel(-1);
  }
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  });
});

window.addEventListener("scroll", updateHeaderState, { passive: true });
