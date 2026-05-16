/* =====================================================
   DIGITAL MARKETER PORTFOLIO API HELPER
   Supabase Standard Version
   - Supabase Auth for admin login
   - Supabase tables for public/admin dynamic data
   - Same PortfolioAPI method names kept for existing project code
===================================================== */

'use strict';

const PortfolioAPI = {
    async getSupabaseClient() {
        return await getPortfolioSupabaseClient();
    },

    /* =====================================================
       AUTH
    ===================================================== */

    async loginAdmin(email, password) {
        try {
            const client = await getPortfolioSupabaseClient();

            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                return {
                    success: false,
                    message: error.message || 'Invalid email or password.'
                };
            }

            const session = data.session || null;
            const user = data.user || (session ? session.user : null);

            if (!user || !session) {
                return {
                    success: false,
                    message: 'Login failed. No Supabase session returned.'
                };
            }

            const admin = buildAdminSessionData(user, session);
            storeAdminSession(admin);

            return {
                success: true,
                data: admin
            };
        } catch (error) {
            console.error('Supabase login error:', error);
            return {
                success: false,
                message: 'Supabase login failed.',
                error: error.message
            };
        }
    },

    async logoutAdmin() {
        try {
            const client = await getPortfolioSupabaseClient();
            await client.auth.signOut({ scope: 'local' });
        } catch (error) {
            console.warn('Supabase signOut warning:', error);
        }

        clearAdminSession();

        return {
            success: true
        };
    },

    async requireAdminSession() {
        try {
            const client = await getPortfolioSupabaseClient();
            const { data, error } = await client.auth.getSession();

            if (error || !data || !data.session || !data.session.user) {
                clearAdminSession();
                return {
                    success: false,
                    message: 'No active Supabase admin session.'
                };
            }

            const admin = buildAdminSessionData(data.session.user, data.session);
            storeAdminSession(admin);

            return {
                success: true,
                data: admin
            };
        } catch (error) {
            clearAdminSession();
            return {
                success: false,
                message: 'Unable to verify Supabase session.',
                error: error.message
            };
        }
    },

    /* =====================================================
       PUBLIC BUNDLE
    ===================================================== */

    async getPublicBundle() {
        try {
            const [
                settingsResult,
                profileResult,
                servicesResult,
                skillsResult,
                projectsResult,
                reviewsResult,
                educationResult,
                experienceResult
            ] = await Promise.all([
                supabaseSelect('settings', { orderBy: 'createdAt', ascending: true }),
                supabaseSelect('profile', { eq: { status: 'Published' }, orderBy: 'createdAt', ascending: true }),
                supabaseSelect('services', { eq: { status: 'Published' }, orderBy: 'displayOrder', ascending: true }),
                supabaseSelect('skills', { eq: { status: 'Published' }, orderBy: 'displayOrder', ascending: true }),
                supabaseSelect('projects', { eq: { status: 'Published' }, orderBy: 'createdAt', ascending: false }),
                supabaseSelect('reviews', { eq: { status: 'Approved' }, orderBy: 'createdAt', ascending: false }),
                supabaseSelect('education', { eq: { status: 'Published' }, orderBy: 'createdAt', ascending: false }),
                supabaseSelect('experience', { eq: { status: 'Published' }, orderBy: 'createdAt', ascending: false })
            ]);

            return {
                success: true,
                data: {
                    settings: settingsResult.success ? settingsResult.data : [],
                    profile: profileResult.success ? profileResult.data : [],
                    services: servicesResult.success ? servicesResult.data : [],
                    skills: skillsResult.success ? skillsResult.data : [],
                    projects: projectsResult.success ? projectsResult.data : [],
                    reviews: reviewsResult.success ? reviewsResult.data : [],
                    education: educationResult.success ? educationResult.data : [],
                    experience: experienceResult.success ? experienceResult.data : []
                }
            };
        } catch (error) {
            console.error('Supabase public bundle error:', error);
            return {
                success: false,
                message: 'Failed to load public bundle from Supabase.',
                error: error.message
            };
        }
    },

    /* =====================================================
       COMMON READ
    ===================================================== */

    async getData(tableName) {
        if (!tableName) {
            return {
                success: false,
                message: 'Table name is required.'
            };
        }

        const order = getDefaultTableOrder(tableName);

        return await supabaseSelect(tableName, order);
    },

    async getSingle(tableName, id) {
        if (!tableName || !id) {
            return {
                success: false,
                message: 'Table name and ID are required.'
            };
        }

        try {
            const client = await getPortfolioSupabaseClient();
            let query = client.from(tableName).select('*').eq('id', id).limit(1);

            if (!isAdminPage() && tableName !== 'settings') {
                if (tableName === 'reviews') {
                    query = query.eq('status', 'Approved');
                } else if (PUBLIC_STATUS_TABLES.includes(tableName)) {
                    query = query.eq('status', 'Published');
                }
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                return {
                    success: false,
                    message: error.message,
                    error: error
                };
            }

            if (!data) {
                return {
                    success: false,
                    message: 'Data not found.'
                };
            }

            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to load single record from Supabase.',
                error: error.message
            };
        }
    },

    /* =====================================================
       COMMON CRUD
    ===================================================== */

    async addData(tableName, data) {
        if (!tableName || !data) {
            return {
                success: false,
                message: 'Table name and data are required.'
            };
        }

        const payload = prepareInsertPayload(tableName, data);

        try {
            const client = await getPortfolioSupabaseClient();
            const { data: inserted, error } = await client
                .from(tableName)
                .insert(payload)
                .select('*')
                .single();

            if (error) return supabaseErrorResult(error);

            clearSupabaseLocalCache();

            return {
                success: true,
                data: inserted,
                message: 'Data added successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Supabase insert failed.',
                error: error.message
            };
        }
    },

    async updateData(tableName, id, data) {
        if (!tableName || !id || !data) {
            return {
                success: false,
                message: 'Table name, ID, and data are required.'
            };
        }

        const payload = prepareUpdatePayload(data);

        try {
            const client = await getPortfolioSupabaseClient();
            const { data: updated, error } = await client
                .from(tableName)
                .update(payload)
                .eq('id', id)
                .select('*')
                .single();

            if (error) return supabaseErrorResult(error);

            clearSupabaseLocalCache();

            return {
                success: true,
                data: updated,
                message: 'Data updated successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Supabase update failed.',
                error: error.message
            };
        }
    },

    async deleteData(tableName, id) {
        if (!tableName || !id) {
            return {
                success: false,
                message: 'Table name and ID are required.'
            };
        }

        try {
            const client = await getPortfolioSupabaseClient();
            const { error } = await client
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) return supabaseErrorResult(error);

            clearSupabaseLocalCache();

            return {
                success: true,
                message: 'Data deleted successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Supabase delete failed.',
                error: error.message
            };
        }
    },

    /* =====================================================
       PUBLIC SUBMIT
    ===================================================== */

    async submitReview(data) {
        const payload = prepareInsertPayload('reviews', Object.assign({}, data, {
            status: 'Pending',
            featured: 'FALSE'
        }));

        try {
            const client = await getPortfolioSupabaseClient();
            const { data: inserted, error } = await client
                .from('reviews')
                .insert(payload)
                .select('*')
                .single();

            if (error) return supabaseErrorResult(error);

            return {
                success: true,
                data: inserted,
                message: 'Review submitted successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Review submit failed.',
                error: error.message
            };
        }
    },

    async submitMessage(data) {
        const payload = prepareInsertPayload('messages', Object.assign({}, data, {
            status: 'Unread'
        }));

        try {
            const client = await getPortfolioSupabaseClient();
            const { data: inserted, error } = await client
                .from('messages')
                .insert(payload)
                .select('*')
                .single();

            if (error) return supabaseErrorResult(error);

            return {
                success: true,
                data: inserted,
                message: 'Message submitted successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Message submit failed.',
                error: error.message
            };
        }
    },

    /* =====================================================
       STATUS UPDATE
    ===================================================== */

    async updateMessageStatus(id, status) {
        return await this.updateData('messages', id, { status: status });
    },

    async updateReviewStatus(id, status) {
        return await this.updateData('reviews', id, { status: status });
    },

    /* =====================================================
       PUBLIC FILTER HELPERS
    ===================================================== */

    async getPublishedData(tableName) {
        return await supabaseSelect(tableName, {
            eq: { status: 'Published' },
            orderBy: getDefaultOrderColumn(tableName),
            ascending: shouldSortAscending(tableName)
        });
    },

    async getApprovedReviews() {
        return await supabaseSelect('reviews', {
            eq: { status: 'Approved' },
            orderBy: 'createdAt',
            ascending: false
        });
    },

    async getFeaturedProjects() {
        return await supabaseSelect('projects', {
            eq: {
                status: 'Published',
                featured: 'TRUE'
            },
            orderBy: 'createdAt',
            ascending: false
        });
    }
};

/* =====================================================
   SUPABASE CLIENT
===================================================== */

let __portfolioSupabaseClient = null;
let __supabaseScriptPromise = null;

async function getPortfolioSupabaseClient() {
    if (__portfolioSupabaseClient) return __portfolioSupabaseClient;

    validateSupabaseConfig();

    await ensureSupabaseScriptLoaded();

    if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase JS client was not loaded. Check the Supabase CDN script.');
    }

    __portfolioSupabaseClient = window.supabase.createClient(
        APP_CONFIG.SUPABASE_URL,
        APP_CONFIG.SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

    return __portfolioSupabaseClient;
}

function validateSupabaseConfig() {
    if (typeof APP_CONFIG === 'undefined') {
        throw new Error('APP_CONFIG is missing. Please check assets/js/config.js');
    }

    if (!APP_CONFIG.SUPABASE_URL || APP_CONFIG.SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_URL')) {
        throw new Error('SUPABASE_URL is missing in assets/js/config.js');
    }

    if (!APP_CONFIG.SUPABASE_ANON_KEY || APP_CONFIG.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
        throw new Error('SUPABASE_ANON_KEY is missing in assets/js/config.js');
    }
}

function ensureSupabaseScriptLoaded() {
    if (window.supabase && window.supabase.createClient) {
        return Promise.resolve();
    }

    if (__supabaseScriptPromise) {
        return __supabaseScriptPromise;
    }

    __supabaseScriptPromise = new Promise(function (resolve, reject) {
        const existingScript = document.querySelector('script[data-supabase-js="true"]');

        if (existingScript) {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-supabase-js', 'true');
        script.onload = resolve;
        script.onerror = function () {
            reject(new Error('Failed to load Supabase JS CDN.'));
        };
        document.head.appendChild(script);
    });

    return __supabaseScriptPromise;
}

/* =====================================================
   SUPABASE QUERY HELPERS
===================================================== */

const PUBLIC_STATUS_TABLES = ['profile', 'education', 'experience', 'services', 'skills', 'projects'];

async function supabaseSelect(tableName, options = {}) {
    try {
        const client = await getPortfolioSupabaseClient();
        let query = client.from(tableName).select('*');

        if (options.eq) {
            Object.keys(options.eq).forEach(function (key) {
                const value = options.eq[key];
                if (value !== undefined && value !== null && value !== '') {
                    query = query.eq(key, value);
                }
            });
        }

        if (options.orderBy) {
            query = query.order(options.orderBy, {
                ascending: options.ascending !== false
            });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) return supabaseErrorResult(error);

        return {
            success: true,
            data: data || []
        };
    } catch (error) {
        return {
            success: false,
            message: 'Supabase select failed for ' + tableName + '.',
            error: error.message
        };
    }
}

function prepareInsertPayload(tableName, data) {
    const payload = Object.assign({}, data || {});

    if (!payload.id) {
        payload.id = generatePortfolioId(tableName);
    }

    if (!payload.createdAt) {
        payload.createdAt = new Date().toISOString();
    }

    payload.updatedAt = new Date().toISOString();

    return normalizePayloadForSupabase(payload);
}

function prepareUpdatePayload(data) {
    const payload = Object.assign({}, data || {});
    delete payload.id;
    delete payload.createdAt;
    payload.updatedAt = new Date().toISOString();

    return normalizePayloadForSupabase(payload);
}

function normalizePayloadForSupabase(payload) {
    const cloned = Object.assign({}, payload || {});

    Object.keys(cloned).forEach(function (key) {
        if (cloned[key] === undefined) {
            delete cloned[key];
        }
    });

    return cloned;
}

function generatePortfolioId(tableName) {
    const prefixes = {
        profile: 'PROF',
        settings: 'SET',
        education: 'EDU',
        experience: 'EXP',
        services: 'SRV',
        skills: 'SKL',
        projects: 'PRJ',
        reviews: 'REV',
        messages: 'MSG'
    };

    const prefix = prefixes[tableName] || 'ROW';
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();

    return prefix + Date.now().toString().slice(-7) + random;
}

function getDefaultTableOrder(tableName) {
    return {
        orderBy: getDefaultOrderColumn(tableName),
        ascending: shouldSortAscending(tableName)
    };
}

function getDefaultOrderColumn(tableName) {
    if (tableName === 'services' || tableName === 'skills') return 'displayOrder';
    if (tableName === 'settings') return 'createdAt';
    return 'createdAt';
}

function shouldSortAscending(tableName) {
    return tableName === 'services' || tableName === 'skills' || tableName === 'settings';
}

function supabaseErrorResult(error) {
    console.error('Supabase Error:', error);

    if (isAdminPage() && isAuthOrRlsError(error)) {
        clearAdminSessionAndRedirect();
    }

    return {
        success: false,
        message: error.message || 'Supabase request failed.',
        error: error
    };
}

function isAuthOrRlsError(error) {
    const message = String(error.message || '').toLowerCase();
    const code = String(error.code || '').toLowerCase();

    return code === '42501' || message.includes('row-level security') || message.includes('permission denied') || message.includes('jwt');
}

/* =====================================================
   SESSION STORAGE HELPERS
===================================================== */

function buildAdminSessionData(user, session) {
    const metadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    const email = user.email || '';
    const fallbackName = email ? email.split('@')[0] : 'Admin';

    return {
        id: user.id || '',
        name: metadata.name || metadata.full_name || fallbackName,
        email: email,
        role: appMetadata.role || metadata.role || 'Admin',
        adminToken: session ? session.access_token || '' : ''
    };
}

function storeAdminSession(admin) {
    try {
        localStorage.setItem('dm_admin_logged_in', 'true');
        localStorage.setItem('dm_admin_id', admin.id || '');
        localStorage.setItem('dm_admin_name', admin.name || 'Admin');
        localStorage.setItem('dm_admin_email', admin.email || '');
        localStorage.setItem('dm_admin_role', admin.role || 'Admin');
        localStorage.setItem('dm_admin_token', admin.adminToken || '');
    } catch (error) {
        // Ignore localStorage errors.
    }
}

function clearAdminSession() {
    try {
        localStorage.removeItem('dm_admin_logged_in');
        localStorage.removeItem('dm_admin_id');
        localStorage.removeItem('dm_admin_name');
        localStorage.removeItem('dm_admin_email');
        localStorage.removeItem('dm_admin_role');
        localStorage.removeItem('dm_admin_token');
    } catch (error) {
        // Ignore localStorage errors.
    }
}

function clearAdminSessionAndRedirect() {
    clearAdminSession();

    if (!window.__DM_AUTH_REDIRECTING__) {
        window.__DM_AUTH_REDIRECTING__ = true;
        alert('Your admin session expired or you do not have permission. Please login again.');
        window.location.href = 'login.html';
    }
}

function clearSupabaseLocalCache() {
    try {
        Object.keys(localStorage).forEach(function (key) {
            if (key.startsWith('dm_api_cache_')) {
                localStorage.removeItem(key);
            }
        });

        Object.keys(sessionStorage).forEach(function (key) {
            if (key.startsWith('dm_api_cache_')) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (error) {
        // Ignore cache errors.
    }
}

function isAdminPage() {
    return window.location.pathname.includes('/admin/') || window.location.pathname.includes('\\admin\\');
}

/* =====================================================
   LEGACY COMPATIBILITY HELPERS
===================================================== */

function parseApiResponse(text) {
    try {
        return JSON.parse(text);
    } catch (error) {
        return {
            success: false,
            message: 'Invalid JSON response.',
            rawResponse: text
        };
    }
}

function cloneApiData(value) {
    return JSON.parse(JSON.stringify(value));
}

function apiText(value, fallback = '') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
}

function apiBoolean(value) {
    return String(value).toUpperCase() === 'TRUE';
}

function apiSplit(value) {
    if (!value) return [];

    return String(value)
        .split(',')
        .map(function (item) {
            return item.trim();
        })
        .filter(Boolean);
}

function apiEscapeHTML(value) {
    if (value === 0) return '0';
    if (!value) return '';

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
