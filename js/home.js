/* =========================================================
   PAX & PEARL BODY WORKS
   HOMEPAGE JAVASCRIPT
========================================================= */


/* =========================================================
   POST SLIDER
========================================================= */

(() => {

    const track = document.getElementById("postSlider");

    if (!track) return;

    const slides = Array.from(track.children);

    const prev = document.getElementById("prevSlide");

    const next = document.getElementById("nextSlide");

    let index = 0;

    let autoTimer = null;


    function slidesPerView() {

        return window.innerWidth >= 768
            ? 2
            : 1;

    }


    function maxIndex() {

        return Math.max(
            0,
            slides.length - slidesPerView()
        );

    }


    function slideWidth() {

        if (!slides[0]) return 0;

        return slides[0]
            .getBoundingClientRect()
            .width;

    }


    function updateSlider(animate = true) {

        const width = slideWidth();

        track.style.transition =
            animate
                ? "transform .45s ease"
                : "none";

        track.style.transform =
            `translateX(-${index * width}px)`;

    }


    next?.addEventListener("click", () => {

        index =
            Math.min(
                index + 1,
                maxIndex()
            );

        updateSlider();

        resetAuto();

    });


    prev?.addEventListener("click", () => {

        index =
            Math.max(
                index - 1,
                0
            );

        updateSlider();

        resetAuto();

    });


    function startAuto() {

        stopAuto();

        autoTimer =
            setInterval(() => {

                index =
                    index >= maxIndex()
                        ? 0
                        : index + 1;

                updateSlider();

            }, 5000);

    }


    function stopAuto() {

        if (autoTimer) {

            clearInterval(autoTimer);

            autoTimer = null;

        }

    }


    function resetAuto() {

        stopAuto();

        startAuto();

    }


    track.addEventListener(
        "mouseenter",
        stopAuto
    );


    track.addEventListener(
        "mouseleave",
        startAuto
    );


    let startX = 0;

    let currentX = 0;

    let isDragging = false;


    track.addEventListener(
        "touchstart",
        e => {

            startX =
                e.touches[0].clientX;

            currentX = startX;

            isDragging = true;

            stopAuto();

            track.style.transition =
                "none";

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "touchmove",
        e => {

            if (!isDragging) return;

            currentX =
                e.touches[0].clientX;

            const diff =
                startX - currentX;

            track.style.transform =
                `translateX(-${index * slideWidth() + diff}px)`;

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "touchend",
        () => {

            if (!isDragging) return;

            isDragging = false;

            const diff =
                startX - currentX;

            const threshold =
                slideWidth() * 0.25;


            if (diff > threshold) {

                index =
                    Math.min(
                        index + 1,
                        maxIndex()
                    );

            }


            if (diff < -threshold) {

                index =
                    Math.max(
                        index - 1,
                        0
                    );

            }


            updateSlider();

            startAuto();

        }
    );


    window.addEventListener(
        "resize",
        () => {

            index =
                Math.min(
                    index,
                    maxIndex()
                );

            updateSlider(false);

        }
    );


    updateSlider(false);

    startAuto();

})();


/* =========================================================
   GOOGLE REVIEWS MODAL
========================================================= */

function openReviewsModal() {

    const modal =
        document.getElementById(
            "reviewsModal"
        );

    if (!modal) return;

    modal.style.display = "block";

    document.body.style.overflow =
        "hidden";

}


function closeReviewsModal() {

    const modal =
        document.getElementById(
            "reviewsModal"
        );

    if (!modal) return;

    modal.style.display = "none";

    document.body.style.overflow =
        "";

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const openButton =
            document.getElementById(
                "openReviews"
            );

        if (openButton) {

            openButton.addEventListener(
                "click",
                openReviewsModal
            );

        }


        const closeButtons =
            document.querySelectorAll(
                "[data-close-reviews]"
            );

        closeButtons.forEach(button => {

            button.addEventListener(
                "click",
                closeReviewsModal
            );

        });

    }
);


/* =========================================================
   ADMIN WHATSAPP
========================================================= */

(function bindAdminWhatsAppFromCatalog() {

    const msgBtn =
        document.getElementById(
            "messageAdmin"
        );

    if (!msgBtn) return;


    fetch("/catalog1.json")

        .then(res => {

            if (!res.ok) {

                throw new Error(
                    "Catalog not found"
                );

            }

            return res.json();

        })

        .then(data => {

            const phone =
                data?.admin?.whatsapp;

            if (!phone) {

                throw new Error(
                    "Admin WhatsApp missing"
                );

            }


            const cleanPhone =
                phone.replace(
                    /\D/g,
                    ""
                );


            msgBtn.href =
                `https://wa.me/${cleanPhone}`;

            msgBtn.target =
                "_blank";

            msgBtn.rel =
                "noopener noreferrer";

        })

        .catch(() => {

            msgBtn.href = "#";


            msgBtn.addEventListener(
                "click",
                e => {

                    e.preventDefault();

                    alert(
                        "Admin WhatsApp not available yet."
                    );

                }
            );

        });

})();


/* =========================================================
   PERSONAL GREETING
========================================================= */

(() => {

    let profile = {};

    try {

        profile =
            JSON.parse(
                localStorage.getItem(
                    "userProfile"
                ) || "{}"
            );

    } catch (error) {

        profile = {};

    }


    const userName =
        document.getElementById(
            "user-name"
        );


    if (userName) {

        if (profile.name) {

            userName.textContent =
                `Hello ${profile.name} 👋`;

        } else {

            userName.textContent =
                "Hello 👋";

        }

    }


    function setGreetingWAT() {

        const timeGreetingEl =
            document.getElementById(
                "time-greeting"
            );

        if (!timeGreetingEl) return;


        const now =
            new Date();


        const options = {

            hour: "numeric",

            hour12: false,

            timeZone: "Africa/Lagos"

        };


        const hour =
            parseInt(
                new Intl.DateTimeFormat(
                    "en-US",
                    options
                ).format(now),
                10
            );


        let greetingText = "";


        if (
            hour >= 0 &&
            hour < 12
        ) {

            greetingText =
                "Good Morning ☀️";

        }

        else if (
            hour >= 12 &&
            hour <= 15
        ) {

            greetingText =
                "Good Afternoon ☀️";

        }

        else {

            greetingText =
                "Good Evening 🌙";

        }


        timeGreetingEl.textContent =
            greetingText;

    }


    setGreetingWAT();

})();


/* =========================================================
   SIGN-UP MODAL
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const MODAL_DELAY =
            20 * 1000;


        const modal =
            document.getElementById(
                "signupModal"
            );


        const acceptBtn =
            document.getElementById(
                "acceptSignup"
            );


        const dismissBtn =
            document.getElementById(
                "dismissSignup"
            );


        if (
            !modal ||
            !acceptBtn ||
            !dismissBtn
        ) return;


        const timer =
            setTimeout(
                () => {

                    modal.classList.add(
                        "show"
                    );

                },
                MODAL_DELAY
            );


        acceptBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html";

            }
        );


        dismissBtn.addEventListener(
            "click",
            () => {

                modal.classList.remove(
                    "show"
                );

                clearTimeout(timer);

            }
        );

    }
);


/* =========================================================
   PRELOADER
========================================================= */

window.addEventListener(
    "load",
    () => {

        const preloader =
            document.getElementById(
                "preloader"
            );


        if (!preloader) return;


        setTimeout(
            () => {

                preloader.classList.add(
                    "hide"
                );


                setTimeout(
                    () => {

                        preloader.style.display =
                            "none";

                    },
                    500
                );

            },
            1200
        );

    }
);


/* =========================================================
   SERVICE WORKER
========================================================= */

if (
    "serviceWorker"
    in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )

                .then(reg => {

                    console.log(
                        "Service Worker Registered",
                        reg
                    );

                })

                .catch(err => {

                    console.log(
                        "Service Worker Registration Error:",
                        err
                    );

                });

        }
    );

}


/* =========================================================
   PWA INSTALL LOGIC
========================================================= */

let deferredPrompt = null;


const ua =
    window.navigator.userAgent
        .toLowerCase();


const isIOS =
    /iphone|ipad|ipod/.test(ua);


const isSafari =
    isIOS &&
    ua.includes("safari") &&
    !ua.includes("crios") &&
    !ua.includes("fxios");


const isStandalone =
    window.matchMedia(
        "(display-mode: standalone)"
    ).matches ||
    window.navigator.standalone === true;


const iosModal =
    document.getElementById(
        "iosInstallModal"
    );


const closeIOS =
    document.getElementById(
        "closeIOSInstall"
    );


function showIOSInstallModal() {

    if (
        iosModal &&
        !isStandalone
    ) {

        iosModal.style.display =
            "flex";

    }

}


if (
    isSafari &&
    !isStandalone &&
    iosModal
) {

    setTimeout(
        showIOSInstallModal,
        2600
    );

}


window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                if (
                    isIOS &&
                    !isStandalone
                ) {

                    showIOSInstallModal();

                }

            },
            2600
        );

    }
);


closeIOS?.addEventListener(
    "click",
    () => {

        if (iosModal) {

            iosModal.style.display =
                "none";

        }

    }
);


/* =========================================================
   ANDROID / CHROMIUM PWA INSTALL
========================================================= */

window.addEventListener(
    "beforeinstallprompt",
    e => {

        e.preventDefault();

        deferredPrompt = e;


        const banner =
            document.getElementById(
                "installBanner"
            );


        if (banner) {

            banner.style.display =
                "block";

        }

    }
);


const installBtn =
    document.getElementById(
        "installApp"
    );


if (installBtn) {

    installBtn.addEventListener(
        "click",
        async () => {

            if (!deferredPrompt) return;


            deferredPrompt.prompt();


            try {

                await deferredPrompt.userChoice;

            } catch (error) {

                console.log(
                    "Install prompt error:",
                    error
                );

            }


            deferredPrompt = null;


            const banner =
                document.getElementById(
                    "installBanner"
                );


            if (banner) {

                banner.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   PWA INSTALL STATE
========================================================= */

window.addEventListener(
    "appinstalled",
    () => {

        deferredPrompt = null;


        const banner =
            document.getElementById(
                "installBanner"
            );


        if (banner) {

            banner.style.display =
                "none";

        }

        console.log(
            "Pax & Pearl installed."
        );

    }
);
