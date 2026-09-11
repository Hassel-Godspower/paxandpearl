/* =====================================================
   PAX & PEARL
   CONTINUOUS HERO VIDEO SYSTEM

   Video A → Video B → Video C → Video D → Video E → A

   Uses two video elements so the next video can preload
   before the current video finishes.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const videoA = document.getElementById("ppHeroVideoA");
    const videoB = document.getElementById("ppHeroVideoB");

    if (!videoA || !videoB) return;


    /* =================================================
       VIDEO PLAYLIST

       Add/remove videos here.
    ================================================= */

    const playlist = [
        "assets/videos/hero-01.mp4",
        "assets/videos/hero-02.mp4",
        "assets/videos/hero-03.mp4",
        "assets/videos/hero-04.mp4",
        "assets/videos/hero-05.mp4"
    ];


    /* =================================================
       SETTINGS
    ================================================= */

    const FADE_DURATION = 1400;

    /*
       Start loading the next video slightly before
       the current one finishes.
    */
    const PRELOAD_BUFFER = 2;


    let currentIndex = 0;

    let activeVideo = videoA;

    let standbyVideo = videoB;

    let isTransitioning = false;


    /* =================================================
       LOAD VIDEO
    ================================================= */

    function loadVideo(video, index) {

        if (!playlist[index]) return;

        video.src = playlist[index];

        video.load();
    }


    /* =================================================
       PLAY VIDEO SAFELY
    ================================================= */

    function playVideo(video) {

        video.muted = true;

        const promise = video.play();

        if (promise !== undefined) {

            promise.catch(() => {

                /*
                 * Some browsers may delay autoplay.
                 * Because the video is muted and inline,
                 * autoplay should normally succeed.
                 */

            });

        }
    }


    /* =================================================
       GET NEXT INDEX
    ================================================= */

    function getNextIndex() {

        return (
            (currentIndex + 1) %
            playlist.length
        );

    }


    /* =================================================
       PRELOAD NEXT VIDEO
    ================================================= */

    function preloadNext() {

        const nextIndex = getNextIndex();

        loadVideo(
            standbyVideo,
            nextIndex
        );

    }


    /* =================================================
       CROSSFADE
    ================================================= */

    function transitionToNext() {

        if (isTransitioning) return;

        isTransitioning = true;


        const nextIndex = getNextIndex();


        /*
         * Make sure the next video is loaded.
         */

        loadVideo(
            standbyVideo,
            nextIndex
        );


        /*
         * Wait until enough data is available.
         */

        const startTransition = () => {

            currentIndex = nextIndex;


            /*
             * Start the next video from the beginning.
             */

            standbyVideo.currentTime = 0;

            playVideo(standbyVideo);


            /*
             * Crossfade.
             */

            standbyVideo.classList.add("is-active");

            activeVideo.classList.remove("is-active");


            /*
             * After the visual transition,
             * recycle the old video element.
             */

            setTimeout(() => {

                activeVideo.pause();

                activeVideo.removeAttribute("src");

                activeVideo.load();


                /*
                 * Swap references.
                 */

                const oldActive = activeVideo;

                activeVideo = standbyVideo;

                standbyVideo = oldActive;


                isTransitioning = false;


                /*
                 * Preload the video after the new one.
                 */

                preloadNext();

            }, FADE_DURATION);

        };


        if (standbyVideo.readyState >= 3) {

            startTransition();

        } else {

            standbyVideo.addEventListener(
                "canplay",
                startTransition,
                {
                    once: true
                }
            );

        }

    }


    /* =================================================
       INITIALIZE
    ================================================= */

    loadVideo(
        activeVideo,
        currentIndex
    );


    /*
     * Load the second video immediately.
     */

    preloadNext();


    /*
     * Start first video.
     */

    activeVideo.addEventListener(
        "canplay",
        () => {

            playVideo(activeVideo);

        },
        {
            once: true
        }
    );


    /* =================================================
       EARLY TRANSITION

       Instead of waiting for the video to completely
       finish and risking a pause, begin preparing the
       next clip near the end.
    ================================================= */

    activeVideo.addEventListener(
        "timeupdate",
        () => {

            if (!activeVideo.duration) return;


            const remaining =
                activeVideo.duration -
                activeVideo.currentTime;


            if (
                remaining <= PRELOAD_BUFFER &&
                !isTransitioning
            ) {

                transitionToNext();

            }

        }
    );


    /* =================================================
       FALLBACK

       If the browser reaches the end before the
       timeupdate transition occurs.
    ================================================= */

    activeVideo.addEventListener(
        "ended",
        () => {

            if (!isTransitioning) {

                transitionToNext();

            }

        }
    );


    /* =================================================
       HANDLE PAGE VISIBILITY

       Pause when the visitor leaves the tab and
       resume when they return.
    ================================================= */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                activeVideo.pause();

                standbyVideo.pause();

            } else {

                playVideo(activeVideo);

            }

        }
    );

});
