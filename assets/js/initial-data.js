/* =====================================================
   DIGITAL MARKETER PORTFOLIO INITIAL PUBLIC DATA
   Database-only mode: no sample/static data is stored here.
   Public pages load content only from Google Sheet/Admin API.
===================================================== */

(function () {
    window.INITIAL_PUBLIC_DATA = {
        success: true,
        source: "database-only-empty-initial-data",
        generatedAt: new Date().toISOString(),
        data: {
            settings: [],
            profile: [],
            services: [],
            skills: [],
            projects: [],
            reviews: [],
            education: [],
            experience: []
        }
    };

    try {
        const keysToRemove = [
            "dm_api_cache_public_bundle_v2",
            "dm_api_cache_public_bundle_v3",
            "dm_api_cache_public_bundle_v4_social_fix",
            "dm_api_cache_public_bundle_database_only_v1",
            "dm_api_cache_public_bundle_db_only_v2",
            "dm_api_cache_public_bundle_db_only_skills_v1",
            "dm_api_cache_sheet:settings",
            "dm_api_cache_sheet:profile",
            "dm_api_cache_sheet:services",
            "dm_api_cache_sheet:skills",
            "dm_api_cache_sheet:projects",
            "dm_api_cache_sheet:reviews",
            "dm_api_cache_sheet:education",
            "dm_api_cache_sheet:experience"
        ];

        keysToRemove.forEach(function (key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    } catch (error) {
        /* Ignore storage errors. */
    }
})();
