/* =====================================================
   DIGITAL MARKETER PORTFOLIO ADMIN JS
   Clean Final Version
   Google Sheet API Connected
===================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
    initAdminLogin();

    const hasAdminComponents = document.querySelectorAll('[data-admin-include]').length > 0;

    if (hasAdminComponents) {
        const authResult = await verifySupabaseAdminSession();

        if (!authResult.success) {
            window.location.href = 'login.html';
            return;
        }

        await loadAdminComponents();
    }

    initAdminDashboardPage();
    initAdminProfilePage();
    initAdminEducationPage();
    initAdminExperiencePage();
    initAdminServicePage();
    initAdminSkillsPage();
    initAdminProjectPage();
    initAdminReviewPage();
    initAdminMessagesPage();
    initAdminSettingsPage();
});

/* =====================================================
   AUTH HELPERS
===================================================== */

function isAdminLoggedIn() {
    return localStorage.getItem('dm_admin_logged_in') === 'true';
}

async function verifySupabaseAdminSession() {
    if (!isApiReady(false) || !PortfolioAPI.requireAdminSession) {
        clearAdminLocalSession();
        return { success: false };
    }

    const result = await PortfolioAPI.requireAdminSession();

    if (!result.success) {
        clearAdminLocalSession();
    }

    return result;
}

function clearAdminLocalSession() {
    localStorage.removeItem('dm_admin_logged_in');
    localStorage.removeItem('dm_admin_id');
    localStorage.removeItem('dm_admin_name');
    localStorage.removeItem('dm_admin_email');
    localStorage.removeItem('dm_admin_role');
    localStorage.removeItem('dm_admin_token');
}

function isApiReady(showAlert = true) {
    if (typeof PortfolioAPI === 'undefined') {
        if (showAlert) {
            alert('API not found. Please check config.js and api.js connection.');
        }
        return false;
    }

    return true;
}

/* =====================================================
   ADMIN LOGIN
===================================================== */

function initAdminLogin() {
    const loginForm = document.getElementById('adminLoginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (!isApiReady()) return;

        const email = getInputValueById('adminEmail');
        const password = getInputValueById('adminPassword');

        if (!email || !password) {
            alert('Please enter email and password.');
            return;
        }

        const submitBtn = loginForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Checking...');

        const result = await PortfolioAPI.loginAdmin(email, password);

        resetButtonLoading(submitBtn, oldText);

        if (!result.success) {
            alert(result.message || 'Invalid email or password.');
            return;
        }

        const admin = result.data || {};

        localStorage.setItem('dm_admin_logged_in', 'true');
        localStorage.setItem('dm_admin_id', admin.id || '');
        localStorage.setItem('dm_admin_name', admin.name || 'Admin');
        localStorage.setItem('dm_admin_email', admin.email || '');
        localStorage.setItem('dm_admin_role', admin.role || 'Admin');
        localStorage.setItem('dm_admin_token', admin.adminToken || '');

        window.location.href = 'dashboard.html';
    });
}

/* =====================================================
   COMPONENT LOADER
===================================================== */

async function loadAdminComponents() {
    const includeElements = document.querySelectorAll('[data-admin-include]');

    for (const element of includeElements) {
        const file = element.getAttribute('data-admin-include');

        try {
            const response = await fetch(file);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' while loading ' + file);
            }

            const html = await response.text();
            element.innerHTML = html;
        } catch (error) {
            console.error('Admin component loading failed:', file, error);
        }
    }

    initAdminLayout();
}

/* =====================================================
   ADMIN LAYOUT
===================================================== */

function initAdminLayout() {
    const sidebar = document.getElementById('adminSidebar');
    const menuBtn = document.getElementById('adminMenuBtn');
    const overlay = document.getElementById('adminOverlay');
    const profileBox = document.getElementById('adminProfileBox');
    const profileDropdown = document.getElementById('adminProfileDropdown');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    updateAdminHeaderInfo();
    setAdminActiveNav();
    setAdminPageTitle();

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', function () {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });

        overlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    if (profileBox && profileDropdown) {
        profileBox.addEventListener('click', function (event) {
            event.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        document.addEventListener('click', function () {
            profileDropdown.classList.remove('show');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.logoutAdmin) {
                await PortfolioAPI.logoutAdmin();
            }

            clearAdminLocalSession();
            window.location.href = 'login.html';
        });
    }
}

function updateAdminHeaderInfo() {
    const adminName = localStorage.getItem('dm_admin_name') || 'Admin';
    const adminRole = localStorage.getItem('dm_admin_role') || 'Admin';

    const avatar = document.querySelector('.admin-avatar');
    const nameElement = document.querySelector('.admin-profile-info strong');
    const roleElement = document.querySelector('.admin-profile-info span');

    if (avatar) {
        avatar.textContent = adminName.charAt(0).toUpperCase();
    }

    if (nameElement) {
        nameElement.textContent = adminName;
    }

    if (roleElement) {
        roleElement.textContent = adminRole;
    }
}

function setAdminActiveNav() {
    const currentPage = getCurrentAdminPage();
    const navLinks = document.querySelectorAll('.admin-nav-link');

    navLinks.forEach(function (link) {
        const href = link.getAttribute('href') || '';
        const linkPage = href.split('/').pop();

        link.classList.toggle('active', linkPage === currentPage);
    });
}

function setAdminPageTitle() {
    const titleElement = document.getElementById('adminPageTitle');

    if (!titleElement) return;

    const titleMap = {
        'dashboard.html': 'Dashboard',
        'profile.html': 'Profile',
        'education.html': 'Education',
        'experience.html': 'Experience',
        'services.html': 'Services',
        'skills.html': 'Skills',
        'projects.html': 'Projects',
        'reviews.html': 'Reviews',
        'messages.html': 'Messages',
        'settings.html': 'Settings'
    };

    titleElement.textContent = titleMap[getCurrentAdminPage()] || 'Dashboard';
}

/* =====================================================
   DASHBOARD PAGE
===================================================== */

function initAdminDashboardPage() {
    const totalProjectsEl = document.getElementById('dashboardTotalProjects');
    const totalReviewsEl = document.getElementById('dashboardTotalReviews');
    const pendingReviewsEl = document.getElementById('dashboardPendingReviews');
    const newMessagesEl = document.getElementById('dashboardNewMessages');
    const recentProjectsBody = document.getElementById('dashboardRecentProjects');
    const recentMessagesList = document.getElementById('dashboardRecentMessages');

    if (!totalProjectsEl && !recentProjectsBody && !recentMessagesList) return;
    if (!isApiReady(false)) return;

    loadDashboardData();

    async function loadDashboardData() {
        try {
            const projectsResult = await PortfolioAPI.getData('projects');
            const reviewsResult = await PortfolioAPI.getData('reviews');
            const messagesResult = await PortfolioAPI.getData('messages');

            const projects = projectsResult.success ? projectsResult.data || [] : [];
            const reviews = reviewsResult.success ? reviewsResult.data || [] : [];
            const messages = messagesResult.success ? messagesResult.data || [] : [];

            updateDashboardStats(projects, reviews, messages);
            renderDashboardRecentProjects(projects);
            renderDashboardRecentMessages(messages);
        } catch (error) {
            console.error('Dashboard data load failed:', error);
        }
    }

    function updateDashboardStats(projects, reviews, messages) {
        const pendingReviews = reviews.filter(function (review) {
            return review.status === 'Pending';
        });

        const unreadMessages = messages.filter(function (message) {
            return message.status === 'Unread';
        });

        if (totalProjectsEl) totalProjectsEl.textContent = projects.length;
        if (totalReviewsEl) totalReviewsEl.textContent = reviews.length;
        if (pendingReviewsEl) pendingReviewsEl.textContent = pendingReviews.length;
        if (newMessagesEl) newMessagesEl.textContent = unreadMessages.length;
    }

    function renderDashboardRecentProjects(projects) {
        if (!recentProjectsBody) return;

        if (!projects.length) {
            recentProjectsBody.innerHTML = '<tr><td colspan="4">No project found.</td></tr>';
            return;
        }

        const recentProjects = sortByDateDesc(projects).slice(0, 5);

        recentProjectsBody.innerHTML = recentProjects.map(function (project) {
            return `
                <tr>
                    <td>${escapeAdminHTML(project.title || 'Untitled Project')}</td>
                    <td>${escapeAdminHTML(project.category || 'N/A')}</td>
                    <td>
                        <span class="status ${String(project.status || '').toLowerCase()}">
                            ${escapeAdminHTML(project.status || 'Draft')}
                        </span>
                    </td>
                    <td>${escapeAdminHTML(project.mainResult || 'N/A')}</td>
                </tr>
            `;
        }).join('');
    }

    function renderDashboardRecentMessages(messages) {
        if (!recentMessagesList) return;

        if (!messages.length) {
            recentMessagesList.innerHTML = `
                <div class="message-item">
                    <div class="message-avatar">M</div>
                    <div>
                        <h4>No Message</h4>
                        <p>No contact message found.</p>
                    </div>
                </div>
            `;
            return;
        }

        const recentMessages = sortByDateDesc(messages).slice(0, 5);

        recentMessagesList.innerHTML = recentMessages.map(function (message) {
            return `
                <div class="message-item">
                    <div class="message-avatar">${escapeAdminHTML(getAdminInitial(message.name))}</div>
                    <div>
                        <h4>
                            ${escapeAdminHTML(message.name || 'Unknown')}
                            ${message.status === 'Unread' ? '<span class="dashboard-unread-dot">Unread</span>' : ''}
                        </h4>
                        <p>${escapeAdminHTML(shortAdminText(message.message || message.subject || '', 72))}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

/* =====================================================
   PROFILE PAGE
===================================================== */

function initAdminProfilePage() {
    const profileForm = document.getElementById('adminProfileForm');

    if (!profileForm) return;
    if (!isApiReady(false)) return;

    const fields = {
        name: document.getElementById('profileName'),
        title: document.getElementById('profileTitle'),
        bio: document.getElementById('profileBio'),
        imageUrl: document.getElementById('profileImage'),
        cvUrl: document.getElementById('profileCV'),
        email: document.getElementById('profileEmail'),
        phone: document.getElementById('profilePhone'),
        location: document.getElementById('profileLocation'),
        facebook: document.getElementById('profileFacebook'),
        linkedin: document.getElementById('profileLinkedin'),
        instagram: document.getElementById('profileInstagram'),
        whatsapp: document.getElementById('profileWhatsapp'),
        campaigns: document.getElementById('profileCampaigns'),
        clients: document.getElementById('profileClients'),
        experienceYears: document.getElementById('profileExperience')
    };

    const preview = {
        image: document.getElementById('profilePreviewImage'),
        name: document.getElementById('profilePreviewName'),
        title: document.getElementById('profilePreviewTitle'),
        email: document.getElementById('profilePreviewEmail'),
        phone: document.getElementById('profilePreviewPhone'),
        location: document.getElementById('profilePreviewLocation')
    };

    const resetBtn = document.getElementById('resetProfileBtn');

    let currentProfileId = '';

    loadProfileFromAPI();

    Object.values(fields).forEach(function (field) {
        if (field) {
            field.addEventListener('input', updateProfilePreview);
        }
    });

    profileForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const profileData = {
            name: getAdminFieldValue(fields.name),
            title: getAdminFieldValue(fields.title),
            bio: getAdminFieldValue(fields.bio),
            imageUrl: getAdminFieldValue(fields.imageUrl),
            cvUrl: getAdminFieldValue(fields.cvUrl),
            email: getAdminFieldValue(fields.email),
            phone: getAdminFieldValue(fields.phone),
            location: getAdminFieldValue(fields.location),
            facebook: getAdminFieldValue(fields.facebook),
            linkedin: getAdminFieldValue(fields.linkedin),
            instagram: getAdminFieldValue(fields.instagram),
            whatsapp: getAdminFieldValue(fields.whatsapp),
            campaigns: getAdminFieldValue(fields.campaigns),
            clients: getAdminFieldValue(fields.clients),
            experienceYears: getAdminFieldValue(fields.experienceYears),
            status: 'Published'
        };

        if (!profileData.name || !profileData.title || !profileData.bio || !profileData.email || !profileData.phone) {
            alert('Please fill in required profile fields.');
            return;
        }

        const submitBtn = profileForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        let result;

        if (currentProfileId) {
            result = await PortfolioAPI.updateData('profile', currentProfileId, profileData);
        } else {
            profileData.id = 'PROF001';
            result = await PortfolioAPI.addData('profile', profileData);
        }

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert('Profile updated successfully!');

            if (result.data && result.data.id) {
                currentProfileId = result.data.id;
            }
        } else {
            alert(result.message || 'Profile update failed.');
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', loadProfileFromAPI);
    }

    async function loadProfileFromAPI() {
        const result = await PortfolioAPI.getData('profile');

        if (!result.success) {
            alert(result.message || 'Failed to load profile data.');
            return;
        }

        if (!result.data.length) {
            currentProfileId = '';
            updateProfilePreview();
            return;
        }

        const profile = result.data.find(function (item) {
            return item.status === 'Published';
        }) || result.data[0];

        currentProfileId = profile.id || '';

        setAdminFieldValue(fields.name, profile.name);
        setAdminFieldValue(fields.title, profile.title);
        setAdminFieldValue(fields.bio, profile.bio);
        setAdminFieldValue(fields.imageUrl, profile.imageUrl);
        setAdminFieldValue(fields.cvUrl, profile.cvUrl);
        setAdminFieldValue(fields.email, profile.email);
        setAdminFieldValue(fields.phone, profile.phone);
        setAdminFieldValue(fields.location, profile.location);
        setAdminFieldValue(fields.facebook, profile.facebook);
        setAdminFieldValue(fields.linkedin, profile.linkedin);
        setAdminFieldValue(fields.instagram, profile.instagram);
        setAdminFieldValue(fields.whatsapp, profile.whatsapp);
        setAdminFieldValue(fields.campaigns, profile.campaigns);
        setAdminFieldValue(fields.clients, profile.clients);
        setAdminFieldValue(fields.experienceYears, profile.experienceYears);

        updateProfilePreview();
    }

    function updateProfilePreview() {
        if (preview.name && fields.name) {
            preview.name.textContent = fields.name.value || 'Your Name Here';
        }

        if (preview.title && fields.title) {
            preview.title.textContent = fields.title.value || 'Digital Marketing Specialist';
        }

        if (preview.email && fields.email) {
            preview.email.textContent = fields.email.value || 'example@email.com';
        }

        if (preview.phone && fields.phone) {
            preview.phone.textContent = fields.phone.value || '+880 1XXXXXXXXX';
        }

        if (preview.location && fields.location) {
            preview.location.textContent = fields.location.value || 'Dhaka, Bangladesh';
        }

        if (preview.image && fields.imageUrl && fields.imageUrl.value.trim()) {
            preview.image.src = fields.imageUrl.value.trim();
        }
    }
}

/* =====================================================
   EDUCATION PAGE
===================================================== */

function initAdminEducationPage() {
    const educationForm = document.getElementById('educationForm');

    if (!educationForm) return;
    if (!isApiReady(false)) return;

    const controls = {
        id: document.getElementById('educationId'),
        degree: document.getElementById('educationDegree'),
        institution: document.getElementById('educationInstitution'),
        year: document.getElementById('educationYear'),
        result: document.getElementById('educationResult'),
        type: document.getElementById('educationType'),
        status: document.getElementById('educationStatus'),
        description: document.getElementById('educationDescription'),
        certificateUrl: document.getElementById('educationCertificateUrl'),
        tableBody: document.getElementById('educationTableBody'),
        emptyState: document.getElementById('educationEmptyState'),
        formTitle: document.getElementById('educationFormTitle'),
        cancelBtn: document.getElementById('cancelEducationEditBtn'),
        clearBtn: document.getElementById('clearEducationBtn')
    };

    let educationData = [];

    loadEducationFromAPI();

    educationForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            degree: getAdminFieldValue(controls.degree),
            institution: getAdminFieldValue(controls.institution),
            year: getAdminFieldValue(controls.year),
            result: getAdminFieldValue(controls.result),
            type: getAdminFieldValue(controls.type),
            description: getAdminFieldValue(controls.description),
            certificateUrl: getAdminFieldValue(controls.certificateUrl),
            status: getAdminFieldValue(controls.status)
        };

        if (!data.degree || !data.institution || !data.year || !data.type || !data.description || !data.status) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = educationForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('education', controls.id.value, data)
            : await PortfolioAPI.addData('education', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Education updated successfully!' : 'Education added successfully!');
            resetEducationForm();
            await loadEducationFromAPI();
        } else {
            alert(result.message || 'Education save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetEducationForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('education', educationData, controls.clearBtn, loadEducationFromAPI);
            resetEducationForm();
        });
    }

    async function loadEducationFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading education data...');

        const result = await PortfolioAPI.getData('education');

        if (!result.success) {
            alert(result.message || 'Failed to load education data.');
            return;
        }

        educationData = result.data || [];
        renderEducationTable();
    }

    function renderEducationTable() {
        if (!controls.tableBody) return;

        controls.tableBody.innerHTML = '';

        if (!educationData.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        educationData.forEach(function (item) {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <strong>${escapeAdminHTML(item.degree)}</strong>
                    <br>
                    <small>${escapeAdminHTML(item.result || 'No result added')}</small>
                </td>
                <td>${escapeAdminHTML(item.institution)}</td>
                <td>${escapeAdminHTML(item.year)}</td>
                <td><span class="admin-type-badge">${escapeAdminHTML(item.type)}</span></td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindTableActions(controls.tableBody, editEducation, deleteEducation);
    }

    function editEducation(id) {
        const item = educationData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.degree.value = item.degree || '';
        controls.institution.value = item.institution || '';
        controls.year.value = item.year || '';
        controls.result.value = item.result || '';
        controls.type.value = item.type || '';
        controls.status.value = item.status || 'Published';
        controls.description.value = item.description || '';
        controls.certificateUrl.value = item.certificateUrl || '';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Education';
        }

        scrollToTop();
    }

    async function deleteEducation(id) {
        const confirmDelete = confirm('Are you sure you want to delete this education record?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('education', id);

        if (result.success) {
            alert('Education deleted successfully.');
            resetEducationForm();
            await loadEducationFromAPI();
        } else {
            alert(result.message || 'Education delete failed.');
        }
    }

    function resetEducationForm() {
        educationForm.reset();
        controls.id.value = '';
        controls.status.value = 'Published';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Education';
        }
    }
}

/* =====================================================
   EXPERIENCE PAGE
===================================================== */

function initAdminExperiencePage() {
    const experienceForm = document.getElementById('experienceForm');

    if (!experienceForm) return;
    if (!isApiReady(false)) return;

    const controls = {
        id: document.getElementById('experienceId'),
        jobTitle: document.getElementById('experienceJobTitle'),
        company: document.getElementById('experienceCompany'),
        startDate: document.getElementById('experienceStartDate'),
        endDate: document.getElementById('experienceEndDate'),
        type: document.getElementById('experienceType'),
        status: document.getElementById('experienceStatus'),
        description: document.getElementById('experienceDescription'),
        responsibilities: document.getElementById('experienceResponsibilities'),
        achievements: document.getElementById('experienceAchievements'),
        current: document.getElementById('experienceCurrent'),
        tableBody: document.getElementById('experienceTableBody'),
        emptyState: document.getElementById('experienceEmptyState'),
        formTitle: document.getElementById('experienceFormTitle'),
        cancelBtn: document.getElementById('cancelExperienceEditBtn'),
        clearBtn: document.getElementById('clearExperienceBtn')
    };

    let experienceData = [];

    loadExperienceFromAPI();

    experienceForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            jobTitle: getAdminFieldValue(controls.jobTitle),
            company: getAdminFieldValue(controls.company),
            startDate: getAdminFieldValue(controls.startDate),
            endDate: getAdminFieldValue(controls.endDate) || 'Present',
            type: getAdminFieldValue(controls.type),
            description: getAdminFieldValue(controls.description),
            responsibilities: getAdminFieldValue(controls.responsibilities),
            achievements: getAdminFieldValue(controls.achievements),
            current: controls.current && controls.current.checked ? 'TRUE' : 'FALSE',
            status: getAdminFieldValue(controls.status)
        };

        if (!data.jobTitle || !data.company || !data.startDate || !data.type || !data.description || !data.responsibilities || !data.status) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = experienceForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('experience', controls.id.value, data)
            : await PortfolioAPI.addData('experience', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Experience updated successfully!' : 'Experience added successfully!');
            resetExperienceForm();
            await loadExperienceFromAPI();
        } else {
            alert(result.message || 'Experience save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetExperienceForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('experience', experienceData, controls.clearBtn, loadExperienceFromAPI);
            resetExperienceForm();
        });
    }

    async function loadExperienceFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading experience data...');

        const result = await PortfolioAPI.getData('experience');

        if (!result.success) {
            alert(result.message || 'Failed to load experience data.');
            return;
        }

        experienceData = result.data || [];
        renderExperienceTable();
    }

    function renderExperienceTable() {
        if (!controls.tableBody) return;

        controls.tableBody.innerHTML = '';

        if (!experienceData.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        experienceData.forEach(function (item) {
            const row = document.createElement('tr');
            const isCurrent = String(item.current).toUpperCase() === 'TRUE';

            row.innerHTML = `
                <td>
                    <strong>${escapeAdminHTML(item.jobTitle)}</strong>
                    ${isCurrent ? '<br><span class="admin-current-badge">Current</span>' : ''}
                </td>
                <td>${escapeAdminHTML(item.company)}</td>
                <td>${escapeAdminHTML((item.startDate || '') + ' - ' + (item.endDate || ''))}</td>
                <td><span class="admin-type-badge">${escapeAdminHTML(item.type)}</span></td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindTableActions(controls.tableBody, editExperience, deleteExperience);
    }

    function editExperience(id) {
        const item = experienceData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.jobTitle.value = item.jobTitle || '';
        controls.company.value = item.company || '';
        controls.startDate.value = item.startDate || '';
        controls.endDate.value = item.endDate || '';
        controls.type.value = item.type || '';
        controls.status.value = item.status || 'Published';
        controls.description.value = item.description || '';
        controls.responsibilities.value = item.responsibilities || '';
        controls.achievements.value = item.achievements || '';
        if (controls.current) {
            controls.current.checked = String(item.current).toUpperCase() === 'TRUE';
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Experience';
        }

        scrollToTop();
    }

    async function deleteExperience(id) {
        const confirmDelete = confirm('Are you sure you want to delete this experience record?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('experience', id);

        if (result.success) {
            alert('Experience deleted successfully.');
            resetExperienceForm();
            await loadExperienceFromAPI();
        } else {
            alert(result.message || 'Experience delete failed.');
        }
    }

    function resetExperienceForm() {
        experienceForm.reset();
        controls.id.value = '';
        controls.status.value = 'Published';
        if (controls.current) {
            controls.current.checked = false;
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Experience';
        }
    }
}

/* =====================================================
   SERVICES PAGE
===================================================== */

function initAdminServicePage() {
    const serviceForm = document.getElementById('serviceForm');

    if (!serviceForm) return;
    if (!isApiReady(false)) return;

    const controls = {
        id: document.getElementById('serviceId'),
        name: document.getElementById('serviceName'),
        icon: document.getElementById('serviceIcon'),
        category: document.getElementById('serviceCategory'),
        status: document.getElementById('serviceStatus'),
        description: document.getElementById('serviceDescription'),
        features: document.getElementById('serviceFeatures'),
        tools: document.getElementById('serviceTools'),
        order: document.getElementById('serviceOrder'),
        iconPreview: document.getElementById('serviceIconPreview'),
        tableBody: document.getElementById('serviceTableBody'),
        emptyState: document.getElementById('serviceEmptyState'),
        formTitle: document.getElementById('serviceFormTitle'),
        cancelBtn: document.getElementById('cancelServiceEditBtn'),
        clearBtn: document.getElementById('clearServiceBtn')
    };

    let serviceData = [];

    loadServicesFromAPI();
    updateServiceIconPreview();

    if (controls.icon) {
        controls.icon.addEventListener('input', updateServiceIconPreview);
    }

    serviceForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            name: getAdminFieldValue(controls.name),
            icon: getAdminFieldValue(controls.icon) || 'DM',
            category: getAdminFieldValue(controls.category),
            description: getAdminFieldValue(controls.description),
            features: getAdminFieldValue(controls.features),
            tools: getAdminFieldValue(controls.tools),
            displayOrder: getAdminFieldValue(controls.order) || '1',
            status: getAdminFieldValue(controls.status)
        };

        if (!data.name || !data.icon || !data.category || !data.description || !data.features || !data.status) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = serviceForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('services', controls.id.value, data)
            : await PortfolioAPI.addData('services', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Service updated successfully!' : 'Service added successfully!');
            resetServiceForm();
            await loadServicesFromAPI();
        } else {
            alert(result.message || 'Service save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetServiceForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('services', serviceData, controls.clearBtn, loadServicesFromAPI);
            resetServiceForm();
        });
    }

    async function loadServicesFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading services data...');

        const result = await PortfolioAPI.getData('services');

        if (!result.success) {
            alert(result.message || 'Failed to load services data.');
            return;
        }

        serviceData = result.data || [];
        serviceData.sort(function (a, b) {
            return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        });

        renderServiceTable();
    }

    function renderServiceTable() {
        if (!controls.tableBody) return;

        controls.tableBody.innerHTML = '';

        if (!serviceData.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        serviceData.forEach(function (item) {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <div class="service-title-cell">
                        <div class="service-table-icon">${escapeAdminHTML(item.icon)}</div>
                        <div>
                            <strong>${escapeAdminHTML(item.name)}</strong>
                            <small>${escapeAdminHTML(shortAdminText(item.description, 55))}</small>
                        </div>
                    </div>
                </td>
                <td><span class="admin-type-badge">${escapeAdminHTML(item.category)}</span></td>
                <td><div class="admin-tools-list">${renderAdminToolBadges(item.tools)}</div></td>
                <td>${escapeAdminHTML(item.displayOrder || '1')}</td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindTableActions(controls.tableBody, editService, deleteService);
    }

    function editService(id) {
        const item = serviceData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.name.value = item.name || '';
        controls.icon.value = item.icon || '';
        controls.category.value = item.category || '';
        controls.status.value = item.status || 'Published';
        controls.description.value = item.description || '';
        controls.features.value = item.features || '';
        controls.tools.value = item.tools || '';
        controls.order.value = item.displayOrder || '1';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Service';
        }

        updateServiceIconPreview();
        scrollToTop();
    }

    async function deleteService(id) {
        const confirmDelete = confirm('Are you sure you want to delete this service record?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('services', id);

        if (result.success) {
            alert('Service deleted successfully.');
            resetServiceForm();
            await loadServicesFromAPI();
        } else {
            alert(result.message || 'Service delete failed.');
        }
    }

    function resetServiceForm() {
        serviceForm.reset();
        controls.id.value = '';
        controls.status.value = 'Published';
        controls.order.value = '1';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Service';
        }

        updateServiceIconPreview();
    }

    function updateServiceIconPreview() {
        if (!controls.iconPreview || !controls.icon) return;

        controls.iconPreview.textContent = controls.icon.value.trim() || 'DM';
    }

    function renderAdminToolBadges(toolsText) {
        if (!toolsText) return '<span>No tools</span>';

        return String(toolsText)
            .split(',')
            .map(function (tool) {
                return tool.trim();
            })
            .filter(Boolean)
            .slice(0, 4)
            .map(function (tool) {
                return `<span>${escapeAdminHTML(tool)}</span>`;
            })
            .join('');
    }
}


/* =====================================================
   SKILLS PAGE
===================================================== */

function initAdminSkillsPage() {
    const skillForm = document.getElementById('skillForm');

    if (!skillForm) return;
    if (!isApiReady(false)) return;

    const controls = {
        id: document.getElementById('skillId'),
        name: document.getElementById('skillName'),
        percentage: document.getElementById('skillPercentage'),
        order: document.getElementById('skillOrder'),
        status: document.getElementById('skillStatus'),
        previewName: document.getElementById('skillPreviewName'),
        previewPercent: document.getElementById('skillPreviewPercent'),
        previewBar: document.getElementById('skillPreviewBar'),
        tableBody: document.getElementById('skillTableBody'),
        emptyState: document.getElementById('skillEmptyState'),
        formTitle: document.getElementById('skillFormTitle'),
        cancelBtn: document.getElementById('cancelSkillEditBtn'),
        clearBtn: document.getElementById('clearSkillBtn')
    };

    let skillData = [];

    loadSkillsFromAPI();
    updateSkillPreview();

    [controls.name, controls.percentage].forEach(function (field) {
        if (!field) return;
        field.addEventListener('input', updateSkillPreview);
        field.addEventListener('change', updateSkillPreview);
    });

    skillForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const percentage = normalizeAdminPercentage(getAdminFieldValue(controls.percentage));

        const data = {
            name: getAdminFieldValue(controls.name),
            percentage: String(percentage),
            displayOrder: getAdminFieldValue(controls.order) || '1',
            status: getAdminFieldValue(controls.status)
        };

        if (!data.name || data.percentage === '' || !data.status) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = skillForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('skills', controls.id.value, data)
            : await PortfolioAPI.addData('skills', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Skill updated successfully!' : 'Skill added successfully!');
            resetSkillForm();
            await loadSkillsFromAPI();
        } else {
            alert(result.message || 'Skill save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetSkillForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('skills', skillData, controls.clearBtn, loadSkillsFromAPI);
            resetSkillForm();
        });
    }

    async function loadSkillsFromAPI() {
        setTableLoading(controls.tableBody, 5, 'Loading skills data...');

        const result = await PortfolioAPI.getData('skills');

        if (!result.success) {
            alert(result.message || 'Failed to load skills data.');
            return;
        }

        skillData = result.data || [];
        skillData.sort(function (a, b) {
            return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        });

        renderSkillTable();
    }

    function renderSkillTable() {
        if (!controls.tableBody) return;

        controls.tableBody.innerHTML = '';

        if (!skillData.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        skillData.forEach(function (item) {
            const percentage = normalizeAdminPercentage(item.percentage);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <div class="admin-skill-table-name">
                        <strong>${escapeAdminHTML(item.name)}</strong>
                    </div>
                </td>

                <td>
                    <div class="admin-skill-table-progress">
                        <small>${percentage}%</small>
                        <div class="admin-skill-table-bar">
                            <span style="width: ${percentage}%;"></span>
                        </div>
                    </div>
                </td>

                <td>${escapeAdminHTML(item.displayOrder || '1')}</td>

                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>

                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindTableActions(controls.tableBody, editSkill, deleteSkill);
    }

    function editSkill(id) {
        const item = skillData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.name.value = item.name || '';
        controls.percentage.value = normalizeAdminPercentage(item.percentage);
        controls.order.value = item.displayOrder || '1';
        controls.status.value = item.status || 'Published';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Skill';
        }

        updateSkillPreview();
        scrollToTop();
    }

    async function deleteSkill(id) {
        const confirmDelete = confirm('Are you sure you want to delete this skill?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('skills', id);

        if (result.success) {
            alert('Skill deleted successfully.');
            resetSkillForm();
            await loadSkillsFromAPI();
        } else {
            alert(result.message || 'Skill delete failed.');
        }
    }

    function resetSkillForm() {
        skillForm.reset();
        controls.id.value = '';
        controls.percentage.value = '90';
        controls.order.value = '1';
        controls.status.value = 'Published';

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Skill';
        }

        updateSkillPreview();
    }

    function updateSkillPreview() {
        const name = getAdminFieldValue(controls.name) || 'Skill Name';
        const percentage = normalizeAdminPercentage(getAdminFieldValue(controls.percentage) || '90');

        if (controls.previewName) controls.previewName.textContent = name;
        if (controls.previewPercent) controls.previewPercent.textContent = percentage + '%';
        if (controls.previewBar) controls.previewBar.style.width = percentage + '%';
    }
}

function normalizeAdminPercentage(value) {
    const number = Number(String(value || '0').replace('%', ''));

    if (Number.isNaN(number)) return 0;

    return Math.max(0, Math.min(100, Math.round(number)));
}

/* =====================================================
   PROJECTS PAGE
===================================================== */

function initAdminProjectPage() {
    const projectForm = document.getElementById('projectForm');

    if (!projectForm) return;
    if (!isApiReady(false)) return;

    const defaultImage = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=900&auto=format&fit=crop';

    const controls = {
        id: document.getElementById('projectId'),
        title: document.getElementById('projectTitle'),
        category: document.getElementById('projectCategory'),
        client: document.getElementById('projectClient'),
        date: document.getElementById('projectDate'),
        image: document.getElementById('projectImage'),
        url: document.getElementById('projectUrl'),
        shortDescription: document.getElementById('projectShortDescription'),
        fullDescription: document.getElementById('projectFullDescription'),
        problem: document.getElementById('projectProblem'),
        strategy: document.getElementById('projectStrategy'),
        tools: document.getElementById('projectTools'),
        results: document.getElementById('projectResults'),
        mainResult: document.getElementById('projectMainResult'),
        status: document.getElementById('projectStatus'),
        featured: document.getElementById('projectFeatured'),
        imagePreview: document.getElementById('projectImagePreview'),
        tableBody: document.getElementById('projectTableBody'),
        emptyState: document.getElementById('projectEmptyState'),
        formTitle: document.getElementById('projectFormTitle'),
        cancelBtn: document.getElementById('cancelProjectEditBtn'),
        clearBtn: document.getElementById('clearProjectBtn'),
        search: document.getElementById('adminProjectSearch'),
        statusFilter: document.getElementById('adminProjectStatusFilter')
    };

    let projectData = [];

    loadProjectsFromAPI();
    updateProjectImagePreview();

    if (controls.image) {
        controls.image.addEventListener('input', updateProjectImagePreview);
    }

    if (controls.search) {
        controls.search.addEventListener('input', renderProjectTable);
    }

    if (controls.statusFilter) {
        controls.statusFilter.addEventListener('change', renderProjectTable);
    }

    projectForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            title: getAdminFieldValue(controls.title),
            category: getAdminFieldValue(controls.category),
            client: getAdminFieldValue(controls.client),
            date: getAdminFieldValue(controls.date),
            image: getAdminFieldValue(controls.image) || defaultImage,
            url: getAdminFieldValue(controls.url),
            shortDescription: getAdminFieldValue(controls.shortDescription),
            fullDescription: getAdminFieldValue(controls.fullDescription),
            problem: getAdminFieldValue(controls.problem),
            strategy: getAdminFieldValue(controls.strategy),
            tools: getAdminFieldValue(controls.tools),
            results: getAdminFieldValue(controls.results),
            mainResult: getAdminFieldValue(controls.mainResult),
            featured: controls.featured && controls.featured.checked ? 'TRUE' : 'FALSE',
            status: getAdminFieldValue(controls.status)
        };

        if (!data.title || !data.category || !data.client || !data.date || !data.shortDescription || !data.fullDescription || !data.problem || !data.strategy || !data.results || !data.mainResult || !data.status) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = projectForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('projects', controls.id.value, data)
            : await PortfolioAPI.addData('projects', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Project updated successfully!' : 'Project added successfully!');
            resetProjectForm();
            await loadProjectsFromAPI();
        } else {
            alert(result.message || 'Project save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetProjectForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('projects', projectData, controls.clearBtn, loadProjectsFromAPI);
            resetProjectForm();
        });
    }

    async function loadProjectsFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading project data...');

        const result = await PortfolioAPI.getData('projects');

        if (!result.success) {
            alert(result.message || 'Failed to load project data.');
            return;
        }

        projectData = result.data || [];
        renderProjectTable();
    }

    function renderProjectTable() {
        if (!controls.tableBody) return;

        const searchValue = controls.search ? controls.search.value.toLowerCase().trim() : '';
        const statusValue = controls.statusFilter ? controls.statusFilter.value : 'all';

        controls.tableBody.innerHTML = '';

        const filteredProjects = projectData.filter(function (item) {
            const searchableText = [
                item.title,
                item.category,
                item.client,
                item.date,
                item.mainResult,
                item.status
            ].join(' ').toLowerCase();

            const matchSearch = searchableText.includes(searchValue);
            const matchStatus = statusValue === 'all' || item.status === statusValue;

            return matchSearch && matchStatus;
        });

        if (!filteredProjects.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        filteredProjects.forEach(function (item) {
            const row = document.createElement('tr');
            const isFeatured = String(item.featured).toUpperCase() === 'TRUE';

            row.innerHTML = `
                <td>
                    <div class="project-title-cell">
                        <div class="project-table-thumb">
                            <img src="${escapeAdminHTML(item.image || defaultImage)}" alt="${escapeAdminHTML(item.title)}">
                        </div>
                        <div>
                            <strong>${escapeAdminHTML(item.title)}</strong>
                            <small>${escapeAdminHTML(shortAdminText(item.shortDescription, 60))}</small>
                            ${isFeatured ? '<br><span class="admin-featured-badge">Featured</span>' : ''}
                        </div>
                    </div>
                </td>
                <td><span class="admin-type-badge">${escapeAdminHTML(item.category)}</span></td>
                <td>${escapeAdminHTML(item.client)}</td>
                <td>${escapeAdminHTML(item.mainResult)}</td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindTableActions(controls.tableBody, editProject, deleteProject);
    }

    function editProject(id) {
        const item = projectData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.title.value = item.title || '';
        controls.category.value = item.category || '';
        controls.client.value = item.client || '';
        controls.date.value = item.date || '';
        controls.image.value = item.image || '';
        controls.url.value = item.url || '';
        controls.shortDescription.value = item.shortDescription || '';
        controls.fullDescription.value = item.fullDescription || '';
        controls.problem.value = item.problem || '';
        controls.strategy.value = item.strategy || '';
        controls.tools.value = item.tools || '';
        controls.results.value = item.results || '';
        controls.mainResult.value = item.mainResult || '';
        controls.status.value = item.status || 'Published';
        if (controls.featured) {
            controls.featured.checked = String(item.featured).toUpperCase() === 'TRUE';
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Project';
        }

        updateProjectImagePreview();
        scrollToTop();
    }

    async function deleteProject(id) {
        const confirmDelete = confirm('Are you sure you want to delete this project?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('projects', id);

        if (result.success) {
            alert('Project deleted successfully.');
            resetProjectForm();
            await loadProjectsFromAPI();
        } else {
            alert(result.message || 'Project delete failed.');
        }
    }

    function resetProjectForm() {
        projectForm.reset();
        controls.id.value = '';
        controls.status.value = 'Published';
        if (controls.featured) {
            controls.featured.checked = false;
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Project';
        }

        updateProjectImagePreview();
    }

    function updateProjectImagePreview() {
        if (!controls.imagePreview || !controls.image) return;

        controls.imagePreview.src = controls.image.value.trim() || defaultImage;
    }
}

/* =====================================================
   REVIEWS PAGE
===================================================== */

function initAdminReviewPage() {
    const reviewForm = document.getElementById('reviewAdminForm');

    if (!reviewForm) return;
    if (!isApiReady(false)) return;

    const controls = {
        id: document.getElementById('reviewId'),
        clientName: document.getElementById('reviewClientName'),
        company: document.getElementById('reviewCompany'),
        projectName: document.getElementById('reviewProjectName'),
        rating: document.getElementById('reviewRating'),
        status: document.getElementById('reviewStatus'),
        imageUrl: document.getElementById('reviewImageUrl'),
        message: document.getElementById('reviewMessage'),
        featured: document.getElementById('reviewFeatured'),
        starPreview: document.getElementById('reviewStarPreview'),
        messagePreview: document.getElementById('reviewMessagePreview'),
        initialPreview: document.getElementById('reviewInitialPreview'),
        clientPreview: document.getElementById('reviewClientPreview'),
        companyPreview: document.getElementById('reviewCompanyPreview'),
        tableBody: document.getElementById('reviewTableBody'),
        emptyState: document.getElementById('reviewEmptyState'),
        formTitle: document.getElementById('reviewFormTitle'),
        cancelBtn: document.getElementById('cancelReviewEditBtn'),
        clearBtn: document.getElementById('clearReviewBtn'),
        search: document.getElementById('adminReviewSearch'),
        statusFilter: document.getElementById('adminReviewStatusFilter')
    };

    let reviewData = [];

    loadReviewsFromAPI();
    updateReviewPreview();

    [
        controls.clientName,
        controls.company,
        controls.projectName,
        controls.rating,
        controls.message
    ].forEach(function (field) {
        if (!field) return;

        field.addEventListener('input', updateReviewPreview);
        field.addEventListener('change', updateReviewPreview);
    });

    if (controls.search) {
        controls.search.addEventListener('input', renderReviewTable);
    }

    if (controls.statusFilter) {
        controls.statusFilter.addEventListener('change', renderReviewTable);
    }

    reviewForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const data = {
            clientName: getAdminFieldValue(controls.clientName),
            company: getAdminFieldValue(controls.company),
            projectName: getAdminFieldValue(controls.projectName),
            rating: getAdminFieldValue(controls.rating) || '5',
            imageUrl: getAdminFieldValue(controls.imageUrl),
            message: getAdminFieldValue(controls.message),
            featured: controls.featured && controls.featured.checked ? 'TRUE' : 'FALSE',
            status: getAdminFieldValue(controls.status)
        };

        if (!data.clientName || !data.company || !data.rating || !data.status || !data.message) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = reviewForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        const result = controls.id.value
            ? await PortfolioAPI.updateData('reviews', controls.id.value, data)
            : await PortfolioAPI.addData('reviews', data);

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert(controls.id.value ? 'Review updated successfully!' : 'Review added successfully!');
            resetReviewForm();
            await loadReviewsFromAPI();
        } else {
            alert(result.message || 'Review save failed.');
        }
    });

    if (controls.cancelBtn) {
        controls.cancelBtn.addEventListener('click', resetReviewForm);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('reviews', reviewData, controls.clearBtn, loadReviewsFromAPI);
            resetReviewForm();
        });
    }

    async function loadReviewsFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading review data...');

        const result = await PortfolioAPI.getData('reviews');

        if (!result.success) {
            alert(result.message || 'Failed to load review data.');
            return;
        }

        reviewData = result.data || [];
        renderReviewTable();
    }

    function renderReviewTable() {
        if (!controls.tableBody) return;

        const searchValue = controls.search ? controls.search.value.toLowerCase().trim() : '';
        const statusValue = controls.statusFilter ? controls.statusFilter.value : 'all';

        controls.tableBody.innerHTML = '';

        const filteredReviews = reviewData.filter(function (item) {
            const searchableText = [
                item.clientName,
                item.company,
                item.projectName,
                item.message,
                item.status
            ].join(' ').toLowerCase();

            const matchSearch = searchableText.includes(searchValue);
            const matchStatus = statusValue === 'all' || item.status === statusValue;

            return matchSearch && matchStatus;
        });

        if (!filteredReviews.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        filteredReviews.forEach(function (item) {
            const row = document.createElement('tr');
            const isFeatured = String(item.featured).toUpperCase() === 'TRUE';

            row.innerHTML = `
                <td>
                    <div class="review-client-cell">
                        ${renderReviewAvatar(item)}
                        <div>
                            <strong>${escapeAdminHTML(item.clientName)}</strong>
                            <small>${escapeAdminHTML(item.company)}</small>
                            <span class="admin-review-message-small">
                                ${escapeAdminHTML(shortAdminText(item.message, 65))}
                            </span>
                        </div>
                    </div>
                </td>
                <td><span class="admin-rating-stars">${renderAdminStars(item.rating)}</span></td>
                <td>${escapeAdminHTML(item.projectName || 'General Review')}</td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    ${isFeatured ? '<span class="admin-feature-status">Featured</span>' : '<span class="admin-not-featured-status">No</span>'}
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-edit="${escapeAdminHTML(item.id)}">Edit</button>
                        ${item.status !== 'Approved' ? `<button type="button" class="admin-action-btn edit" data-approve="${escapeAdminHTML(item.id)}">Approve</button>` : ''}
                        ${item.status !== 'Rejected' ? `<button type="button" class="admin-action-btn delete" data-reject="${escapeAdminHTML(item.id)}">Reject</button>` : ''}
                        <button type="button" class="admin-action-btn edit" data-feature="${escapeAdminHTML(item.id)}">
                            ${isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        bindReviewActions();
    }

    function bindReviewActions() {
        controls.tableBody.querySelectorAll('[data-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                editReview(btn.getAttribute('data-edit'));
            });
        });

        controls.tableBody.querySelectorAll('[data-approve]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                updateReviewStatus(btn.getAttribute('data-approve'), 'Approved');
            });
        });

        controls.tableBody.querySelectorAll('[data-reject]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                updateReviewStatus(btn.getAttribute('data-reject'), 'Rejected');
            });
        });

        controls.tableBody.querySelectorAll('[data-feature]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                toggleReviewFeatured(btn.getAttribute('data-feature'));
            });
        });

        controls.tableBody.querySelectorAll('[data-delete]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteReview(btn.getAttribute('data-delete'));
            });
        });
    }

    function editReview(id) {
        const item = reviewData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        controls.id.value = item.id || '';
        controls.clientName.value = item.clientName || '';
        controls.company.value = item.company || '';
        controls.projectName.value = item.projectName || '';
        controls.rating.value = item.rating || '5';
        controls.status.value = item.status || 'Pending';
        controls.imageUrl.value = item.imageUrl || '';
        controls.message.value = item.message || '';
        if (controls.featured) {
            controls.featured.checked = String(item.featured).toUpperCase() === 'TRUE';
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Edit Review';
        }

        updateReviewPreview();
        scrollToTop();
    }

    async function updateReviewStatus(id, status) {
        const result = await PortfolioAPI.updateReviewStatus(id, status);

        if (result.success) {
            alert('Review status updated to ' + status + '.');
            await loadReviewsFromAPI();
        } else {
            alert(result.message || 'Review status update failed.');
        }
    }

    async function toggleReviewFeatured(id) {
        const item = reviewData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        const currentFeatured = String(item.featured).toUpperCase() === 'TRUE';

        const result = await PortfolioAPI.updateData('reviews', id, {
            featured: currentFeatured ? 'FALSE' : 'TRUE'
        });

        if (result.success) {
            await loadReviewsFromAPI();
        } else {
            alert(result.message || 'Featured update failed.');
        }
    }

    async function deleteReview(id) {
        const confirmDelete = confirm('Are you sure you want to delete this review?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('reviews', id);

        if (result.success) {
            alert('Review deleted successfully.');
            resetReviewForm();
            await loadReviewsFromAPI();
        } else {
            alert(result.message || 'Review delete failed.');
        }
    }

    function resetReviewForm() {
        reviewForm.reset();
        controls.id.value = '';
        controls.rating.value = '5';
        controls.status.value = 'Pending';
        if (controls.featured) {
            controls.featured.checked = false;
        }

        if (controls.formTitle) {
            controls.formTitle.textContent = 'Add Review';
        }

        updateReviewPreview();
    }

    function updateReviewPreview() {
        const name = controls.clientName.value.trim() || 'Client Name';
        const company = controls.company.value.trim() || 'Company / Profession';
        const message = controls.message.value.trim() || 'Client review preview will appear here.';
        const rating = Number(controls.rating.value) || 5;

        if (controls.starPreview) controls.starPreview.textContent = renderAdminStars(rating);
        if (controls.messagePreview) controls.messagePreview.textContent = message;
        if (controls.initialPreview) controls.initialPreview.textContent = name.charAt(0).toUpperCase();
        if (controls.clientPreview) controls.clientPreview.textContent = name;
        if (controls.companyPreview) controls.companyPreview.textContent = company;
    }

    function renderReviewAvatar(item) {
        if (item.imageUrl) {
            return `
                <div class="review-client-image">
                    <img src="${escapeAdminHTML(item.imageUrl)}" alt="${escapeAdminHTML(item.clientName)}">
                </div>
            `;
        }

        return `<div class="review-client-letter">${escapeAdminHTML(getAdminInitial(item.clientName))}</div>`;
    }
}

/* =====================================================
   MESSAGES PAGE
===================================================== */

function initAdminMessagesPage() {
    const messageTableBody = document.getElementById('messageTableBody');

    if (!messageTableBody) return;
    if (!isApiReady(false)) return;

    const controls = {
        tableBody: messageTableBody,
        emptyState: document.getElementById('messageEmptyState'),
        search: document.getElementById('adminMessageSearch'),
        serviceFilter: document.getElementById('adminMessageServiceFilter'),
        statusFilter: document.getElementById('adminMessageStatusFilter'),
        clearBtn: document.getElementById('clearMessagesBtn'),
        markAllReadBtn: document.getElementById('markAllMessagesReadBtn'),
        modal: document.getElementById('messageDetailsModal'),
        closeModalBtn: document.getElementById('closeMessageModalBtn'),
        modalSubject: document.getElementById('modalMessageSubject'),
        modalName: document.getElementById('modalMessageName'),
        modalEmail: document.getElementById('modalMessageEmail'),
        modalPhone: document.getElementById('modalMessagePhone'),
        modalService: document.getElementById('modalMessageService'),
        modalDate: document.getElementById('modalMessageDate'),
        modalStatus: document.getElementById('modalMessageStatus'),
        modalText: document.getElementById('modalMessageText'),
        emailReplyBtn: document.getElementById('modalEmailReplyBtn'),
        whatsappReplyBtn: document.getElementById('modalWhatsappReplyBtn')
    };

    let messageData = [];

    loadMessagesFromAPI();

    if (controls.search) {
        controls.search.addEventListener('input', renderMessageTable);
    }

    if (controls.serviceFilter) {
        controls.serviceFilter.addEventListener('change', renderMessageTable);
    }

    if (controls.statusFilter) {
        controls.statusFilter.addEventListener('change', renderMessageTable);
    }

    if (controls.clearBtn) {
        controls.clearBtn.addEventListener('click', async function () {
            await clearAllRecords('messages', messageData, controls.clearBtn, loadMessagesFromAPI);
        });
    }

    if (controls.markAllReadBtn) {
        controls.markAllReadBtn.addEventListener('click', markAllMessagesRead);
    }

    if (controls.closeModalBtn) {
        controls.closeModalBtn.addEventListener('click', closeMessageModal);
    }

    if (controls.modal) {
        controls.modal.addEventListener('click', function (event) {
            if (event.target === controls.modal) {
                closeMessageModal();
            }
        });
    }

    async function loadMessagesFromAPI() {
        setTableLoading(controls.tableBody, 6, 'Loading message data...');

        const result = await PortfolioAPI.getData('messages');

        if (!result.success) {
            alert(result.message || 'Failed to load message data.');
            return;
        }

        messageData = sortByDateDesc(result.data || []);
        renderMessageTable();
    }

    function renderMessageTable() {
        const searchValue = controls.search ? controls.search.value.toLowerCase().trim() : '';
        const serviceValue = controls.serviceFilter ? controls.serviceFilter.value : 'all';
        const statusValue = controls.statusFilter ? controls.statusFilter.value : 'all';

        controls.tableBody.innerHTML = '';

        const filteredMessages = messageData.filter(function (item) {
            const searchableText = [
                item.name,
                item.email,
                item.phone,
                item.service,
                item.subject,
                item.message,
                item.status
            ].join(' ').toLowerCase();

            const matchSearch = searchableText.includes(searchValue);
            const matchService = serviceValue === 'all' || item.service === serviceValue;
            const matchStatus = statusValue === 'all' || item.status === statusValue;

            return matchSearch && matchService && matchStatus;
        });

        if (!filteredMessages.length) {
            toggleEmptyState(controls.emptyState, true);
            return;
        }

        toggleEmptyState(controls.emptyState, false);

        filteredMessages.forEach(function (item) {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <div class="message-sender-cell">
                        <div class="message-avatar">${escapeAdminHTML(getAdminInitial(item.name))}</div>
                        <div>
                            <strong>${escapeAdminHTML(item.name)}</strong>
                            <small>${escapeAdminHTML(formatAdminDate(item.createdAt || item.updatedAt))}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="message-contact-cell">
                        <a href="mailto:${escapeAdminHTML(item.email)}">${escapeAdminHTML(item.email)}</a>
                        <span>${escapeAdminHTML(item.phone)}</span>
                    </div>
                </td>
                <td><span class="admin-type-badge">${escapeAdminHTML(item.service)}</span></td>
                <td>
                    <div class="message-subject-cell">
                        <strong>${escapeAdminHTML(item.subject)}</strong>
                        <small>${escapeAdminHTML(shortAdminText(item.message, 70))}</small>
                    </div>
                </td>
                <td>
                    <span class="status ${String(item.status || '').toLowerCase()}">
                        ${escapeAdminHTML(item.status)}
                    </span>
                </td>
                <td>
                    <div class="admin-action-buttons">
                        <button type="button" class="admin-action-btn edit" data-view="${escapeAdminHTML(item.id)}">View</button>
                        <button type="button" class="admin-action-btn edit" data-toggle="${escapeAdminHTML(item.id)}">
                            ${item.status === 'Unread' ? 'Mark Read' : 'Mark Unread'}
                        </button>
                        <button type="button" class="admin-action-btn delete" data-delete="${escapeAdminHTML(item.id)}">Delete</button>
                    </div>
                </td>
            `;

            controls.tableBody.appendChild(row);
        });

        controls.tableBody.querySelectorAll('[data-view]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openMessageModal(btn.getAttribute('data-view'));
            });
        });

        controls.tableBody.querySelectorAll('[data-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                toggleMessageStatus(btn.getAttribute('data-toggle'));
            });
        });

        controls.tableBody.querySelectorAll('[data-delete]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteMessage(btn.getAttribute('data-delete'));
            });
        });
    }

    async function openMessageModal(id) {
        const item = messageData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item || !controls.modal) return;

        if (item.status !== 'Read') {
            await PortfolioAPI.updateMessageStatus(id, 'Read');
            item.status = 'Read';
        }

        if (controls.modalSubject) controls.modalSubject.textContent = item.subject || '';
        if (controls.modalName) controls.modalName.textContent = item.name || '';
        if (controls.modalEmail) controls.modalEmail.textContent = item.email || '';
        if (controls.modalPhone) controls.modalPhone.textContent = item.phone || '';
        if (controls.modalService) controls.modalService.textContent = item.service || '';
        if (controls.modalDate) controls.modalDate.textContent = formatAdminDate(item.createdAt || item.updatedAt);
        if (controls.modalStatus) controls.modalStatus.textContent = item.status || '';
        if (controls.modalText) controls.modalText.textContent = item.message || '';

        if (controls.emailReplyBtn) {
            controls.emailReplyBtn.href = buildAdminEmailReplyLink(item.email, item.name, item.subject);
        }

        if (controls.whatsappReplyBtn) {
            controls.whatsappReplyBtn.href = buildAdminWhatsappLink(item.phone, item.name, item.subject);
        }

        controls.modal.classList.add('show');
        renderMessageTable();
    }

    function closeMessageModal() {
        if (controls.modal) {
            controls.modal.classList.remove('show');
        }
    }

    async function toggleMessageStatus(id) {
        const item = messageData.find(function (row) {
            return String(row.id) === String(id);
        });

        if (!item) return;

        const newStatus = item.status === 'Unread' ? 'Read' : 'Unread';
        const result = await PortfolioAPI.updateMessageStatus(id, newStatus);

        if (result.success) {
            item.status = newStatus;
            renderMessageTable();
        } else {
            alert(result.message || 'Message status update failed.');
        }
    }

    async function deleteMessage(id) {
        const confirmDelete = confirm('Are you sure you want to delete this message?');

        if (!confirmDelete) return;

        const result = await PortfolioAPI.deleteData('messages', id);

        if (result.success) {
            alert('Message deleted successfully.');
            await loadMessagesFromAPI();
        } else {
            alert(result.message || 'Message delete failed.');
        }
    }

    async function markAllMessagesRead() {
        if (!messageData.length) {
            alert('No messages available.');
            return;
        }

        const oldText = controls.markAllReadBtn.textContent;

        setButtonLoading(controls.markAllReadBtn, 'Updating...');

        for (const item of messageData) {
            if (item.status !== 'Read') {
                await PortfolioAPI.updateMessageStatus(item.id, 'Read');
            }
        }

        resetButtonLoading(controls.markAllReadBtn, oldText);

        await loadMessagesFromAPI();

        alert('All messages marked as read.');
    }
}

/* =====================================================
   SETTINGS PAGE
===================================================== */

function initAdminSettingsPage() {
    const settingsForm = document.getElementById('adminSettingsForm');

    if (!settingsForm) return;
    if (!isApiReady(false)) return;

    const fields = {
        websiteTitle: document.getElementById('settingsWebsiteTitle'),
        logoText: document.getElementById('settingsLogoText'),
        tagline: document.getElementById('settingsTagline'),
        footerText: document.getElementById('settingsFooterText'),
        seoTitle: document.getElementById('settingsSeoTitle'),
        seoDescription: document.getElementById('settingsSeoDescription'),
        seoKeywords: document.getElementById('settingsSeoKeywords'),
        primaryColor: document.getElementById('settingsPrimaryColor'),
        primaryColorText: document.getElementById('settingsPrimaryColorText'),
        secondaryColor: document.getElementById('settingsSecondaryColor'),
        secondaryColorText: document.getElementById('settingsSecondaryColorText'),
        accentColor: document.getElementById('settingsAccentColor'),
        accentColorText: document.getElementById('settingsAccentColorText'),
        facebook: document.getElementById('settingsFacebook'),
        linkedin: document.getElementById('settingsLinkedin'),
        instagram: document.getElementById('settingsInstagram'),
        youtube: document.getElementById('settingsYoutube'),
        whatsapp: document.getElementById('settingsWhatsapp'),
        website: document.getElementById('settingsWebsite'),
        apiUrl: document.getElementById('settingsApiUrl')
    };

    const preview = {
        logoIcon: document.getElementById('settingsPreviewLogoIcon'),
        title: document.getElementById('settingsPreviewTitle'),
        tagline: document.getElementById('settingsPreviewTagline'),
        footer: document.getElementById('settingsPreviewFooter'),
        primary: document.getElementById('settingsPreviewPrimary'),
        secondary: document.getElementById('settingsPreviewSecondary'),
        accent: document.getElementById('settingsPreviewAccent'),
        socials: document.getElementById('settingsPreviewSocials')
    };

    const resetBtn = document.getElementById('resetSettingsBtn');

    let currentSettingsId = '';

    loadSettingsFromAPI();
    bindColorSync();

    Object.values(fields).forEach(function (field) {
        if (!field) return;

        field.addEventListener('input', updateSettingsPreview);
        field.addEventListener('change', updateSettingsPreview);
    });

    settingsForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const settingsData = {
            websiteTitle: getAdminFieldValue(fields.websiteTitle),
            logoText: getAdminFieldValue(fields.logoText),
            tagline: getAdminFieldValue(fields.tagline),
            footerText: getAdminFieldValue(fields.footerText),
            seoTitle: getAdminFieldValue(fields.seoTitle),
            seoDescription: getAdminFieldValue(fields.seoDescription),
            seoKeywords: getAdminFieldValue(fields.seoKeywords),
            primaryColor: getAdminFieldValue(fields.primaryColorText) || '#7c3cff',
            secondaryColor: getAdminFieldValue(fields.secondaryColorText) || '#00d4ff',
            accentColor: getAdminFieldValue(fields.accentColorText) || '#ff6b35',
            facebook: getAdminFieldValue(fields.facebook),
            linkedin: getAdminFieldValue(fields.linkedin),
            instagram: getAdminFieldValue(fields.instagram),
            youtube: getAdminFieldValue(fields.youtube),
            whatsapp: getAdminFieldValue(fields.whatsapp),
            website: getAdminFieldValue(fields.website),
            apiUrl: getAdminFieldValue(fields.apiUrl)
        };

        if (!settingsData.websiteTitle || !settingsData.logoText || !settingsData.tagline || !settingsData.footerText) {
            alert('Please fill in website title, logo text, tagline, and footer text.');
            return;
        }

        if (
            !isValidAdminHexColor(settingsData.primaryColor) ||
            !isValidAdminHexColor(settingsData.secondaryColor) ||
            !isValidAdminHexColor(settingsData.accentColor)
        ) {
            alert('Please use valid HEX colors. Example: #7c3cff');
            return;
        }

        const submitBtn = settingsForm.querySelector("button[type='submit']");
        const oldText = submitBtn ? submitBtn.textContent : '';

        setButtonLoading(submitBtn, 'Saving...');

        let result;

        if (currentSettingsId) {
            result = await PortfolioAPI.updateData('settings', currentSettingsId, settingsData);
        } else {
            settingsData.id = 'SET001';
            result = await PortfolioAPI.addData('settings', settingsData);
        }

        resetButtonLoading(submitBtn, oldText);

        if (result.success) {
            alert('Website settings updated successfully.');

            if (result.data && result.data.id) {
                currentSettingsId = result.data.id;
            }

            updateSettingsPreview();
        } else {
            alert(result.message || 'Settings update failed.');
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', async function () {
            const confirmReload = confirm('Reload settings ? Unsaved changes will be lost.');

            if (!confirmReload) return;

            await loadSettingsFromAPI();

            alert('Settings reloaded.');
        });
    }

    async function loadSettingsFromAPI() {
        const result = await PortfolioAPI.getData('settings');

        if (!result.success) {
            alert(result.message || 'Failed to load settings data.');
            return;
        }

        if (!result.data.length) {
            currentSettingsId = '';
            updateSettingsPreview();
            return;
        }

        const settings = result.data[0];

        currentSettingsId = settings.id || '';

        setAdminFieldValue(fields.websiteTitle, settings.websiteTitle);
        setAdminFieldValue(fields.logoText, settings.logoText);
        setAdminFieldValue(fields.tagline, settings.tagline);
        setAdminFieldValue(fields.footerText, settings.footerText);
        setAdminFieldValue(fields.seoTitle, settings.seoTitle);
        setAdminFieldValue(fields.seoDescription, settings.seoDescription);
        setAdminFieldValue(fields.seoKeywords, settings.seoKeywords);

        setAdminColorValue(fields.primaryColor, fields.primaryColorText, settings.primaryColor || '#7c3cff');
        setAdminColorValue(fields.secondaryColor, fields.secondaryColorText, settings.secondaryColor || '#00d4ff');
        setAdminColorValue(fields.accentColor, fields.accentColorText, settings.accentColor || '#ff6b35');

        setAdminFieldValue(fields.facebook, settings.facebook);
        setAdminFieldValue(fields.linkedin, settings.linkedin);
        setAdminFieldValue(fields.instagram, settings.instagram);
        setAdminFieldValue(fields.youtube, settings.youtube);
        setAdminFieldValue(fields.whatsapp, settings.whatsapp);
        setAdminFieldValue(fields.website, settings.website);
        setAdminFieldValue(fields.apiUrl, settings.apiUrl);

        updateSettingsPreview();
    }

    function bindColorSync() {
        syncColorPair(fields.primaryColor, fields.primaryColorText);
        syncColorPair(fields.secondaryColor, fields.secondaryColorText);
        syncColorPair(fields.accentColor, fields.accentColorText);
    }

    function syncColorPair(colorInput, textInput) {
        if (!colorInput || !textInput) return;

        colorInput.addEventListener('input', function () {
            textInput.value = colorInput.value;
            updateSettingsPreview();
        });

        textInput.addEventListener('input', function () {
            const value = textInput.value.trim();

            if (isValidAdminHexColor(value)) {
                colorInput.value = value;
            }

            updateSettingsPreview();
        });
    }

    function updateSettingsPreview() {
        const websiteTitle = getAdminFieldValue(fields.websiteTitle) || 'Digital Marketer Portfolio';
        const logoText = getAdminFieldValue(fields.logoText) || 'DM';
        const tagline = getAdminFieldValue(fields.tagline) || 'Grow your brand with data-driven marketing.';
        const footerText = getAdminFieldValue(fields.footerText) || '© 2026 Digital Marketer Portfolio. All Rights Reserved. Designed by Mahdi.';

        const primaryColor = getAdminFieldValue(fields.primaryColorText) || '#7c3cff';
        const secondaryColor = getAdminFieldValue(fields.secondaryColorText) || '#00d4ff';
        const accentColor = getAdminFieldValue(fields.accentColorText) || '#ff6b35';

        if (preview.logoIcon) {
            preview.logoIcon.textContent = logoText;
            preview.logoIcon.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
        }

        if (preview.title) preview.title.textContent = websiteTitle;
        if (preview.tagline) preview.tagline.textContent = tagline;
        if (preview.footer) preview.footer.textContent = footerText;

        if (preview.primary) {
            preview.primary.textContent = primaryColor;
            preview.primary.style.color = primaryColor;
        }

        if (preview.secondary) {
            preview.secondary.textContent = secondaryColor;
            preview.secondary.style.color = secondaryColor;
        }

        if (preview.accent) {
            preview.accent.textContent = accentColor;
            preview.accent.style.color = accentColor;
        }

        renderSettingsSocialPreview();
    }

    function renderSettingsSocialPreview() {
        if (!preview.socials) return;

        const socials = [
            { name: 'Facebook', url: getAdminFieldValue(fields.facebook) },
            { name: 'LinkedIn', url: getAdminFieldValue(fields.linkedin) },
            { name: 'Instagram', url: getAdminFieldValue(fields.instagram) },
            { name: 'YouTube', url: getAdminFieldValue(fields.youtube) },
            { name: 'WhatsApp', url: getAdminFieldValue(fields.whatsapp) },
            { name: 'Website', url: getAdminFieldValue(fields.website) }
        ];

        const activeSocials = socials.filter(function (item) {
            return item.url;
        });

        if (!activeSocials.length) {
            preview.socials.innerHTML = `
                <a href="#"><i class="fa-brands fa-facebook-f"></i><span>Facebook</span></a>
                <a href="#"><i class="fa-brands fa-linkedin-in"></i><span>LinkedIn</span></a>
                <a href="#"><i class="fa-brands fa-instagram"></i><span>Instagram</span></a>
                <a href="#"><i class="fa-brands fa-youtube"></i><span>YouTube</span></a>
            `;
            return;
        }

        preview.socials.innerHTML = activeSocials.map(function (item) {
            return `
                <a href="${escapeAdminHTML(item.url)}" target="_blank" rel="noopener">
                    ${escapeAdminHTML(item.name)}
                </a>
            `;
        }).join('');
    }
}

/* =====================================================
   COMMON HELPERS
===================================================== */

async function clearAllRecords(sheetName, dataArray, button, reloadFunction) {
    if (!dataArray.length) {
        alert('No data to clear.');
        return;
    }

    const confirmClear = confirm('Are you sure you want to delete all records?');

    if (!confirmClear) return;

    const oldText = button ? button.textContent : '';

    if (button) {
        button.textContent = 'Clearing...';
        button.disabled = true;
    }

    for (const item of dataArray) {
        await PortfolioAPI.deleteData(sheetName, item.id);
    }

    if (button) {
        button.textContent = oldText || 'Clear All';
        button.disabled = false;
    }

    await reloadFunction();

    alert('All records deleted.');
}

function bindTableActions(tableBody, editCallback, deleteCallback) {
    tableBody.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            editCallback(btn.getAttribute('data-edit'));
        });
    });

    tableBody.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            deleteCallback(btn.getAttribute('data-delete'));
        });
    });
}

function getCurrentAdminPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
}

function getInputValueById(id) {
    const input = document.getElementById(id);

    return input ? input.value.trim() : '';
}

function getAdminFieldValue(field) {
    return field ? field.value.trim() : '';
}

function setAdminFieldValue(field, value) {
    if (field) {
        field.value = value || '';
    }
}

function setAdminColorValue(colorInput, textInput, value) {
    const colorValue = isValidAdminHexColor(value) ? value : '#7c3cff';

    if (colorInput) {
        colorInput.value = colorValue;
    }

    if (textInput) {
        textInput.value = colorValue;
    }
}

function isValidAdminHexColor(value) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(String(value || '').trim());
}

function escapeAdminHTML(value) {
    if (value === 0) return '0';
    if (!value) return '';

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAdminInitial(name) {
    if (!name) return 'M';

    return String(name).charAt(0).toUpperCase();
}

function shortAdminText(text, limit) {
    if (!text) return '';

    if (text.length <= limit) return text;

    return text.slice(0, limit) + '...';
}

function formatAdminDate(dateText) {
    if (!dateText) return 'No date';

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
        return dateText;
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function sortByDateDesc(data) {
    return data.slice().sort(function (a, b) {
        return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
    });
}

function renderAdminStars(rating) {
    const total = Number(rating) || 5;
    let stars = '';

    for (let i = 1; i <= 5; i++) {
        stars += i <= total ? '★' : '☆';
    }

    return stars;
}

function setButtonLoading(button, text) {
    if (!button) return;

    button.textContent = text;
    button.disabled = true;
}

function resetButtonLoading(button, oldText) {
    if (!button) return;

    button.textContent = oldText;
    button.disabled = false;
}

function setTableLoading(tableBody, colspan, message) {
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="${colspan}">${message}</td>
        </tr>
    `;
}

function toggleEmptyState(emptyState, show) {
    if (!emptyState) return;

    emptyState.classList.toggle('show', Boolean(show));
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function buildAdminEmailReplyLink(email, name, subject) {
    if (!email) return '#';

    const replySubject = 'Re: ' + (subject || 'Your Message');

    const replyBody =
        'Hello ' + (name || '') + ',\n\n' +
        'Thank you for contacting us. I received your message and will get back to you shortly.\n\n' +
        'Best regards,\n' +
        'Digital Marketing Team';

    return (
        'https://mail.google.com/mail/?view=cm&fs=1' +
        '&to=' + encodeURIComponent(email) +
        '&su=' + encodeURIComponent(replySubject) +
        '&body=' + encodeURIComponent(replyBody)
    );
}

function buildAdminWhatsappLink(phone, name, subject) {
    const cleanPhone = String(phone || '').replace(/[^\d]/g, '');

    const text = encodeURIComponent(
        'Hello ' + (name || '') + ', I received your message about: ' + (subject || '')
    );

    if (!cleanPhone) return '#';

    return 'https://wa.me/' + cleanPhone + '?text=' + text;
}


function renderAdminSocialIcon(name) {
    const key = String(name || "").toLowerCase();
    const icons = {
        facebook: "fa-brands fa-facebook-f",
        linkedin: "fa-brands fa-linkedin-in",
        instagram: "fa-brands fa-instagram",
        youtube: "fa-brands fa-youtube",
        whatsapp: "fa-brands fa-whatsapp",
        website: "fa-solid fa-globe"
    };
    const icon = icons[key] || "fa-solid fa-link";
    return `<i class="${escapeAdminHTML(icon)}" aria-hidden="true"></i>`;
}
