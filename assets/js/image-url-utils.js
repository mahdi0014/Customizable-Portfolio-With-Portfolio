/* =====================================================
   GOOGLE DRIVE IMAGE URL SUPPORT
   Supports common Google Drive image URL formats and
   converts them into direct thumbnail URLs for <img> tags.
===================================================== */

(function () {
    "use strict";

    const DRIVE_THUMB_SIZE = 1600;

    function normalizeImageUrl(url, size) {
        if (!url) return "";

        const value = String(url).trim();

        if (!value) return "";

        // Keep already-direct safe image/data/blob URLs unchanged.
        if (
            value.startsWith("data:image/") ||
            value.startsWith("blob:") ||
            value.startsWith("./") ||
            value.startsWith("../") ||
            value.startsWith("/")
        ) {
            return value;
        }

        const fileId = getGoogleDriveFileId(value);

        if (fileId) {
            return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w" + (size || DRIVE_THUMB_SIZE);
        }

        return value;
    }

    function getGoogleDriveFileId(input) {
        if (!input) return "";

        const value = String(input).trim();

        // Bare Google Drive file ID pasted directly.
        if (/^[a-zA-Z0-9_-]{20,}$/.test(value) && !value.includes(".") && !value.includes("/")) {
            return value;
        }

        const patterns = [
            // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
            /drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i,

            // https://drive.google.com/open?id=FILE_ID
            /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,

            // https://drive.google.com/uc?id=FILE_ID
            // https://drive.google.com/uc?export=view&id=FILE_ID
            /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,

            // https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
            /drive\.google\.com\/thumbnail\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,

            // https://drive.google.com/download?id=FILE_ID
            /drive\.google\.com\/download\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,

            // https://drive.usercontent.google.com/download?id=FILE_ID&export=view
            /drive\.usercontent\.google\.com\/(?:download|uc)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,

            // https://lh3.googleusercontent.com/d/FILE_ID
            /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,

            // Generic /d/FILE_ID pattern fallback.
            /\/d\/([a-zA-Z0-9_-]{20,})/i,

            // Generic ?id=FILE_ID pattern fallback.
            /[?&]id=([a-zA-Z0-9_-]{20,})/i
        ];

        for (const pattern of patterns) {
            const match = value.match(pattern);

            if (match && match[1]) {
                return match[1];
            }
        }

        try {
            const parsedUrl = new URL(value);
            const id = parsedUrl.searchParams.get("id");

            if (id && /^[a-zA-Z0-9_-]{20,}$/.test(id)) {
                return id;
            }
        } catch (error) {
            // Not a valid absolute URL. Ignore.
        }

        return "";
    }

    function normalizeImageElement(img) {
        if (!img || img.tagName !== "IMG") return;

        const currentSrc = img.getAttribute("src") || "";
        const normalizedSrc = normalizeImageUrl(currentSrc);

        if (normalizedSrc && currentSrc !== normalizedSrc) {
            img.setAttribute("src", normalizedSrc);
        }
    }

    function normalizeAllImageElements(root) {
        const container = root || document;

        if (container.tagName === "IMG") {
            normalizeImageElement(container);
            return;
        }

        const images = container.querySelectorAll ? container.querySelectorAll("img") : [];

        images.forEach(normalizeImageElement);
    }

    function observeImageChanges() {
        if (!document.documentElement || typeof MutationObserver === "undefined") return;

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "src") {
                    normalizeImageElement(mutation.target);
                    return;
                }

                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;

                    normalizeAllImageElements(node);
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src"]
        });
    }

    // Expose globally for admin.js/public-data.js if needed.
    window.getGoogleDriveFileId = getGoogleDriveFileId;
    window.normalizeImageUrl = normalizeImageUrl;
    window.normalizePublicImageUrl = normalizeImageUrl;
    window.normalizeAdminImageUrl = normalizeImageUrl;
    window.normalizeAllImageElements = normalizeAllImageElements;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            normalizeAllImageElements(document);
            observeImageChanges();
        });
    } else {
        normalizeAllImageElements(document);
        observeImageChanges();
    }
})();
