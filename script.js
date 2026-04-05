const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const revealItems = document.querySelectorAll(".reveal");
const pageName = document.body.dataset.page || "";
const courseGrid = document.querySelector("#course-grid");
const publishForm = document.querySelector("#publish-form");
const publishFeedback = document.querySelector("#publish-feedback");
const studioMode = document.querySelector("#studio-mode");
const publishSubmit = document.querySelector("#publish-submit");
const newCourseButton = document.querySelector("#new-course-button");
const resetCourseButton = document.querySelector("#reset-course-button");
const autosaveStatus = document.querySelector("#autosave-status");
const studioCourseList = document.querySelector("#studio-course-list");
const STORAGE_KEY = "rfree-academy-courses-v1";
const ACTIVE_COURSE_KEY = "rfree-academy-active-course-v1";
const AUTOSAVE_DELAY_MS = 900;

const previewElements = {
  badge: document.querySelector("#preview-badge"),
  status: document.querySelector("#preview-status"),
  title: document.querySelector("#preview-title"),
  summary: document.querySelector("#preview-summary"),
  progressCount: document.querySelector("#preview-progress-count"),
  progressNote: document.querySelector("#preview-progress-note"),
  progressBar: document.querySelector("#preview-progress-bar"),
  videoTitle: document.querySelector("#preview-video-title"),
  videoUrl: document.querySelector("#preview-video-url"),
  videoDuration: document.querySelector("#preview-video-duration"),
  videoLink: document.querySelector("#preview-video-link"),
  modules: document.querySelector("#preview-modules"),
  transcript: document.querySelector("#preview-transcript"),
};

let editingCourseId = null;
let autosaveTimer = null;

const starterCourses = [
  {
    id: "money-without-shame",
    title: "Money Without Shame",
    instructor: "RFree Founding Faculty",
    courseType: "Core Track",
    status: "Ready to teach",
    duration: "6 weeks",
    level: "Beginner",
    format: "Project-based",
    tags: ["Financial literacy", "Life skills", "Core"],
    summary:
      "A practical introduction to budgeting, debt, saving, banking, and financial confidence for people who were never taught how money works.",
    videoTitle: "Lesson 1: A kinder way to talk about money",
    videoDuration: "08:34",
    videoUrl: "",
    modules: [
      "Money stories and financial confidence",
      "Budgeting for real life",
      "Banking, fees, and safe money habits",
      "Debt repair and emergency savings",
    ],
    transcript:
      "[00:00] Welcome to Money Without Shame.\n[00:19] This lesson begins with the truth that people are not failures because they were never taught.\n[00:42] We will build a realistic budget and learn how to make choices without panic.\n[01:18] By the end of this course, learners will know how to protect their money and plan ahead.",
    completedModules: ["Money stories and financial confidence"],
  },
  {
    id: "digital-survival-skills",
    title: "Digital Survival Skills",
    instructor: "Community Tech Mentor",
    courseType: "Core Track",
    status: "Ready to teach",
    duration: "4 weeks",
    level: "All levels",
    format: "Hands-on",
    tags: ["Digital literacy", "Access", "Core"],
    summary:
      "Learn internet safety, online research, digital organization, email, forms, and the essential tools needed to navigate modern life and work.",
    videoTitle: "Lesson 2: Staying safe while learning online",
    videoDuration: "12:10",
    videoUrl: "",
    modules: [
      "Using email, forms, and documents",
      "Finding trustworthy sources online",
      "Privacy, passwords, and device safety",
      "Daily digital systems for school and work",
    ],
    transcript:
      "[00:00] Digital tools should make life easier, not more confusing.\n[00:17] Today we will walk through safe browsing, strong passwords, and how to spot risky links.\n[00:51] Then we will practice using everyday tools that matter for work, school, and healthcare access.",
    completedModules: [],
  },
  {
    id: "code-for-community-websites",
    title: "Code for Community Websites",
    instructor: "Volunteer Instructor",
    courseType: "Community Elective",
    status: "Open for contributors",
    duration: "5 weeks",
    level: "Beginner",
    format: "Build a site",
    tags: ["Coding", "Design", "Impact"],
    summary:
      "A beginner-friendly coding elective where learners build simple websites that support local causes, neighborhood groups, or personal projects.",
    videoTitle: "Lesson 1: Building your first community landing page",
    videoDuration: "10:22",
    videoUrl: "",
    modules: [
      "HTML and the structure of a webpage",
      "Styling with color, spacing, and typography",
      "Designing for community needs",
      "Publishing a first project online",
    ],
    transcript:
      "[00:00] Coding can become a tool for service.\n[00:22] In this lesson, we build a simple site that helps a real community message reach people clearly.\n[00:58] Learners will see how design and code support trust, usability, and action.",
    completedModules: [],
  },
  {
    id: "speak-so-people-listen",
    title: "Speak So People Listen",
    instructor: "Guest Teacher",
    courseType: "Workshop Series",
    status: "Needs instructor",
    duration: "3 sessions",
    level: "Mixed level",
    format: "Live practice",
    tags: ["Communication", "Leadership", "Confidence"],
    summary:
      "Public speaking, storytelling, and communication skills for interviews, advocacy, presentations, and community leadership.",
    videoTitle: "Workshop opener: Finding your voice with purpose",
    videoDuration: "07:48",
    videoUrl: "",
    modules: [
      "Speaking with structure and clarity",
      "Storytelling that moves people",
      "Practice sessions with feedback",
    ],
    transcript:
      "[00:00] Speaking clearly is not about performing perfection.\n[00:16] It is about helping people understand what matters and why they should care.\n[00:43] We begin by shaping a message that feels honest, useful, and memorable.",
    completedModules: [],
  },
];

let courses = readStoredCourses() || starterCourses.map((course) => normalizeCourse(course));

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

highlightActivePage();
setupRevealAnimations();
renderCourseGrid();
initializeStudio();

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function badgeClassForType(courseType) {
  if (courseType === "Community Elective") {
    return "course-badge course-badge-elective";
  }

  if (courseType === "Workshop Series") {
    return "course-badge course-badge-workshop";
  }

  if (courseType === "Mentorship Series") {
    return "course-badge course-badge-mentorship";
  }

  return "course-badge";
}

function splitList(value, separatorPattern) {
  return String(value || "")
    .split(separatorPattern)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCourse(course) {
  const rawStatus = String(course.status || "").trim();
  const normalizedStatus = rawStatus === "Draft preview" ? "Draft" : rawStatus;
  const modules =
    Array.isArray(course.modules) && course.modules.length
      ? course.modules.slice(0, 8)
      : ["Add the first module in the course studio."];
  const completedModules = Array.isArray(course.completedModules)
    ? Array.from(new Set(course.completedModules.filter((module) => modules.includes(module))))
    : [];

  return {
    id: course.id || `course-${Date.now()}`,
    title: String(course.title || "").trim() || "Untitled course",
    instructor: String(course.instructor || "").trim() || "RFree Contributor",
    courseType: String(course.courseType || "").trim() || "Core Track",
    status: normalizedStatus || "Draft",
    duration: String(course.duration || "").trim() || "4 weeks",
    level: String(course.level || "").trim() || "All levels",
    format: String(course.format || "").trim() || "Project-based",
    tags: Array.isArray(course.tags) && course.tags.length ? course.tags.slice(0, 5) : ["New course"],
    summary:
      String(course.summary || "").trim() ||
      "Add a course summary to explain what learners will understand, build, or practice.",
    videoTitle: String(course.videoTitle || "").trim() || "Featured lesson video",
    videoDuration: String(course.videoDuration || "").trim() || "00:00",
    videoUrl: normalizeUrl(course.videoUrl),
    modules,
    transcript:
      String(course.transcript || "").trim() ||
      "Transcript lines will appear here once the lesson narration is added.",
    completedModules,
  };
}

function getCompletedCount(course) {
  return course.completedModules.length;
}

function getCompletionPercent(course) {
  if (!course.modules.length) {
    return 0;
  }

  return Math.round((getCompletedCount(course) / course.modules.length) * 100);
}

function readStoredCourses() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return null;
    }

    return parsedValue.map((course) => normalizeCourse(course));
  } catch {
    return null;
  }
}

function readStoredActiveCourseId() {
  try {
    return window.localStorage.getItem(ACTIVE_COURSE_KEY) || "";
  } catch {
    return "";
  }
}

function saveCourses() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // Ignore storage issues so the editor still works in restricted environments.
  }
}

function saveActiveCourseId(courseId) {
  try {
    if (courseId) {
      window.localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
    } else {
      window.localStorage.removeItem(ACTIVE_COURSE_KEY);
    }
  } catch {
    // Ignore storage issues so the editor still works in restricted environments.
  }
}

function setAutosaveStatus(message, state = "saved") {
  if (!autosaveStatus) {
    return;
  }

  autosaveStatus.textContent = message;
  autosaveStatus.dataset.state = state;
}

function formatSaveTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function highlightActivePage() {
  if (!siteNav || !pageName) {
    return;
  }

  siteNav.querySelectorAll("[data-page-link]").forEach((link) => {
    const isActive = link.dataset.pageLink === pageName;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setupRevealAnimations() {
  if (!revealItems.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new window.IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function buildCourseCard(course) {
  const article = document.createElement("article");
  article.className = "course-card";
  article.dataset.courseId = course.id;

  if (course.id === editingCourseId) {
    article.classList.add("is-active");
  }

  const header = document.createElement("div");
  header.className = "course-header";

  const badge = document.createElement("span");
  badge.className = badgeClassForType(course.courseType);
  badge.textContent = course.courseType;

  const status = document.createElement("span");
  status.className = "course-status";
  status.textContent = course.status;

  header.append(badge, status);

  const heading = document.createElement("h3");
  heading.textContent = course.title;

  const description = document.createElement("p");
  description.textContent = course.summary;

  const meta = document.createElement("div");
  meta.className = "course-meta";

  [course.duration, course.level, course.format].forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    meta.append(chip);
  });

  const assets = document.createElement("div");
  assets.className = "course-assets";

  [
    course.videoTitle ? "Video lesson" : "Add video lesson",
    `${course.modules.length} modules`,
    course.transcript ? "Transcript ready" : "Transcript needed",
  ].forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    assets.append(chip);
  });

  const progress = document.createElement("div");
  progress.className = "course-progress";

  const progressLabel = document.createElement("p");
  progressLabel.className = "course-progress-label";
  progressLabel.textContent = `${getCompletedCount(course)} of ${course.modules.length} modules complete`;

  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";

  const progressFill = document.createElement("span");
  progressFill.style.width = `${getCompletionPercent(course)}%`;

  progressTrack.append(progressFill);
  progress.append(progressLabel, progressTrack);

  const tagList = document.createElement("div");
  tagList.className = "course-tags";

  course.tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    tagList.append(chip);
  });

  const footer = document.createElement("p");
  footer.className = "course-footer";
  footer.textContent = `By ${course.instructor}`;

  const actions = document.createElement("div");
  actions.className = "course-actions";

  const studioLink = document.createElement("a");
  studioLink.className = "button course-edit-button";
  studioLink.href = `studio.html?course=${encodeURIComponent(course.id)}`;
  studioLink.textContent = pageName === "studio" ? "Open this course" : "Edit in studio";

  actions.append(studioLink);
  article.append(header, heading, description, meta, assets, progress, tagList, footer, actions);

  return article;
}

function renderCourseGrid() {
  if (!courseGrid) {
    return;
  }

  courseGrid.innerHTML = "";
  courses.forEach((course) => {
    courseGrid.append(buildCourseCard(course));
  });
}

function renderStudioCourseList() {
  if (!studioCourseList) {
    return;
  }

  studioCourseList.innerHTML = "";

  courses.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "studio-course-button";
    button.dataset.courseId = course.id;

    if (course.id === editingCourseId) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "true");
    }

    const title = document.createElement("strong");
    title.textContent = course.title;

    const meta = document.createElement("span");
    meta.textContent = `${course.courseType} | ${getCompletedCount(course)}/${course.modules.length} modules`;

    button.append(title, meta);
    studioCourseList.append(button);
  });
}

function updateStudioState() {
  if (studioMode) {
    studioMode.textContent = editingCourseId
      ? `Editing "${findCourseById(editingCourseId)?.title || "course"}"`
      : "New course";
  }

  if (publishSubmit) {
    publishSubmit.textContent = editingCourseId ? "Save now" : "Create course";
  }
}

function setFormValues(course) {
  if (!publishForm) {
    return;
  }

  publishForm.elements.courseTitle.value = course.title;
  publishForm.elements.instructorName.value = course.instructor;
  publishForm.elements.courseType.value = course.courseType;
  publishForm.elements.courseStatus.value = course.status;
  publishForm.elements.courseDuration.value = course.duration;
  publishForm.elements.courseLevel.value = course.level;
  publishForm.elements.courseFormat.value = course.format;
  publishForm.elements.courseTags.value = course.tags.join(", ");
  publishForm.elements.courseSummary.value = course.summary;
  publishForm.elements.courseVideoTitle.value = course.videoTitle;
  publishForm.elements.courseVideoDuration.value = course.videoDuration;
  publishForm.elements.courseVideoUrl.value = course.videoUrl;
  publishForm.elements.courseModules.value = course.modules.join("\n");
  publishForm.elements.courseTranscript.value = course.transcript;
}

function readCourseFromForm() {
  if (!publishForm) {
    return null;
  }

  const formData = new FormData(publishForm);
  const modules = splitList(formData.get("courseModules"), /\n/).slice(0, 8);
  const existingCourse = findCourseById(editingCourseId);
  const completedModules = existingCourse
    ? existingCourse.completedModules.filter((module) => modules.includes(module))
    : [];

  return normalizeCourse({
    id: editingCourseId || undefined,
    title: formData.get("courseTitle"),
    instructor: formData.get("instructorName"),
    courseType: formData.get("courseType"),
    status: formData.get("courseStatus"),
    duration: formData.get("courseDuration"),
    level: formData.get("courseLevel"),
    format: formData.get("courseFormat"),
    tags: splitList(formData.get("courseTags"), /,/).slice(0, 5),
    summary: formData.get("courseSummary"),
    videoTitle: formData.get("courseVideoTitle"),
    videoDuration: formData.get("courseVideoDuration"),
    videoUrl: formData.get("courseVideoUrl"),
    modules,
    transcript: formData.get("courseTranscript"),
    completedModules,
  });
}

function updatePreview(course) {
  if (!previewElements.title) {
    return;
  }

  previewElements.badge.className = badgeClassForType(course.courseType);
  previewElements.badge.textContent = course.courseType;
  previewElements.status.textContent = course.status;
  previewElements.title.textContent = course.title;
  previewElements.summary.textContent = course.summary;
  previewElements.progressCount.textContent = `${getCompletedCount(course)} of ${course.modules.length} modules complete`;
  previewElements.progressNote.textContent =
    getCompletedCount(course) === course.modules.length && course.modules.length > 0
      ? "All modules completed."
      : "Click a module to mark it complete.";
  previewElements.progressBar.style.width = `${getCompletionPercent(course)}%`;
  previewElements.videoTitle.textContent = course.videoTitle;
  previewElements.videoUrl.textContent = course.videoUrl || "No video link added yet.";
  previewElements.videoDuration.textContent = course.videoDuration;
  previewElements.transcript.textContent = course.transcript;

  if (previewElements.videoLink) {
    if (course.videoUrl) {
      previewElements.videoLink.href = course.videoUrl;
      previewElements.videoLink.classList.remove("is-disabled");
      previewElements.videoLink.removeAttribute("aria-disabled");
      previewElements.videoLink.tabIndex = 0;
    } else {
      previewElements.videoLink.href = "#";
      previewElements.videoLink.classList.add("is-disabled");
      previewElements.videoLink.setAttribute("aria-disabled", "true");
      previewElements.videoLink.tabIndex = -1;
    }
  }

  if (!previewElements.modules) {
    return;
  }

  previewElements.modules.innerHTML = "";

  course.modules.forEach((module) => {
    const item = document.createElement("li");
    item.className = "module-item";
    item.dataset.moduleName = module;

    if (course.completedModules.includes(module)) {
      item.classList.add("is-complete");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "module-button";
    button.dataset.moduleAction = "toggle";
    button.dataset.moduleName = module;
    button.setAttribute("aria-pressed", String(course.completedModules.includes(module)));

    const check = document.createElement("span");
    check.className = "module-check";

    const label = document.createElement("span");
    label.className = "module-text";
    label.textContent = module;

    button.append(check, label);
    item.append(button);
    previewElements.modules.append(item);
  });
}

function findCourseById(courseId) {
  return courses.find((course) => course.id === courseId) || null;
}

function createCourseId(title) {
  const baseId = slugify(title) || `course-${Date.now()}`;

  if (!findCourseById(baseId)) {
    return baseId;
  }

  let counter = 2;
  let nextId = `${baseId}-${counter}`;

  while (findCourseById(nextId)) {
    counter += 1;
    nextId = `${baseId}-${counter}`;
  }

  return nextId;
}

function updateQueryCourseId(courseId) {
  if (pageName !== "studio") {
    return;
  }

  const url = new URL(window.location.href);

  if (courseId) {
    url.searchParams.set("course", courseId);
  } else {
    url.searchParams.delete("course");
  }

  window.history.replaceState({}, "", url);
}

function draftCourseTemplate() {
  return normalizeCourse({
    id: "",
    title: "Community Climate Action Basics",
    instructor: "RFree Course Builder",
    courseType: "Core Track",
    status: "Draft",
    duration: "4 weeks",
    level: "Beginner",
    format: "Video + action steps",
    tags: ["Climate", "Community", "Action"],
    summary:
      "A simple starter course that helps learners understand climate basics, local impact, and practical community action they can take right away.",
    videoTitle: "Lesson 1: Climate change in everyday language",
    videoDuration: "09:15",
    videoUrl: "",
    modules: [
      "What climate change means in real life",
      "How local communities feel the impact",
      "Small actions that build momentum",
      "Planning a neighborhood response project",
    ],
    transcript:
      "[00:00] Welcome to Community Climate Action Basics.\n[00:16] This lesson explains climate change in plain language and connects it to daily life, health, housing, and community planning.\n[00:42] By the end, learners will have a first action idea they can bring into their neighborhood.",
    completedModules: [],
  });
}

function selectCourse(courseId, options = {}) {
  const course = courseId ? findCourseById(courseId) : null;
  const targetCourse = course || draftCourseTemplate();

  flushAutosave({ silent: true });
  editingCourseId = course ? course.id : null;
  setFormValues(targetCourse);
  updatePreview(targetCourse);
  updateStudioState();
  renderCourseGrid();
  renderStudioCourseList();
  saveActiveCourseId(editingCourseId);
  updateQueryCourseId(editingCourseId);

  if (!options.keepStatusMessage) {
    if (editingCourseId) {
      setAutosaveStatus("Autosave is on. Changes save in this browser while you type.", "saved");
    } else {
      setAutosaveStatus("You are editing a new draft. It will save as soon as you type.", "saved");
    }
  }
}

function upsertCourse(course) {
  const index = courses.findIndex((item) => item.id === course.id);

  if (index >= 0) {
    courses[index] = course;
  } else {
    courses = [course, ...courses];
  }

  saveCourses();
}

function saveCourseFromForm(options = {}) {
  const builtCourse = readCourseFromForm();

  if (!builtCourse) {
    return null;
  }

  if (!editingCourseId) {
    builtCourse.id = createCourseId(builtCourse.title);
  }

  const normalizedCourse = normalizeCourse({
    ...builtCourse,
    id: builtCourse.id,
  });

  editingCourseId = normalizedCourse.id;
  upsertCourse(normalizedCourse);
  saveActiveCourseId(editingCourseId);
  updatePreview(normalizedCourse);
  updateStudioState();
  renderCourseGrid();
  renderStudioCourseList();
  updateQueryCourseId(editingCourseId);

  if (!options.silent) {
    const timestamp = formatSaveTime();
    setAutosaveStatus(`Saved at ${timestamp}.`, "saved");

    if (publishFeedback) {
      publishFeedback.textContent = "Course saved in this browser.";
    }
  }

  return normalizedCourse;
}

function queueAutosave() {
  if (!publishForm) {
    return;
  }

  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }

  setAutosaveStatus("Saving changes...", "saving");

  const draftCourse = readCourseFromForm();
  if (draftCourse) {
    updatePreview(draftCourse);
  }

  autosaveTimer = window.setTimeout(() => {
    autosaveTimer = null;
    saveCourseFromForm({ silent: false });
  }, AUTOSAVE_DELAY_MS);
}

function flushAutosave(options = {}) {
  if (!autosaveTimer) {
    return;
  }

  window.clearTimeout(autosaveTimer);
  autosaveTimer = null;
  saveCourseFromForm({ silent: Boolean(options.silent) });
}

function toggleModuleCompletion(moduleName) {
  if (!editingCourseId) {
    return;
  }

  const course = findCourseById(editingCourseId);

  if (!course) {
    return;
  }

  if (course.completedModules.includes(moduleName)) {
    course.completedModules = course.completedModules.filter((item) => item !== moduleName);
  } else if (course.modules.includes(moduleName)) {
    course.completedModules = [...course.completedModules, moduleName];
  }

  course.completedModules = course.modules.filter((item) => course.completedModules.includes(item));
  upsertCourse(normalizeCourse(course));
  const updatedCourse = findCourseById(editingCourseId);

  if (updatedCourse) {
    updatePreview(updatedCourse);
  }

  renderCourseGrid();
  renderStudioCourseList();
  setAutosaveStatus(`Progress saved at ${formatSaveTime()}.`, "saved");
}

function initializeStudio() {
  if (!publishForm) {
    return;
  }

  const queryCourseId = new URLSearchParams(window.location.search).get("course");
  const initialCourseId = findCourseById(queryCourseId)
    ? queryCourseId
    : findCourseById(readStoredActiveCourseId())
      ? readStoredActiveCourseId()
      : courses[0]?.id || "";

  selectCourse(initialCourseId, { keepStatusMessage: true });

  if (publishFeedback) {
    publishFeedback.textContent = "Open a course from the list or start a new draft.";
  }

  publishForm.addEventListener("submit", (event) => {
    event.preventDefault();
    flushAutosave({ silent: true });
    saveCourseFromForm({ silent: false });
  });

  publishForm.addEventListener("input", () => {
    queueAutosave();
  });

  if (newCourseButton) {
    newCourseButton.addEventListener("click", () => {
      selectCourse("", { keepStatusMessage: false });

      if (publishFeedback) {
        publishFeedback.textContent = "New course draft opened.";
      }
    });
  }

  if (resetCourseButton) {
    resetCourseButton.addEventListener("click", () => {
      if (autosaveTimer) {
        window.clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }

      const targetCourse = editingCourseId ? findCourseById(editingCourseId) : draftCourseTemplate();
      setFormValues(targetCourse || draftCourseTemplate());
      updatePreview(targetCourse || draftCourseTemplate());
      setAutosaveStatus("Fields reset to the current course.", "saved");

      if (publishFeedback) {
        publishFeedback.textContent = editingCourseId
          ? "Reset to the saved version of this course."
          : "Reset to the new draft template.";
      }
    });
  }

  if (studioCourseList) {
    studioCourseList.addEventListener("click", (event) => {
      const trigger = event.target.closest(".studio-course-button");

      if (!trigger) {
        return;
      }

      selectCourse(trigger.dataset.courseId);

      if (publishFeedback) {
        publishFeedback.textContent = "Course loaded into the studio.";
      }
    });
  }

  if (previewElements.modules) {
    previewElements.modules.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-module-action='toggle']");

      if (!trigger) {
        return;
      }

      toggleModuleCompletion(trigger.dataset.moduleName);
    });
  }

  window.addEventListener("beforeunload", () => {
    flushAutosave({ silent: true });
  });
}
