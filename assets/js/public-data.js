/* =====================================================
   DIGITAL MARKETER PORTFOLIO PUBLIC DATA JS
   Database-only Version
   - No sample/static data paint
   - No initial-data/localStorage hydration
   - Public content loads only from Google Sheet/Admin API
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    clearPublicDatabaseOnlyCaches();

    if (!isPublicApiReady()) {
        preparePublicLoadingPlaceholders();
        revealPublicPage();
        return;
    }

    preparePublicLoadingPlaceholders();
    revealPublicPage();

    waitForPublicComponents(120).then(function () {
        reapplyPublicGlobalData();
    });

    loadPublicGlobalData()
        .then(function () {
            return initCurrentPublicPageData();
        })
        .then(function () {
            reapplyPublicGlobalData();
            revealPublicPage();
        })
        .catch(function (error) {
            console.error("Public website init failed:", error);
            revealPublicPage();
        });
});

const PublicState = {
    settings: null,
    profile: null
};


/* =====================================================
   INIT
===================================================== */

async function initPublicWebsiteData() {
    if (!isPublicApiReady()) return;

    await loadPublicGlobalData();
    await initCurrentPublicPageData();
}

async function initCurrentPublicPageData() {
    const page = getCurrentPublicPage();

    if (page === "index.html" || page === "") {
        await initHomePageData();
    }

    if (page === "about.html") {
        initAboutPageData();
    }

    if (page === "services.html") {
        await initServicesPageData();
    }

    if (page === "education.html") {
        await initEducationPageData();
    }

    if (page === "experience.html") {
        await initExperiencePageData();
    }

    if (page === "projects.html") {
        await initProjectsPageData();
    }

    if (page === "project-details.html") {
        await initProjectDetailsPageData();
    }

    if (page === "reviews.html") {
        await initReviewsPageData();
        bindPublicReviewForm();
    }

    if (page === "contact.html") {
        bindPublicContactForm();
    }
}

function isPublicApiReady() {
    if (typeof PortfolioAPI === "undefined") {
        console.warn("PortfolioAPI not found. Load config.js and api.js before public-data.js");
        return false;
    }

    return true;
}

function hydratePublicFromLocalCache() {
    return false;
}

function hydratePublicFromInitialData() {
    return false;
}

function applyPublicBundleData(data) {
    if (!data) return;

    if (Array.isArray(data.settings) && data.settings.length) {
        PublicState.settings = data.settings[0];
        applyPublicSettings(PublicState.settings);
    }

    if (Array.isArray(data.profile) && data.profile.length) {
        PublicState.profile = data.profile.find(function (item) {
            return item.status === "Published";
        }) || data.profile[0];

        applyPublicProfile(PublicState.profile);
    }

    updatePublicContactAndSocialLinks(PublicState.profile, PublicState.settings);
}

async function refreshPublicDataInBackground() {
    try {
        if (!PortfolioAPI || !PortfolioAPI.getPublicBundle) return;

        const result = await PortfolioAPI.getPublicBundle({
            allowCache: false,
            forceFresh: true
        });

        if (!result || !result.success || !result.data) return;

        applyPublicBundleData(result.data);
        await initCurrentPublicPageData();
        reapplyPublicGlobalData();
    } catch (error) {
        /* Keep the instant data if background refresh fails. */
    }
}

/* =====================================================
   GLOBAL DATA
===================================================== */

async function loadPublicGlobalData() {
    try {
        if (PortfolioAPI.getPublicBundle) {
            const bundle = await PortfolioAPI.getPublicBundle({
                allowCache: false,
                forceFresh: true
            });

            if (bundle && bundle.success && bundle.data) {
                applyPublicBundleData(bundle.data);
                return;
            }
        }

        const [settingsResult, profileResult] = await Promise.all([
            PortfolioAPI.getData("settings"),
            PortfolioAPI.getData("profile")
        ]);

        if (settingsResult.success && settingsResult.data.length) {
            PublicState.settings = settingsResult.data[0];
            applyPublicSettings(PublicState.settings);
        }

        if (profileResult.success && profileResult.data.length) {
            PublicState.profile = profileResult.data.find(function (item) {
                return item.status === "Published";
            }) || profileResult.data[0];

            applyPublicProfile(PublicState.profile);
        }

        updatePublicContactAndSocialLinks(PublicState.profile, PublicState.settings);
    } catch (error) {
        console.error("Public global data load failed:", error);
    }
}

function applyPublicSettings(settings) {
    if (!settings) return;

    setRootColor("--primary", settings.primaryColor);
    setRootColor("--secondary", settings.secondaryColor);
    setRootColor("--accent", settings.accentColor);

    if (settings.seoTitle) {
        document.title = settings.seoTitle;
    }

    updateAllText(".brand-icon", settings.logoText || "DM");
    updateAllText(".brand-text strong", settings.websiteTitle || "Digital Marketer");
    updateAllText(".brand-text small", "Portfolio");

    const footerText = document.querySelector(".footer-bottom p");

    if (footerText && settings.footerText) {
        footerText.textContent = settings.footerText;
    }

    updateSocialLinks(settings);

    const footerAbout = document.querySelector(".footer-about p");
    if (footerAbout && settings.tagline) {
        footerAbout.textContent = settings.tagline;
    }
}

function applyPublicProfile(profile) {
    if (!profile) return;

    const profileName = profile.name || "";
    const profileTitle = profile.title || "";
    const profileBio = profile.bio || "";
    const experienceYears = normalizeNumber(profile.experienceYears, "");
    const campaigns = normalizeNumber(profile.campaigns, "");
    const clients = normalizeNumber(profile.clients, "");

    const heroTitle = document.querySelector(".home-hero .hero-content h1");

    if (heroTitle) {
        heroTitle.innerHTML = `
            Grow Your Brand with
            <span>${escapePublicHTML(profileTitle || "Digital Marketing")}</span>
        `;
    }

    const heroText = document.querySelector(".home-hero .hero-content p");

    if (heroText) {
        heroText.textContent = profileBio || "Profile bio is not added yet.";
    }

    document.querySelectorAll(".profile-card .profile-image img, .about-profile-image img").forEach(function (image) {
        if (profile.imageUrl) {
            image.src = getPublicImageUrl(profile.imageUrl);
        }

        image.alt = profileName || profileTitle || "Profile image";
    });

    const homeProfileName = document.querySelector(".profile-info h3");

    if (homeProfileName) {
        homeProfileName.textContent = profileName || profileTitle || "Profile name not added";
    }

    const homeProfileDetails = document.querySelector(".profile-info p");

    if (homeProfileDetails) {
        const details = [];

        if (profileTitle) {
            details.push(profileTitle);
        }

        if (experienceYears) {
            details.push(experienceYears + "+ Years Experience");
        }

        if (clients) {
            details.push(clients + "+ Clients");
        }

        homeProfileDetails.textContent = details.length
            ? details.join(" • ")
            : "Profile details will appear after admin updates.";
    }

    const statItems = document.querySelectorAll(".hero-stats strong");

    if (statItems.length >= 3) {
        statItems[0].textContent = (campaigns || "0") + "+";
        statItems[1].textContent = (clients || "0") + "+";
        statItems[2].textContent = (experienceYears || "0") + "+";
    }

    const floatingCards = document.querySelectorAll(".floating-result-card strong");

    if (floatingCards.length >= 2) {
        floatingCards[0].textContent = campaigns ? campaigns + "+" : "";
        floatingCards[1].textContent = clients ? clients + "+" : "";
    }

    const aboutName = document.querySelector(".about-profile-info h2");

    if (aboutName) {
        aboutName.textContent = profileName || "Profile name not added";
    }

    const aboutTitle = document.querySelector(".about-profile-info > p");

    if (aboutTitle) {
        aboutTitle.textContent = profileTitle || "Professional title not added";
    }

    const aboutSocials = document.querySelector(".about-socials");

    if (aboutSocials) {
        const linksHtml = renderAboutSocialLinks(profile, PublicState.settings);
        aboutSocials.innerHTML = linksHtml || `<div class="public-empty-box"><p>No social links added yet.</p></div>`;
    }

    const cvButton = document.querySelector(".about-cv-btn");

    if (cvButton) {
        if (profile.cvUrl) {
            cvButton.href = profile.cvUrl;
            cvButton.textContent = "Download CV";
            cvButton.target = "_blank";
            cvButton.rel = "noopener";
            cvButton.style.display = "inline-flex";
        } else {
            cvButton.removeAttribute("href");
            cvButton.textContent = "CV not added yet";
            cvButton.style.display = "none";
        }
    }

    updateAboutMainContent(profile);
    loadProfileExpertiseTagsFromServices(profile);
    updateContactInfo(profile);
}

function updateAboutMainContent(profile) {
    const mainHeading = document.querySelector(".about-main-content h2");

    if (mainHeading) {
        mainHeading.textContent = profile.title
            ? "Helping Businesses Grow Through " + profile.title
            : "Professional identity will appear from admin database";
    }

    const aboutParagraphs = document.querySelectorAll(".about-main-content > p");

    if (aboutParagraphs[0]) {
        aboutParagraphs[0].textContent = profile.bio || "Profile bio is not added yet.";
    }

    if (aboutParagraphs[1]) {
        const summary = [];

        if (profile.experienceYears) {
            summary.push(normalizeNumber(profile.experienceYears, "0") + "+ years of experience");
        }

        if (profile.campaigns) {
            summary.push(normalizeNumber(profile.campaigns, "0") + "+ campaigns managed");
        }

        if (profile.clients) {
            summary.push(normalizeNumber(profile.clients, "0") + "+ clients served");
        }

        aboutParagraphs[1].textContent = summary.length
            ? summary.join(", ") + "."
            : "Professional summary will appear after admin updates the profile.";
    }
}

async function loadProfileExpertiseTagsFromServices(profile) {
    const tagsBox = document.querySelector(".profile-tags");

    if (!tagsBox) return;

    try {
        let services = [];

        if (typeof PortfolioAPI !== "undefined" && PortfolioAPI.getPublishedData) {
            const result = await PortfolioAPI.getPublishedData("services");
            services = result && result.success ? result.data || [] : [];
        }

        const tags = services
            .map(function (service) {
                return service.name || service.category || "";
            })
            .filter(Boolean)
            .slice(0, 6);

        if (!tags.length && profile && profile.title) {
            tags.push(profile.title);
        }

        if (!tags.length) {
            tagsBox.innerHTML = `<div class="public-empty-box"><p>No expertise/services added yet.</p></div>`;
            return;
        }

        tagsBox.innerHTML = tags.map(function (tag) {
            return `<span>${escapePublicHTML(tag)}</span>`;
        }).join("");
    } catch (error) {
        tagsBox.innerHTML = `<div class="public-empty-box"><p>No expertise/services added yet.</p></div>`;
    }
}

/* =====================================================
   HOME PAGE
===================================================== */

async function initHomePageData() {
    await Promise.all([
        renderHomeServices(),
        renderHomeProjects(),
        renderHomeReviews(),
        renderHomeSkills()
    ]);
}

async function renderHomeServices() {
    const grid = document.querySelector(".service-preview-grid");

    if (!grid) return;

    const result = await PortfolioAPI.getPublishedData("services");

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No service found.");
        return;
    }

    const services = result.data
        .sort(function (a, b) {
            return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        })
        .slice(0, 4);

    grid.innerHTML = services.map(function (service) {
        return `
            <div class="service-mini-card reveal active">
                <div class="service-icon">${renderPublicServiceIcon(service.icon, service.name, service.category)}</div>
                <h3>${escapePublicHTML(service.name)}</h3>
                <p>${escapePublicHTML(service.description)}</p>
            </div>
        `;
    }).join("");
}

async function renderHomeSkills() {
    const grid = document.getElementById("homeSkillsGrid");

    if (!grid) return;

    const result = await PortfolioAPI.getPublishedData("skills");

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No skill found.");
        return;
    }

    const skills = result.data
        .sort(function (a, b) {
            return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        })
        .slice(0, 8);

    grid.innerHTML = skills.map(function (skill) {
        const percentage = normalizePublicPercentage(skill.percentage);

        return `
            <div class="skill-card reveal active" style="--skill-width: ${percentage}%;">
                <div class="skill-top">
                    <h3>${escapePublicHTML(skill.name)}</h3>
                    <span>${percentage}%</span>
                </div>

                <div class="skill-bar" aria-label="${escapePublicHTML(skill.name)} skill level ${percentage}%">
                    <div style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
    }).join("");
}

async function renderHomeProjects() {
    const grid = document.querySelector(".project-preview-grid");

    if (!grid) return;

    let result = await PortfolioAPI.getFeaturedProjects();

    if (!result.success || !result.data.length) {
        result = await PortfolioAPI.getPublishedData("projects");
    }

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No project found.");
        return;
    }

    const projects = result.data.slice(0, 3);

    grid.innerHTML = projects.map(function (project) {
        return `
            <div class="project-preview-card reveal active">
                <div class="project-image">
                    <img src="${escapePublicHTML(getPublicImageUrl(project.image))}" alt="${escapePublicHTML(project.title)}">
                </div>

                <div class="project-content">
                    <span class="project-category">${escapePublicHTML(project.category)}</span>
                    <h3>${escapePublicHTML(project.title)}</h3>
                    <p>${escapePublicHTML(project.shortDescription)}</p>

                    <div class="project-result">
                        <strong>${escapePublicHTML(project.mainResult || "Result")}</strong>
                        <span>Campaign Result</span>
                    </div>

                    <a href="project-details.html?id=${encodeURIComponent(project.id)}" class="project-link">
                        <i class="fa-solid fa-arrow-right"></i><span>View Case Study</span>
                    </a>
                </div>
            </div>
        `;
    }).join("");
}

async function renderHomeReviews() {
    const grid = document.querySelector(".review-preview-grid");

    if (!grid) return;

    const result = await PortfolioAPI.getApprovedReviews();

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No review found.");
        return;
    }

    const reviews = result.data.slice(0, 3);

    grid.innerHTML = reviews.map(function (review) {
        return `
            <div class="review-mini-card reveal active">
                <div class="rating">${renderPublicStars(review.rating)}</div>

                <p>“${escapePublicHTML(review.message)}”</p>

                <div class="review-client">
                    <div class="client-avatar">${escapePublicHTML(getPublicInitial(review.clientName))}</div>
                    <div>
                        <h4>${escapePublicHTML(review.clientName)}</h4>
                        <span>${escapePublicHTML(review.company)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

/* =====================================================
   ABOUT PAGE
===================================================== */

function initAboutPageData() {
    const profile = PublicState.profile;

    if (!profile) return;

    const mainHeading = document.querySelector(".about-main-content h2");

    if (mainHeading) {
        mainHeading.textContent = "Helping Businesses Grow Through Smart Digital Marketing";
    }

    const aboutParagraphs = document.querySelectorAll(".about-main-content > p");

    if (aboutParagraphs.length && profile.bio) {
        aboutParagraphs[0].textContent = profile.bio;
    }
}

/* =====================================================
   SERVICES PAGE
===================================================== */

async function initServicesPageData() {
    const grid = document.querySelector(".services-page-grid");

    if (!grid) return;

    const result = await PortfolioAPI.getPublishedData("services");

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No service found.");
        return;
    }

    const services = result.data.sort(function (a, b) {
        return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
    });

    grid.innerHTML = services.map(function (service) {
        const features = splitPublicText(service.features);

        return `
            <div class="service-page-card reveal active">
                <div class="service-page-icon">${renderPublicServiceIcon(service.icon, service.name, service.category)}</div>
                <h3>${escapePublicHTML(service.name)}</h3>
                <p>${escapePublicHTML(service.description)}</p>

                <ul>
                    ${features.map(function (item) {
            return `<li>${escapePublicHTML(item)}</li>`;
        }).join("")}
                </ul>
            </div>
        `;
    }).join("");
}

/* =====================================================
   EDUCATION PAGE
===================================================== */

async function initEducationPageData() {
    const result = await PortfolioAPI.getPublishedData("education");

    if (!result.success || !result.data.length) return;

    renderEducationTimeline(result.data);
    renderCertificationGrid(result.data);
    renderTrainingList(result.data);
}

function renderEducationTimeline(rows) {
    const timeline = document.querySelector(".education-timeline");

    if (!timeline) return;

    const academicRows = rows.filter(function (item) {
        return item.type === "Academic";
    });

    if (!academicRows.length) {
        renderEmptyBox(timeline, "No academic education found.");
        return;
    }

    timeline.innerHTML = academicRows.map(function (item) {
        return `
            <div class="education-item reveal active">
                <div class="education-year">${escapePublicHTML(item.year)}</div>

                <div class="education-card">
                    <span class="education-type">${escapePublicHTML(item.type)}</span>
                    <h3>${escapePublicHTML(item.degree)}</h3>
                    <h4>${escapePublicHTML(item.institution)}</h4>
                    <p>${escapePublicHTML(item.description)}</p>

                    <div class="education-meta">
                        <span>Result: ${escapePublicHTML(item.result || "Completed")}</span>
                        <span>Status: ${escapePublicHTML(item.status)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderCertificationGrid(rows) {
    const grid = document.querySelector(".certification-grid");

    if (!grid) return;

    const certifications = rows.filter(function (item) {
        return item.type === "Certification";
    });

    if (!certifications.length) {
        renderEmptyBox(grid, "No certification found.");
        return;
    }

    grid.innerHTML = certifications.map(function (item) {
        return `
            <div class="certification-card reveal active">
                <div class="cert-icon"><i class="fa-solid fa-check"></i></div>
                <span>${escapePublicHTML(item.institution)}</span>
                <h3>${escapePublicHTML(item.degree)}</h3>
                <p>${escapePublicHTML(item.description)}</p>
                ${item.certificateUrl
                ? `<a href="${escapePublicHTML(item.certificateUrl)}" target="_blank" rel="noopener" class="certificate-link">View Certificate →</a>`
                : ""
            }
            </div>
        `;
    }).join("");
}

function renderTrainingList(rows) {
    const list = document.querySelector(".training-list");

    if (!list) return;

    const trainings = rows.filter(function (item) {
        return item.type === "Training";
    });

    if (!trainings.length) {
        renderEmptyBox(list, "No training found.");
        return;
    }

    list.innerHTML = trainings.map(function (item, index) {
        return `
            <div class="training-item">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div>
                    <h3>${escapePublicHTML(item.degree)}</h3>
                    <p>${escapePublicHTML(item.description)}</p>
                </div>
            </div>
        `;
    }).join("");
}

/* =====================================================
   EXPERIENCE PAGE
===================================================== */

async function initExperiencePageData() {
    const timeline = document.querySelector(".experience-timeline");

    if (!timeline) return;

    const result = await PortfolioAPI.getPublishedData("experience");

    if (!result.success || !result.data.length) {
        renderEmptyBox(timeline, "No experience found.");
        return;
    }

    timeline.innerHTML = result.data.map(function (item) {
        const responsibilities = splitPublicText(item.responsibilities);
        const dateInfo = getPublicExperienceDate(item);

        return `
            <div class="experience-item reveal active">
                <div class="experience-date">
                    <span>${escapePublicHTML(dateInfo.startDate)}</span>
                    <small>${escapePublicHTML(dateInfo.endDate)}</small>
                </div>

                <div class="experience-card">
                    <span class="experience-type">${escapePublicHTML(item.type)}</span>

                    <h3>${escapePublicHTML(item.jobTitle)}</h3>
                    <h4>${escapePublicHTML(item.company)}</h4>

                    <p>${escapePublicHTML(item.description)}</p>

                    <ul>
                        ${responsibilities.map(function (point) {
                            return `<li>${escapePublicHTML(point)}</li>`;
                        }).join("")}
                    </ul>
                </div>
            </div>
        `;
    }).join("");
}

/* =====================================================
   PROJECTS PAGE
===================================================== */

async function initProjectsPageData() {
    const result = await PortfolioAPI.getPublishedData("projects");

    if (!result.success || !result.data.length) {
        const grid = document.getElementById("projectsGrid");
        if (grid) renderEmptyBox(grid, "No project found.");
        return;
    }

    renderFeaturedProject(result.data);
    renderProjectsGrid(result.data);
    bindProjectFilter();
}

function renderFeaturedProject(projects) {
    const featuredBox = document.querySelector(".featured-project-card");

    if (!featuredBox) return;

    const project = projects.find(function (item) {
        return String(item.featured).toUpperCase() === "TRUE";
    }) || projects[0];

    featuredBox.innerHTML = `
        <div class="featured-project-image">
            <img src="${escapePublicHTML(getPublicImageUrl(project.image))}" alt="${escapePublicHTML(project.title)}">
        </div>

        <div class="featured-project-content">
            <span class="project-category">${escapePublicHTML(project.category)}</span>

            <h2>${escapePublicHTML(project.title)}</h2>

            <p>${escapePublicHTML(project.fullDescription || project.shortDescription)}</p>

            <div class="featured-result-grid">
                ${splitPublicText(project.results).slice(0, 3).map(function (result) {
        const parsed = parsePublicResult(result);

        return `
                        <div>
                            <strong>${escapePublicHTML(parsed.value)}</strong>
                            <span>${escapePublicHTML(parsed.label)}</span>
                        </div>
                    `;
    }).join("")}
            </div>

            <a href="project-details.html?id=${encodeURIComponent(project.id)}" class="btn btn-primary">
                View Case Study
            </a>
        </div>
    `;
}

function renderProjectsGrid(projects) {
    const grid = document.getElementById("projectsGrid");

    if (!grid) return;

    grid.innerHTML = projects.map(function (project) {
        const categorySlug = createPublicSlug(project.category);

        return `
            <div class="project-page-card reveal active"
                 data-category="${escapePublicHTML(categorySlug)}"
                 data-title="${escapePublicHTML((project.title + " " + project.client + " " + project.category).toLowerCase())}">

                <div class="project-page-image">
                    <img src="${escapePublicHTML(getPublicImageUrl(project.image))}" alt="${escapePublicHTML(project.title)}">
                </div>

                <div class="project-page-content">
                    <span class="project-category">${escapePublicHTML(project.category)}</span>
                    <h3>${escapePublicHTML(project.title)}</h3>
                    <p>${escapePublicHTML(project.shortDescription)}</p>

                    <div class="project-info-list">
                        <span>Client: ${escapePublicHTML(project.client)}</span>
                        <span>Result: ${escapePublicHTML(project.mainResult)}</span>
                        <span>Duration: ${escapePublicHTML(project.date)}</span>
                    </div>

                    <a href="project-details.html?id=${encodeURIComponent(project.id)}" class="project-link">
                        <i class="fa-solid fa-arrow-right"></i><span>View Details</span>
                    </a>
                </div>
            </div>
        `;
    }).join("");
}

function bindProjectFilter() {
    const filterButtons = document.querySelectorAll(".project-filter-btn");
    const projectCards = document.querySelectorAll(".project-page-card");
    const searchInput = document.getElementById("projectSearch");
    const emptyMessage = document.getElementById("projectEmptyMessage");

    if (!projectCards.length) return;

    let activeCategory = "all";

    function filterProjects() {
        const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let visibleCount = 0;

        projectCards.forEach(function (card) {
            const category = card.getAttribute("data-category");
            const title = card.getAttribute("data-title") || "";
            const text = card.textContent.toLowerCase();

            const matchCategory = activeCategory === "all" || category === activeCategory;
            const matchSearch = title.includes(searchValue) || text.includes(searchValue);

            if (matchCategory && matchSearch) {
                card.classList.remove("hide");
                visibleCount++;
            } else {
                card.classList.add("hide");
            }
        });

        if (emptyMessage) {
            emptyMessage.classList.toggle("show", visibleCount === 0);
        }
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            activeCategory = button.getAttribute("data-filter") || "all";

            filterProjects();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", filterProjects);
    }
}

/* =====================================================
   PROJECT DETAILS PAGE
===================================================== */

async function initProjectDetailsPageData() {
    const titleElement = document.getElementById("detailsTitle");

    if (!titleElement) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        titleElement.textContent = "Project Not Found";
        return;
    }

    const result = await PortfolioAPI.getSingle("projects", id);

    if (!result.success || !result.data) {
        titleElement.textContent = "Project Not Found";
        return;
    }

    const project = result.data;

    setPublicText("detailsCategory", project.category);
    setPublicText("detailsTitle", project.title);
    setPublicText("detailsShortDescription", project.shortDescription);
    setPublicText("detailsOverviewTitle", project.title + " Overview");
    setPublicText("detailsOverviewText", project.fullDescription);
    setPublicText("detailsClient", project.client);
    setPublicText("detailsDuration", project.date);
    setPublicText("detailsMainResult", project.mainResult);
    setPublicText("detailsPlatform", project.category);
    setPublicText("detailsProblem", project.problem);

    const image = document.getElementById("detailsImage");

    if (image && project.image) {
        image.src = getPublicImageUrl(project.image);
        image.alt = project.title;
    }

    const strategyList = document.getElementById("detailsStrategyList");

    if (strategyList) {
        strategyList.innerHTML = splitPublicText(project.strategy).map(function (item) {
            return `<li>${escapePublicHTML(item)}</li>`;
        }).join("");
    }

    const toolsList = document.getElementById("detailsToolsList");

    if (toolsList) {
        toolsList.innerHTML = splitPublicText(project.tools).map(function (tool) {
            return `<span>${escapePublicHTML(tool)}</span>`;
        }).join("");
    }

    const resultsList = document.getElementById("detailsResultsList");

    if (resultsList) {
        resultsList.innerHTML = splitPublicText(project.results).map(function (item) {
            const parsed = parsePublicResult(item);

            return `
                <div class="result-item">
                    <strong>${escapePublicHTML(parsed.value)}</strong>
                    <span>${escapePublicHTML(parsed.label)}</span>
                </div>
            `;
        }).join("");
    }

    document.title = project.title + " | Project Details";
}

/* =====================================================
   REVIEWS PAGE
===================================================== */

async function initReviewsPageData() {
    const grid = document.querySelector(".reviews-page-grid");

    if (!grid) return;

    const result = await PortfolioAPI.getApprovedReviews();

    if (!result.success || !result.data.length) {
        renderEmptyBox(grid, "No approved review found.");
        return;
    }

    const reviews = result.data;

    grid.innerHTML = reviews.map(function (review) {
        return `
            <div class="review-page-card reveal active">
                <div class="rating">${renderPublicStars(review.rating)}</div>

                <p>“${escapePublicHTML(review.message)}”</p>

                <div class="review-project-name">
                    Project: ${escapePublicHTML(review.projectName || "General Review")}
                </div>

                <div class="review-client">
                    <div class="client-avatar">${escapePublicHTML(getPublicInitial(review.clientName))}</div>
                    <div>
                        <h4>${escapePublicHTML(review.clientName)}</h4>
                        <span>${escapePublicHTML(review.company)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    updateReviewSummary(reviews);
}

function updateReviewSummary(reviews) {
    const summaryCards = document.querySelectorAll(".review-summary-card strong");

    if (!summaryCards.length) return;

    const average = reviews.reduce(function (sum, item) {
        return sum + Number(item.rating || 0);
    }, 0) / reviews.length;

    summaryCards[0].textContent = average.toFixed(1);
    summaryCards[1].textContent = reviews.length + "+";
}

function bindPublicReviewForm() {
    const form = document.getElementById("reviewForm");

    if (!form) return;
    if (form.dataset.publicReviewBound === "true") return;
    form.dataset.publicReviewBound = "true";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = {
            clientName: getInputValue("reviewName"),
            company: getInputValue("reviewCompany"),
            projectName: getInputValue("reviewProject"),
            rating: getInputValue("reviewRating") || "5",
            imageUrl: "",
            message: getInputValue("reviewMessage")
        };

        if (!data.clientName || !data.company || !data.message) {
            alert("Please fill in all required fields.");
            return;
        }

        const submitBtn = form.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : "";

        setPublicButtonLoading(submitBtn, "Submitting...");

        const result = await PortfolioAPI.submitReview(data);

        resetPublicButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert("Thank you! Your review has been submitted and is waiting for admin approval.");
            form.reset();

            const ratingInput = document.getElementById("reviewRating");

            if (ratingInput) {
                ratingInput.value = "5";
            }
        } else {
            alert(result.message || "Review submit failed.");
        }
    });
}

/* =====================================================
   CONTACT PAGE
===================================================== */

function bindPublicContactForm() {
    const form = document.getElementById("contactPageForm");

    if (!form) return;
    if (form.dataset.publicContactBound === "true") return;
    form.dataset.publicContactBound = "true";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = {
            name: getInputValue("contactName"),
            email: getInputValue("contactEmail"),
            phone: getInputValue("contactPhone"),
            service: getInputValue("contactService"),
            subject: getInputValue("contactSubject"),
            message: getInputValue("contactMessage")
        };

        if (!data.name || !data.email || !data.phone || !data.service || !data.subject || !data.message) {
            alert("Please fill in all required fields.");
            return;
        }

        const submitBtn = form.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : "";

        setPublicButtonLoading(submitBtn, "Sending...");

        const result = await PortfolioAPI.submitMessage(data);

        resetPublicButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert("Thank you! Your message has been submitted successfully.");
            form.reset();
        } else {
            alert(result.message || "Message submit failed.");
        }
    });
}

/* =====================================================
   HELPERS
===================================================== */

function getCurrentPublicPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function getInputValue(id) {
    const input = document.getElementById(id);

    return input ? input.value.trim() : "";
}

function setPublicText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || "";
    }
}

function splitPublicText(value) {
    if (!value) return [];

    return String(value)
        .split(",")
        .map(function (item) {
            return item.trim();
        })
        .filter(Boolean);
}

function createPublicSlug(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function parsePublicResult(text) {
    const value = String(text || "").trim();

    if (!value) {
        return {
            value: "",
            label: "Result"
        };
    }

    const parts = value.split(" ");

    if (parts.length <= 1) {
        return {
            value: value,
            label: "Result"
        };
    }

    return {
        value: parts[0],
        label: parts.slice(1).join(" ")
    };
}

function renderPublicStars(rating) {
    const total = Number(rating) || 5;
    let stars = "";

    for (let i = 1; i <= 5; i++) {
        stars += i <= total ? "★" : "☆";
    }

    return stars;
}

function getPublicInitial(name) {
    if (!name) return "C";

    return String(name).charAt(0).toUpperCase();
}

function updateAllText(selector, text) {
    document.querySelectorAll(selector).forEach(function (item) {
        item.textContent = text;
    });
}

function setRootColor(variableName, value) {
    if (!value) return;

    document.documentElement.style.setProperty(variableName, value);
}

function updateSocialLinks(settings) {
    updatePublicContactAndSocialLinks(PublicState.profile, settings);
}

function updateContactInfo(profile) {
    updatePublicContactAndSocialLinks(profile, PublicState.settings);
}

function updatePublicContactAndSocialLinks(profile, settings) {
    profile = profile || {};
    settings = settings || {};

    const email = profile.email || "";
    const phone = profile.phone || "";
    const location = profile.location || "";

    updateProfileTextAndLink("[data-profile-email]", email, function (value) {
        return "mailto:" + value;
    });

    updateProfileTextAndLink("[data-profile-phone]", phone, function (value) {
        return "tel:" + cleanPhoneForTel(value);
    });

    updateAllText("[data-profile-name]", profile.name || "");

    document.querySelectorAll("[data-profile-location]").forEach(function (element) {
        if (location) {
            element.textContent = location;
        }
    });

    document.querySelectorAll("[data-profile-email-link]").forEach(function (link) {
        link.href = email ? "mailto:" + email : "#";
    });

    document.querySelectorAll("[data-profile-phone-link]").forEach(function (link) {
        link.href = phone ? "tel:" + cleanPhoneForTel(phone) : "#";
    });

    const whatsappUrl =
        settings.whatsapp ||
        profile.whatsapp ||
        buildWhatsappFromPhone(phone);

    const socialLinks = {
        facebook: pickValidSocialUrl("facebook", settings.facebook, profile.facebook),
        linkedin: pickValidSocialUrl("linkedin", settings.linkedin, profile.linkedin),
        instagram: pickValidSocialUrl("instagram", settings.instagram, profile.instagram),
        youtube: pickValidSocialUrl("youtube", settings.youtube, profile.youtube),
        whatsapp: pickValidSocialUrl("whatsapp", whatsappUrl),
        website: pickValidSocialUrl("website", settings.website, profile.website)
    };

    document.querySelectorAll("[data-social]").forEach(function (element) {
        const socialName = element.getAttribute("data-social");
        const url = socialLinks[socialName];

        if (url) {
            element.href = url;
            element.target = "_blank";
            element.rel = "noopener";
            element.innerHTML = renderSocialIconMarkup(socialName);
            element.setAttribute("aria-label", getSocialLabel(socialName));
            element.style.display = "";
        } else {
            element.href = "#";
            element.style.display = "none";
        }
    });
}

function updateProfileTextAndLink(selector, value, hrefBuilder) {
    if (!value) return;

    document.querySelectorAll(selector).forEach(function (element) {
        element.textContent = value;

        if (element.tagName.toLowerCase() === "a") {
            element.href = hrefBuilder(value);
        }
    });
}

function cleanPhoneForTel(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
}

function buildWhatsappFromPhone(phone) {
    const cleanPhone = String(phone || "").replace(/[^\d]/g, "");

    if (!cleanPhone) return "";

    return "https://wa.me/" + cleanPhone;
}




/* =====================================================
   FAST LOADING PLACEHOLDERS
===================================================== */

function preparePublicLoadingPlaceholders() {
    const page = getCurrentPublicPage();

    if (page === "index.html" || page === "") {
        setPublicInlineLoading(".service-preview-grid", "Loading services...");
        setPublicInlineLoading(".project-preview-grid", "Loading projects...");
        setPublicInlineLoading(".review-preview-grid", "Loading reviews...");
    }

    if (page === "services.html") {
        setPublicInlineLoading(".services-page-grid", "Loading services...");
    }

    if (page === "education.html") {
        setPublicInlineLoading(".education-timeline", "Loading education...");
        setPublicInlineLoading(".certification-grid", "Loading certifications...");
        setPublicInlineLoading(".training-list", "Loading training...");
    }

    if (page === "experience.html") {
        setPublicInlineLoading(".experience-timeline", "Loading experience...");
    }

    if (page === "projects.html") {
        setPublicInlineLoading(".featured-project-card", "Loading featured project...");
        setPublicInlineLoading("#projectsGrid", "Loading projects...");
    }

    if (page === "reviews.html") {
        setPublicInlineLoading(".reviews-page-grid", "Loading reviews...");
    }
}

function setPublicInlineLoading(selector, message) {
    const element = document.querySelector(selector);

    if (!element) return;

    element.innerHTML = `
        <div class="public-inline-loader">
            <span></span>
            <p>${escapePublicHTML(message)}</p>
        </div>
    `;
}

function delayPublic(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

/* =====================================================
   PUBLIC LOADING / RE-APPLY HELPERS
===================================================== */

function waitForPublicComponents(timeoutMs) {
    timeoutMs = timeoutMs || 1000;

    return new Promise(function (resolve) {
        if (window.__PUBLIC_COMPONENTS_LOADED__) {
            resolve();
            return;
        }

        const timer = setTimeout(resolve, timeoutMs);

        document.addEventListener("publicComponentsLoaded", function () {
            clearTimeout(timer);
            resolve();
        }, { once: true });
    });
}

function reapplyPublicGlobalData() {
    if (PublicState.settings) {
        applyPublicSettings(PublicState.settings);
    }

    if (PublicState.profile) {
        applyPublicProfile(PublicState.profile);
    }

    updatePublicContactAndSocialLinks(PublicState.profile, PublicState.settings);
}

function revealPublicPage() {
    if (!document.body) return;

    document.body.classList.remove("public-data-loading");
    document.body.classList.add("public-data-ready");
}

function normalizeNumber(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;

    return String(value).replace("+", "");
}

function renderEmptyBox(container, message) {
    if (!container) return;

    container.innerHTML = `
        <div class="public-empty-box">
            <p>${escapePublicHTML(message)}</p>
        </div>
    `;
}

function setPublicButtonLoading(button, text) {
    if (!button) return;

    button.textContent = text;
    button.disabled = true;
}

function resetPublicButtonLoading(button, oldText) {
    if (!button) return;

    button.textContent = oldText;
    button.disabled = false;
}

function escapePublicHTML(value) {
    if (value === 0) return "0";
    if (!value) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeSocialUrl(platform, value) {
    if (!value) return "";

    let url = String(value).trim();

    if (!url || url === "#" || url.toLowerCase().includes("/404")) {
        return "";
    }

    if (platform === "whatsapp") {
        return normalizeWhatsappUrl(url);
    }

    if (platform === "facebook") {
        return normalizePlatformUrl(url, "https://www.facebook.com/");
    }

    if (platform === "instagram") {
        return normalizePlatformUrl(url, "https://www.instagram.com/");
    }

    if (platform === "linkedin") {
        return normalizeLinkedinUrl(url);
    }

    if (platform === "youtube") {
        return normalizeYoutubeUrl(url);
    }

    if (platform === "website") {
        return normalizeWebsiteUrl(url);
    }

    return normalizeWebsiteUrl(url);
}

function normalizePlatformUrl(value, baseUrl) {
    let url = String(value || "").trim();

    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    url = url.replace(/^@/, "");
    url = url.replace(/^\/+/, "");

    return baseUrl + url;
}

function normalizeLinkedinUrl(value) {
    let url = String(value || "").trim();

    if (!url) return "";

    if (url.includes("linkedin.com/404")) {
        return "";
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    url = url.replace(/^@/, "");
    url = url.replace(/^\/+/, "");

    if (url.startsWith("in/")) {
        return "https://www.linkedin.com/" + url;
    }

    return "https://www.linkedin.com/in/" + url;
}

function normalizeYoutubeUrl(value) {
    let url = String(value || "").trim();

    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    url = url.replace(/^\/+/, "");

    if (url.startsWith("@")) {
        return "https://www.youtube.com/" + url;
    }

    if (url.startsWith("channel/") || url.startsWith("c/") || url.startsWith("user/")) {
        return "https://www.youtube.com/" + url;
    }

    return "https://www.youtube.com/@" + url.replace(/^@/, "");
}

function normalizeWhatsappUrl(value) {
    let url = String(value || "").trim();

    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const cleanPhone = url.replace(/[^\d]/g, "");

    if (!cleanPhone) return "";

    return "https://wa.me/" + cleanPhone;
}

function normalizeWebsiteUrl(value) {
    let url = String(value || "").trim();

    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    return "https://" + url;
}



/* =====================================================
   ROBUST SOCIAL URL NORMALIZER FIX
   Fixes LinkedIn /404 issues, no-protocol links,
   placeholder usernames, and settings/profile fallback order.
===================================================== */

function renderAboutSocialLinks(profile, settings) {
    profile = profile || {};
    settings = settings || {};

    const links = [
        { label: "Facebook", platform: "facebook", url: pickValidSocialUrl("facebook", settings.facebook, profile.facebook) },
        { label: "LinkedIn", platform: "linkedin", url: pickValidSocialUrl("linkedin", settings.linkedin, profile.linkedin) },
        { label: "Instagram", platform: "instagram", url: pickValidSocialUrl("instagram", settings.instagram, profile.instagram) },
        { label: "YouTube", platform: "youtube", url: pickValidSocialUrl("youtube", settings.youtube, profile.youtube) },
        { label: "WhatsApp", platform: "whatsapp", url: pickValidSocialUrl("whatsapp", settings.whatsapp, profile.whatsapp, buildWhatsappFromPhone(profile.phone)) }
    ];

    return links
        .filter(function (item) { return item.url; })
        .map(function (item) {
            return `<a href="${escapePublicHTML(item.url)}" target="_blank" rel="noopener" aria-label="${escapePublicHTML(item.label)}">${renderSocialIconMarkup(item.platform || item.label.toLowerCase())}</a>`;
        })
        .join("");
}

function pickValidSocialUrl(platform) {
    const values = Array.prototype.slice.call(arguments, 1);

    for (const value of values) {
        const normalized = normalizeSocialUrl(platform, value);

        if (normalized) {
            return normalized;
        }
    }

    return "";
}

function normalizeSocialUrl(platform, value) {
    if (!value) return "";

    const raw = String(value).trim();

    if (isInvalidSocialValue(platform, raw)) {
        return "";
    }

    if (platform === "whatsapp") {
        return normalizeWhatsappUrl(raw);
    }

    if (platform === "facebook") {
        return normalizeGenericSocialDomain(raw, "facebook.com", "https://www.facebook.com/");
    }

    if (platform === "instagram") {
        return normalizeGenericSocialDomain(raw, "instagram.com", "https://www.instagram.com/");
    }

    if (platform === "linkedin") {
        return normalizeLinkedinUrl(raw);
    }

    if (platform === "youtube") {
        return normalizeYoutubeUrl(raw);
    }

    if (platform === "website") {
        return normalizeWebsiteUrl(raw);
    }

    return normalizeWebsiteUrl(raw);
}

function isInvalidSocialValue(platform, value) {
    if (!value) return true;

    const url = String(value).trim();
    const lower = url.toLowerCase();

    if (!url || url === "#") return true;
    if (lower.includes("/404")) return true;

    const compact = lower
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");

    const placeholders = [
        "username",
        "your-username",
        "your_username",
        "yourusername",
        "user-name",
        "example",
        "example.com",
        "linkedin.com/in/username",
        "linkedin.com/in/your-username",
        "facebook.com/username",
        "instagram.com/username",
        "youtube.com/@username",
        "wa.me/8801xxxxxxxxx"
    ];

    if (placeholders.includes(compact)) return true;

    if (platform === "linkedin") {
        if (compact === "linkedin.com" || compact === "linkedin.com/in" || compact === "linkedin.com/company") return true;
        if (/linkedin\.com\/in\/(username|your-username|yourusername)\/?$/i.test(compact)) return true;
    }

    return false;
}

function normalizeGenericSocialDomain(value, domain, baseUrl) {
    let url = String(value || "").trim();

    if (!url) return "";

    url = url.replace(/^@/, "").replace(/^\/+/, "");

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    const noWwwDomain = domain.replace(/^www\./, "");
    const domainRegex = new RegExp("^(www\\.)?" + noWwwDomain.replace(".", "\\.") + "\\/", "i");

    if (domainRegex.test(url)) {
        return "https://" + url.replace(/^www\./i, "www.");
    }

    return baseUrl + url;
}

function normalizeLinkedinUrl(value) {
    let url = String(value || "").trim();

    if (!url || isInvalidSocialValue("linkedin", url)) return "";

    url = url.replace(/^@/, "").replace(/^\/+/, "");

    // Full URL already provided.
    if (/^https?:\/\//i.test(url)) {
        const parsed = safeParseUrl(url);

        if (!parsed) return url;
        if (!/linkedin\.com$/i.test(parsed.hostname.replace(/^www\./i, ""))) return url;
        if (!parsed.pathname || parsed.pathname === "/" || parsed.pathname.toLowerCase().startsWith("/404")) return "";

        return "https://www.linkedin.com" + parsed.pathname.replace(/\/+$/, "/") + (parsed.search || "");
    }

    // Domain without protocol, e.g. linkedin.com/in/name or www.linkedin.com/company/name.
    if (/^(www\.)?linkedin\.com\//i.test(url)) {
        return normalizeLinkedinUrl("https://" + url.replace(/^www\./i, "www."));
    }

    // Common LinkedIn path formats.
    if (/^(in|company|school|showcase|pub)\//i.test(url)) {
        return "https://www.linkedin.com/" + url;
    }

    // Bare username/slug.
    return "https://www.linkedin.com/in/" + encodeURIComponent(url).replace(/%2F/gi, "/");
}

function normalizeYoutubeUrl(value) {
    let url = String(value || "").trim();

    if (!url || isInvalidSocialValue("youtube", url)) return "";

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    url = url.replace(/^\/+/, "");

    if (/^(www\.)?youtube\.com\//i.test(url) || /^youtu\.be\//i.test(url)) {
        return "https://" + url;
    }

    if (url.startsWith("@")) {
        return "https://www.youtube.com/" + url;
    }

    if (/^(channel|c|user)\//i.test(url)) {
        return "https://www.youtube.com/" + url;
    }

    return "https://www.youtube.com/@" + url.replace(/^@/, "");
}

function normalizeWhatsappUrl(value) {
    let url = String(value || "").trim();

    if (!url || isInvalidSocialValue("whatsapp", url)) return "";

    if (/^https?:\/\//i.test(url)) {
        if (url.toLowerCase().includes("wa.me/") || url.toLowerCase().includes("api.whatsapp.com/")) {
            return url;
        }
    }

    const cleanPhone = url.replace(/[^\d]/g, "");

    if (!cleanPhone) return "";

    return "https://wa.me/" + cleanPhone;
}

function normalizeWebsiteUrl(value) {
    let url = String(value || "").trim();

    if (!url || isInvalidSocialValue("website", url)) return "";

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return "https://" + url.replace(/^\/+/, "");
}

function safeParseUrl(url) {
    try {
        return new URL(url);
    } catch (error) {
        return null;
    }
}


/* =====================================================
   FONT AWESOME ICON HELPERS
===================================================== */

function getSocialLabel(platform) {
    const labels = {
        facebook: "Facebook",
        linkedin: "LinkedIn",
        instagram: "Instagram",
        youtube: "YouTube",
        whatsapp: "WhatsApp",
        website: "Website"
    };

    return labels[platform] || "Social Link";
}

function getSocialIconClass(platform) {
    const icons = {
        facebook: "fa-brands fa-facebook-f",
        linkedin: "fa-brands fa-linkedin-in",
        instagram: "fa-brands fa-instagram",
        youtube: "fa-brands fa-youtube",
        whatsapp: "fa-brands fa-whatsapp",
        website: "fa-solid fa-globe"
    };

    return icons[platform] || "fa-solid fa-link";
}

function renderSocialIconMarkup(platform) {
    const label = getSocialLabel(platform);
    const iconClass = getSocialIconClass(platform);

    return `<i class="${escapePublicHTML(iconClass)}" aria-hidden="true"></i><span>${escapePublicHTML(label)}</span>`;
}

function renderPublicServiceIcon(iconValue, name, category) {
    const iconClass = getPublicServiceIconClass(iconValue, name, category);

    return `<i class="${escapePublicHTML(iconClass)}" aria-hidden="true"></i>`;
}

function getPublicServiceIconClass(iconValue, name, category) {
    const raw = String(iconValue || "").trim();

    if (/fa-(solid|regular|brands|light|duotone|thin)\s+fa-/i.test(raw) || /^fa-/i.test(raw)) {
        return raw;
    }

    const text = [raw, name, category].join(" ").toLowerCase();

    const iconMap = [
        { keys: ["facebook", "fb", "meta"], icon: "fa-brands fa-facebook-f" },
        { keys: ["google", "search ads", "ppc", "paid ads"], icon: "fa-brands fa-google" },
        { keys: ["seo", "optimization", "ranking"], icon: "fa-solid fa-magnifying-glass-chart" },
        { keys: ["lead", "generation", "leads"], icon: "fa-solid fa-user-plus" },
        { keys: ["social", "content", "media"], icon: "fa-solid fa-share-nodes" },
        { keys: ["email", "newsletter"], icon: "fa-solid fa-envelope-open-text" },
        { keys: ["analytics", "report", "data"], icon: "fa-solid fa-chart-line" },
        { keys: ["strategy", "planning", "campaign"], icon: "fa-solid fa-bullseye" },
        { keys: ["brand", "branding"], icon: "fa-solid fa-pen-nib" },
        { keys: ["design", "creative"], icon: "fa-solid fa-palette" }
    ];

    for (const item of iconMap) {
        if (item.keys.some(function (key) { return text.includes(key); })) {
            return item.icon;
        }
    }

    return "fa-solid fa-bullhorn";
}

function formatPublicDateText(value) {
    if (!value) return "";

    const text = String(value).trim();

    if (!text) return "";

    if (text.toLowerCase() === "present") {
        return "Present";
    }

    const looksLikeISODate =
        /^\d{4}-\d{2}-\d{2}/.test(text) ||
        text.includes("T") ||
        text.includes("GMT");

    if (looksLikeISODate) {
        const date = new Date(text);

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric"
            });
        }
    }

    return text;
}

function getPublicExperienceDate(item) {
    const startDate = formatPublicDateText(item.startDate);

    const isCurrent = String(item.current).toUpperCase() === "TRUE";

    const endDate = isCurrent
        ? "Present"
        : formatPublicDateText(item.endDate);

    return {
        startDate: startDate,
        endDate: endDate || "Present"
    };
}


function normalizePublicPercentage(value) {
    const number = Number(String(value || "0").replace("%", ""));

    if (Number.isNaN(number)) return 0;

    return Math.max(0, Math.min(100, Math.round(number)));
}

/* =====================================================
   DATABASE-ONLY / IMAGE HELPERS
===================================================== */

function clearPublicDatabaseOnlyCaches() {
    try {
        const keys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf("dm_api_cache_") === 0) {
                keys.push(key);
            }
        }

        keys.forEach(function (key) {
            localStorage.removeItem(key);
        });

        const sessionKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.indexOf("dm_api_cache_") === 0) {
                sessionKeys.push(key);
            }
        }

        sessionKeys.forEach(function (key) {
            sessionStorage.removeItem(key);
        });
    } catch (error) {
        /* Ignore storage errors. */
    }
}

function getPublicImageUrl(url) {
    if (!url) return "";

    if (typeof normalizePublicImageUrl === "function") {
        return normalizePublicImageUrl(url);
    }

    if (typeof normalizeImageUrl === "function") {
        return normalizeImageUrl(url);
    }

    return String(url).trim();
}
