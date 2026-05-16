/* =====================================================
   DIGITAL MARKETER PORTFOLIO MAIN JS
   Public layout only
   Dynamic data/form submit is handled by public-data.js
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    includeComponents();
    initReviewStarRatingOnly();
});

/* =====================================================
   COMPONENT INCLUDE
===================================================== */

async function includeComponents() {
    const includeElements = document.querySelectorAll("[data-include]");

    for (const element of includeElements) {
        const file = element.getAttribute("data-include");

        try {
            const response = await fetch(file);
            const html = await response.text();
            element.innerHTML = html;
        } catch (error) {
            console.error("Component loading failed:", file, error);
        }
    }

    window.__PUBLIC_COMPONENTS_LOADED__ = true;
    document.dispatchEvent(new CustomEvent("publicComponentsLoaded"));

    initPublicLayout();
}

/* =====================================================
   PUBLIC LAYOUT
===================================================== */

function initPublicLayout() {
    const header = document.getElementById("siteHeader");
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    const backToTop = document.getElementById("backToTop");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", function () {
            menuToggle.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.addEventListener("click", function (event) {
            const isClickInsideMenu = navMenu.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);

            if (!isClickInsideMenu && !isClickOnToggle) {
                menuToggle.classList.remove("active");
                navMenu.classList.remove("active");
            }
        });

        navMenu.querySelectorAll(".nav-link").forEach(function (link) {
            link.addEventListener("click", function () {
                menuToggle.classList.remove("active");
                navMenu.classList.remove("active");
            });
        });
    }

    setActiveNavLink();

    window.addEventListener("scroll", function () {
        if (header) {
            header.classList.toggle("scrolled", window.scrollY > 40);
        }

        if (backToTop) {
            backToTop.classList.toggle("show", window.scrollY > 500);
        }
    });

    if (backToTop) {
        backToTop.addEventListener("click", function () {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    initRevealAnimation();
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(function (link) {
        const href = link.getAttribute("href") || "";
        const linkPage = href.split("/").pop();

        link.classList.toggle("active", linkPage === currentPage);
    });
}

function initRevealAnimation() {
    const revealElements = document.querySelectorAll(".reveal");

    if (!revealElements.length) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, {
        threshold: 0.12
    });

    revealElements.forEach(function (element) {
        observer.observe(element);
    });
}

/* =====================================================
   REVIEW STAR UI ONLY
   Form submit is handled by public-data.js
===================================================== */

function initReviewStarRatingOnly() {
    const ratingButtons = document.querySelectorAll("#starRatingInput button");
    const ratingInput = document.getElementById("reviewRating");

    if (!ratingButtons.length || !ratingInput) return;

    let selectedRating = Number(ratingInput.value) || 5;

    function updateStars(rating) {
        ratingButtons.forEach(function (button) {
            const buttonRating = Number(button.getAttribute("data-rating"));
            button.classList.toggle("active", buttonRating <= rating);
        });
    }

    updateStars(selectedRating);

    ratingButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectedRating = Number(button.getAttribute("data-rating")) || 5;
            ratingInput.value = selectedRating;
            updateStars(selectedRating);
        });
    });
}
