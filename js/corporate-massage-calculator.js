/* =========================================================
   PAX & PEARL BODY WORKS
   CORPORATE MASSAGE CALCULATOR
   ---------------------------------------------------------
   Features:
   - Instant corporate wellness calculation
   - WhatsApp corporate request
   - HTML → PDF download via html2pdf.js
   - Local browser save
   - Native browser print / Save as PDF
   - Accessible modal behaviour
   - Onsite location validation
   - Mobile-friendly operation
========================================================= */

(function () {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const CONFIG = {

        /* Corporate pricing per employee */
        prices: {
            20: 15000,
            30: 20000,
            60: 35000
        },

        /* Program discounts */
        discounts: {
            monthly: 0.10,
            biannual: 0.05,
            annual: 0.03
        },

        /* Number of sessions per year */
        sessionsPerYear: {
            monthly: 12,
            biannual: 2,
            annual: 1
        },

        /* Display labels */
        frequencyLabels: {
            monthly: "Monthly",
            biannual: "Bi-annual",
            annual: "Annual"
        },

        serviceLabels: {
            onsite: "On-site",
            spa: "Spa Visit"
        },

        durationLabels: {
            20: "20 Minutes",
            30: "30 Minutes",
            60: "60 Minutes"
        },

        /* WhatsApp number */
        whatsappNumber: "2347064302016",

        /* Local storage key */
        storageKey: "paxPearlCorporateEstimate",

        /* PDF filename prefix */
        pdfPrefix: "Pax-and-Pearl-Corporate-Wellness-Estimate",

        /* Minimum corporate team size */
        minimumEmployees: 10

    };


    /* =====================================================
       DOM READY
    ===================================================== */

    document.addEventListener("DOMContentLoaded", function () {

        const modal =
            document.querySelector("[data-corporate-calculator-modal]");

        if (!modal) {
            return;
        }

        initialiseCorporateCalculator(modal);

    });


    /* =====================================================
       MAIN INITIALISATION
    ===================================================== */

    function initialiseCorporateCalculator(modal) {

        const form =
            modal.querySelector("[data-corporate-form]");

        if (!form) {
            console.warn(
                "Pax & Pearl Corporate Calculator: form not found."
            );
            return;
        }


        /* -------------------------------------------------
           FORM ELEMENTS
        ------------------------------------------------- */

        const companyInput =
            document.getElementById("corporate-company-name");

        const emailInput =
            document.getElementById("corporate-email");

        const employeesInput =
            document.getElementById("corporate-employees");

        const locationInput =
            document.getElementById("corporate-location");


        /* -------------------------------------------------
           BUTTONS
        ------------------------------------------------- */

        const submitButton =
            modal.querySelector("[data-submit-corporate]");

        const downloadButton =
            modal.querySelector("[data-download-pdf]");

        const printButton =
            modal.querySelector("[data-print-calculation]");

        let saveButton =
            modal.querySelector("[data-save-calculation]");


        /* -------------------------------------------------
           STATUS
        ------------------------------------------------- */

        const submitMessage =
            modal.querySelector("[data-submit-message]");


        /* -------------------------------------------------
           SUMMARY ELEMENTS
        ------------------------------------------------- */

        const summaryCompany =
            modal.querySelector("[data-summary-company]");

        const summaryEmployees =
            modal.querySelector("[data-summary-employees]");

        const summaryFrequency =
            modal.querySelector("[data-summary-frequency]");

        const summaryService =
            modal.querySelector("[data-summary-service]");

        const summaryDuration =
            modal.querySelector("[data-summary-duration]");

        const summaryBase =
            modal.querySelector("[data-summary-base]");

        const summaryDiscount =
            modal.querySelector("[data-summary-discount]");

        const summaryDiscountAmount =
            modal.querySelector("[data-summary-discount-amount]");

        const summaryTotal =
            modal.querySelector("[data-summary-total]");

        const summaryAnnualLabel =
            modal.querySelector("[data-summary-annual-label]");

        const summaryAnnual =
            modal.querySelector("[data-summary-annual]");

        const locationNotice =
            modal.querySelector("[data-location-notice]");


        /* -------------------------------------------------
           CURRENT CALCULATION
        ------------------------------------------------- */

        let currentEstimate = null;

        let lastFocusedElement = null;


        /* =================================================
           CREATE SAVE BUTTON IF MISSING
        ================================================= */

        if (!saveButton) {

            const actions =
                modal.querySelector(".corporate-calculator-actions");

            if (actions) {

                saveButton =
                    document.createElement("button");

                saveButton.type = "button";

                saveButton.className =
                    "corporate-action-button secondary";

                saveButton.setAttribute(
                    "data-save-calculation",
                    ""
                );

                saveButton.disabled = true;

                saveButton.innerHTML =
                    '<span aria-hidden="true">💾</span> Save Estimate';

                actions.insertBefore(
                    saveButton,
                    actions.firstChild
                );

            }

        }


        /* =================================================
           MODAL OPEN / CLOSE
        ================================================= */

        const openTriggers =
            document.querySelectorAll(
                "[data-corporate-calculator-open]"
            );

        const closeTriggers =
            modal.querySelectorAll(
                "[data-corporate-calculator-close]"
            );


        function openModal(trigger) {

            lastFocusedElement = trigger || document.activeElement;

            modal.classList.add("is-open");

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "corporate-calculator-open"
            );

            /*
             * Prevent the page behind the calculator
             * from scrolling.
             */
            document.body.style.overflow = "hidden";

            /*
             * Restore previously saved estimate
             * when the calculator is opened.
             */
            restoreSavedEstimate();

            /*
             * Give the modal a moment to render before
             * moving focus.
             */
            window.setTimeout(function () {

                const firstInput =
                    modal.querySelector(
                        "input:not([disabled]), select:not([disabled]), button:not([disabled])"
                    );

                if (firstInput) {
                    firstInput.focus();
                }

            }, 50);
        }


        function closeModal() {

            modal.classList.remove("is-open");

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "corporate-calculator-open"
            );

            document.body.style.overflow = "";

            if (
                lastFocusedElement &&
                typeof lastFocusedElement.focus === "function"
            ) {
                lastFocusedElement.focus();
            }
        }


        openTriggers.forEach(function (trigger) {

            trigger.addEventListener(
                "click",
                function () {
                    openModal(trigger);
                }
            );

        });


        closeTriggers.forEach(function (button) {

            button.addEventListener(
                "click",
                closeModal
            );

        });


        /*
         * Close if the modal backdrop itself is clicked.
         */
        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal ||
                    event.target.matches(
                        "[data-corporate-calculator-backdrop]"
                    )
                ) {
                    closeModal();
                }

            }
        );


        /*
         * Escape key.
         */
        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    modal.classList.contains("is-open")
                ) {
                    closeModal();
                }

            }
        );


        /* =================================================
           RADIO GROUPS
        ================================================= */

        const frequencyInputs =
            form.querySelectorAll(
                'input[name="corporate-frequency"]'
            );

        const serviceInputs =
            form.querySelectorAll(
                'input[name="corporate-service"]'
            );

        const durationInputs =
            form.querySelectorAll(
                'input[name="corporate-duration"]'
            );


        /* =================================================
           GENERAL INPUT EVENTS
        ================================================= */

        const allInputs =
            form.querySelectorAll("input");

        allInputs.forEach(function (input) {

            input.addEventListener(
                "input",
                updateCalculator
            );

            input.addEventListener(
                "change",
                updateCalculator
            );

        });


        frequencyInputs.forEach(function (input) {

            input.addEventListener(
                "change",
                updateCalculator
            );

        });


        serviceInputs.forEach(function (input) {

            input.addEventListener(
                "change",
                updateCalculator
            );

        });


        durationInputs.forEach(function (input) {

            input.addEventListener(
                "change",
                updateCalculator
            );

        });


        /* =================================================
           INITIAL STATE
        ================================================= */

        updateCalculator();


        /* =================================================
           FORM SUBMISSION
        ================================================= */

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const estimate =
                    calculateEstimate();

                if (!estimate.valid) {

                    showSubmitMessage(
                        estimate.message,
                        "error"
                    );

                    return;
                }

                currentEstimate = estimate;

                requestCorporateProgram(
                    estimate
                );

            }
        );


        /* =================================================
           DOWNLOAD PDF
        ================================================= */

        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                async function () {

                    if (!currentEstimate) {

                        showSubmitMessage(
                            "Complete the calculator before downloading the estimate.",
                            "error"
                        );

                        return;
                    }

                    await downloadEstimatePDF(
                        currentEstimate
                    );

                }
            );

        }


        /* =================================================
           SAVE ESTIMATE
        ================================================= */

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                function () {

                    if (!currentEstimate) {

                        showSubmitMessage(
                            "Complete the calculator before saving the estimate.",
                            "error"
                        );

                        return;
                    }

                    saveEstimate(
                        currentEstimate
                    );

                }
            );

        }


        /* =================================================
           PRINT / SAVE AS PDF
        ================================================= */

        if (printButton) {

            printButton.addEventListener(
                "click",
                function () {

                    if (!currentEstimate) {

                        showSubmitMessage(
                            "Complete the calculator before printing the estimate.",
                            "error"
                        );

                        return;
                    }

                    printEstimate(
                        currentEstimate
                    );

                }
            );

        }


        /* =================================================
           UPDATE CALCULATOR
        ================================================= */

        function updateCalculator() {

            const estimate =
                calculateEstimate();

            currentEstimate =
                estimate.valid
                    ? estimate
                    : null;


            /* ---------------------------------------------
               SUMMARY
            --------------------------------------------- */

            if (summaryCompany) {

                summaryCompany.textContent =
                    companyInput &&
                    companyInput.value.trim()
                        ? companyInput.value.trim()
                        : "Your company";

            }


            if (summaryEmployees) {

                summaryEmployees.textContent =
                    employeesInput &&
                    employeesInput.value
                        ? employeesInput.value
                        : "—";

            }


            const frequency =
                getSelectedValue(
                    "corporate-frequency"
                );

            const service =
                getSelectedValue(
                    "corporate-service"
                );

            const duration =
                getSelectedValue(
                    "corporate-duration"
                );


            if (summaryFrequency) {

                summaryFrequency.textContent =
                    frequency
                        ? CONFIG.frequencyLabels[frequency]
                        : "—";

            }


            if (summaryService) {

                summaryService.textContent =
                    service
                        ? CONFIG.serviceLabels[service]
                        : "—";

            }


            if (summaryDuration) {

                summaryDuration.textContent =
                    duration
                        ? CONFIG.durationLabels[duration]
                        : "—";

            }


            /* ---------------------------------------------
               INVALID STATE
            --------------------------------------------- */

            if (!estimate.valid) {

                if (summaryBase) {
                    summaryBase.textContent = "—";
                }

                if (summaryDiscount) {
                    summaryDiscount.textContent = "—";
                }

                if (summaryDiscountAmount) {
                    summaryDiscountAmount.textContent = "—";
                }

                if (summaryTotal) {
                    summaryTotal.textContent = "—";
                }

                if (summaryAnnual) {
                    summaryAnnual.textContent = "—";
                }

                if (summaryAnnualLabel) {
                    summaryAnnualLabel.textContent =
                        "Annual program value";
                }

                updateLocationNotice(
                    service
                );

                setActionButtons(
                    false
                );

                return;
            }


            /* ---------------------------------------------
               VALID CALCULATION
            --------------------------------------------- */

            if (summaryBase) {

                summaryBase.textContent =
                    formatCurrency(
                        estimate.baseFee
                    );

            }


            if (summaryDiscount) {

                summaryDiscount.textContent =
                    formatPercentage(
                        estimate.discountRate
                    );

            }


            if (summaryDiscountAmount) {

                summaryDiscountAmount.textContent =
                    formatCurrency(
                        estimate.discountAmount
                    );

            }


            if (summaryTotal) {

                summaryTotal.textContent =
                    formatCurrency(
                        estimate.estimatedFee
                    );

            }


            if (summaryAnnualLabel) {

                summaryAnnualLabel.textContent =
                    estimate.frequency === "monthly"
                        ? "Annual program value · 12 sessions"
                        : estimate.frequency === "biannual"
                            ? "Annual program value · 2 sessions"
                            : "Annual program value · 1 session";

            }


            if (summaryAnnual) {

                summaryAnnual.textContent =
                    formatCurrency(
                        estimate.annualProgramValue
                    );

            }


            updateLocationNotice(
                service
            );


            setActionButtons(
                true
            );

        }


        /* =================================================
           LOCATION NOTICE
        ================================================= */

        function updateLocationNotice(service) {

            if (!locationNotice) {
                return;
            }

            if (service === "onsite") {

                locationNotice.hidden = false;

                locationNotice.innerHTML = `
                    <strong>On-site service:</strong>
                    The estimate above covers the selected massage
                    sessions only. Any applicable location,
                    transportation or logistics fee is quoted
                    separately after the workplace location is reviewed.
                `;

            } else {

                locationNotice.hidden = true;

                locationNotice.innerHTML = "";

            }

        }


        /* =================================================
           ENABLE / DISABLE ACTION BUTTONS
        ================================================= */

        function setActionButtons(enabled) {

            if (submitButton) {
                submitButton.disabled = !enabled;
            }

            if (downloadButton) {
                downloadButton.disabled = !enabled;
            }

            if (printButton) {
                printButton.disabled = !enabled;
            }

            if (saveButton) {
                saveButton.disabled = !enabled;
            }

        }


        /* =================================================
           CALCULATE ESTIMATE
        ================================================= */

        function calculateEstimate() {

            const company =
                companyInput
                    ? companyInput.value.trim()
                    : "";

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const employees =
                employeesInput
                    ? parseInt(
                        employeesInput.value,
                        10
                    )
                    : NaN;

            const location =
                locationInput
                    ? locationInput.value.trim()
                    : "";


            const frequency =
                getSelectedValue(
                    "corporate-frequency"
                );

            const service =
                getSelectedValue(
                    "corporate-service"
                );

            const duration =
                getSelectedValue(
                    "corporate-duration"
                );


            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (!company) {

                return invalidEstimate(
                    "Please enter the company name."
                );

            }


            if (!email) {

                return invalidEstimate(
                    "Please enter the official company email."
                );

            }


            if (!isValidEmail(email)) {

                return invalidEstimate(
                    "Please enter a valid company email address."
                );

            }


            if (
                !Number.isInteger(employees) ||
                employees < CONFIG.minimumEmployees
            ) {

                return invalidEstimate(
                    "Corporate program pricing starts from 10 employees."
                );

            }


            if (!frequency) {

                return invalidEstimate(
                    "Please select a program frequency."
                );

            }


            if (!service) {

                return invalidEstimate(
                    "Please select where the service will take place."
                );

            }


            if (!duration) {

                return invalidEstimate(
                    "Please select a massage duration."
                );

            }


            if (
                service === "onsite" &&
                !location
            ) {

                return invalidEstimate(
                    "Please enter the workplace location for an on-site program."
                );

            }


            /* ---------------------------------------------
               CALCULATION
            --------------------------------------------- */

            const pricePerEmployee =
                CONFIG.prices[duration];


            const baseFee =
                employees *
                pricePerEmployee;


            const discountRate =
                CONFIG.discounts[frequency];


            const discountAmount =
                baseFee *
                discountRate;


            const estimatedFee =
                baseFee -
                discountAmount;


            const sessionsPerYear =
                CONFIG.sessionsPerYear[frequency];


            const annualProgramValue =
                estimatedFee *
                sessionsPerYear;


            return {

                valid: true,

                company: company,

                email: email,

                employees: employees,

                location: location,

                frequency: frequency,

                frequencyLabel:
                    CONFIG.frequencyLabels[frequency],

                service: service,

                serviceLabel:
                    CONFIG.serviceLabels[service],

                duration: duration,

                durationLabel:
                    CONFIG.durationLabels[duration],

                pricePerEmployee:
                    pricePerEmployee,

                baseFee:
                    baseFee,

                discountRate:
                    discountRate,

                discountAmount:
                    discountAmount,

                estimatedFee:
                    estimatedFee,

                sessionsPerYear:
                    sessionsPerYear,

                annualProgramValue:
                    annualProgramValue,

                generatedAt:
                    new Date().toISOString()

            };

        }


        /* =================================================
           INVALID ESTIMATE
        ================================================= */

        function invalidEstimate(message) {

            return {

                valid: false,

                message: message

            };

        }


        /* =================================================
           REQUEST CORPORATE PROGRAM
        ================================================= */

        function requestCorporateProgram(
            estimate
        ) {

            const message =
                buildWhatsAppMessage(
                    estimate
                );


            const whatsappURL =
                "https://wa.me/" +
                CONFIG.whatsappNumber +
                "?text=" +
                encodeURIComponent(message);


            showSubmitMessage(
                "Opening WhatsApp with your corporate program request...",
                "success"
            );


            /*
             * Direct user gesture:
             * try a new window first.
             */
            const newWindow =
                window.open(
                    whatsappURL,
                    "_blank",
                    "noopener,noreferrer"
                );


            /*
             * Some mobile browsers block window.open.
             * If blocked, navigate directly instead.
             */
            if (!newWindow) {

                window.location.href =
                    whatsappURL;

            }

        }


        /* =================================================
           WHATSAPP MESSAGE
        ================================================= */

        function buildWhatsAppMessage(
            estimate
        ) {

            let message =
                "Hello Pax & Pearl Body Works,\n\n";

            message +=
                "I would like to request a corporate wellness/massage program.\n\n";

            message +=
                "CORPORATE PROGRAM DETAILS\n";

            message +=
                "Company: " +
                estimate.company +
                "\n";

            message +=
                "Official Email: " +
                estimate.email +
                "\n";

            message +=
                "Employees: " +
                estimate.employees +
                "\n";

            message +=
                "Frequency: " +
                estimate.frequencyLabel +
                "\n";

            message +=
                "Service: " +
                estimate.serviceLabel +
                "\n";

            message +=
                "Massage Duration: " +
                estimate.durationLabel +
                "\n";

            if (estimate.location) {

                message +=
                    "Workplace Location: " +
                    estimate.location +
                    "\n";

            }

            message += "\n";

            message +=
                "ESTIMATE\n";

            message +=
                "Base Fee: " +
                formatCurrency(
                    estimate.baseFee
                ) +
                "\n";

            message +=
                "Corporate Discount: " +
                formatPercentage(
                    estimate.discountRate
                ) +
                "\n";

            message +=
                "Estimated Program Fee: " +
                formatCurrency(
                    estimate.estimatedFee
                ) +
                "\n";

            message +=
                "Annual Program Value: " +
                formatCurrency(
                    estimate.annualProgramValue
                ) +
                "\n\n";

            message +=
                "I understand that applicable on-site location, transportation or logistics fees are quoted separately.";

            return message;

        }


        /* =================================================
           DOWNLOAD PDF
        ================================================= */

        async function downloadEstimatePDF(
            estimate
        ) {

            try {

                showSubmitMessage(
                    "Preparing your PDF estimate...",
                    "success"
                );


                /*
                 * Make sure html2pdf exists.
                 */
                await ensureHtml2Pdf();


                if (
                    typeof window.html2pdf !==
                    "function"
                ) {

                    throw new Error(
                        "html2pdf.js is not available."
                    );

                }


                /*
                 * Build a dedicated PDF document.
                 */
                const pdfElement =
                    createPDFEstimateElement(
                        estimate
                    );


                document.body.appendChild(
                    pdfElement
                );


                /*
                 * Give the browser a moment to
                 * finish laying out the document.
                 */
                await wait(
                    150
                );


                const filename =
                    buildPDFFileName(
                        estimate
                    );


                const options = {

                    margin: [
                        8,
                        8,
                        8,
                        8
                    ],

                    filename:
                        filename,

                    image: {
                        type: "jpeg",
                        quality: 0.98
                    },

                    html2canvas: {

                        scale: 2,

                        useCORS: true,

                        allowTaint: false,

                        backgroundColor:
                            "#ffffff",

                        logging: false,

                        scrollX: 0,

                        scrollY: 0

                    },

                    jsPDF: {

                        unit: "mm",

                        format: "a4",

                        orientation:
                            "portrait"

                    },

                    pagebreak: {

                        mode: [
                            "css",
                            "legacy"
                        ]

                    }

                };


                await window
                    .html2pdf()
                    .set(options)
                    .from(pdfElement)
                    .save();


                /*
                 * Remove temporary document.
                 */
                pdfElement.remove();


                showSubmitMessage(
                    "PDF estimate downloaded successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Pax & Pearl PDF error:",
                    error
                );


                /*
                 * Remove any temporary PDF document.
                 */
                const temporaryPDF =
                    document.querySelector(
                        "[data-pax-corporate-pdf]"
                    );

                if (temporaryPDF) {
                    temporaryPDF.remove();
                }


                showSubmitMessage(
                    "The PDF could not be generated on this device. Please use “Print / Save as PDF” instead.",
                    "error"
                );

            }

        }


        /* =================================================
           ENSURE HTML2PDF
        ================================================= */

        function ensureHtml2Pdf() {

            if (
                typeof window.html2pdf ===
                "function"
            ) {

                return Promise.resolve();

            }


            return new Promise(
                function (resolve, reject) {

                    /*
                     * Avoid loading the same script twice.
                     */
                    const existingScript =
                        document.querySelector(
                            'script[data-html2pdf-loader]'
                        );


                    if (existingScript) {

                        existingScript.addEventListener(
                            "load",
                            function () {
                                resolve();
                            },
                            {
                                once: true
                            }
                        );

                        existingScript.addEventListener(
                            "error",
                            function () {
                                reject(
                                    new Error(
                                        "html2pdf.js failed to load."
                                    )
                                );
                            },
                            {
                                once: true
                            }
                        );

                        return;
                    }


                    /*
                     * CDN fallback.
                     */
                    const script =
                        document.createElement(
                            "script"
                        );

                    script.src =
                        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

                    script.async = true;

                    script.setAttribute(
                        "data-html2pdf-loader",
                        ""
                    );


                    script.onload =
                        function () {

                            if (
                                typeof window.html2pdf ===
                                "function"
                            ) {
                                resolve();
                            } else {
                                reject(
                                    new Error(
                                        "html2pdf.js loaded but was not available."
                                    )
                                );
                            }

                        };


                    script.onerror =
                        function () {

                            reject(
                                new Error(
                                    "Unable to load html2pdf.js."
                                )
                            );

                        };


                    document.head.appendChild(
                        script
                    );

                }
            );

        }


        /* =================================================
           CREATE PDF DOCUMENT
        ================================================= */

        function createPDFEstimateElement(
            estimate
        ) {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.setAttribute(
                "data-pax-corporate-pdf",
                ""
            );


            wrapper.className =
                "pax-corporate-pdf-document";


            const generatedDate =
                formatDate(
                    estimate.generatedAt
                );


            wrapper.innerHTML = `

                <div class="pax-pdf-header">

                    <div class="pax-pdf-brand">

                        <div class="pax-pdf-brand-name">
                            PAX &amp; PEARL
                        </div>

                        <div class="pax-pdf-brand-subtitle">
                            BODY WORKS
                        </div>

                    </div>

                    <div class="pax-pdf-document-label">
                        CORPORATE WELLNESS
                    </div>

                </div>


                <div class="pax-pdf-title-section">

                    <h1>
                        Corporate Wellness
                        Program Estimate
                    </h1>

                    <p>
                        Prepared for
                        <strong>
                            ${escapeHTML(estimate.company)}
                        </strong>
                    </p>

                </div>


                <div class="pax-pdf-meta">

                    <div>
                        <span>Estimate Date</span>
                        <strong>
                            ${escapeHTML(generatedDate)}
                        </strong>
                    </div>

                    <div>
                        <span>Official Email</span>
                        <strong>
                            ${escapeHTML(estimate.email)}
                        </strong>
                    </div>

                </div>


                <div class="pax-pdf-section">

                    <h2>
                        Program Details
                    </h2>

                    <table class="pax-pdf-table">

                        <tbody>

                            <tr>
                                <td>Company</td>
                                <td>
                                    ${escapeHTML(estimate.company)}
                                </td>
                            </tr>

                            <tr>
                                <td>Number of Employees</td>
                                <td>
                                    ${estimate.employees}
                                </td>
                            </tr>

                            <tr>
                                <td>Program Frequency</td>
                                <td>
                                    ${escapeHTML(estimate.frequencyLabel)}
                                </td>
                            </tr>

                            <tr>
                                <td>Service Location</td>
                                <td>
                                    ${escapeHTML(estimate.serviceLabel)}
                                </td>
                            </tr>

                            ${
                                estimate.location
                                    ? `
                                    <tr>
                                        <td>Workplace Location</td>
                                        <td>
                                            ${escapeHTML(estimate.location)}
                                        </td>
                                    </tr>
                                    `
                                    : ""
                            }

                            <tr>
                                <td>Massage Duration</td>
                                <td>
                                    ${escapeHTML(estimate.durationLabel)}
                                </td>
                            </tr>

                            <tr>
                                <td>Rate Per Employee</td>
                                <td>
                                    ${formatCurrency(
                                        estimate.pricePerEmployee
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>


                <div class="pax-pdf-section">

                    <h2>
                        Fee Breakdown
                    </h2>

                    <table class="pax-pdf-table pax-pdf-fee-table">

                        <tbody>

                            <tr>
                                <td>
                                    ${estimate.employees}
                                    employees ×
                                    ${escapeHTML(
                                        estimate.durationLabel
                                    )}
                                </td>

                                <td>
                                    ${formatCurrency(
                                        estimate.baseFee
                                    )}
                                </td>
                            </tr>

                            <tr>

                                <td>
                                    Corporate Program Discount
                                    (${formatPercentage(
                                        estimate.discountRate
                                    )})
                                </td>

                                <td>
                                    -
                                    ${formatCurrency(
                                        estimate.discountAmount
                                    )}
                                </td>

                            </tr>

                            <tr class="pax-pdf-total-row">

                                <td>
                                    ESTIMATED PROGRAM FEE
                                </td>

                                <td>
                                    ${formatCurrency(
                                        estimate.estimatedFee
                                    )}
                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>


                <div class="pax-pdf-annual">

                    <div>

                        <span>
                            Annual Program Value
                        </span>

                        <small>
                            Based on
                            ${estimate.sessionsPerYear}
                            scheduled
                            ${
                                estimate.frequency === "annual"
                                    ? "session"
                                    : "sessions"
                            }
                            per year
                        </small>

                    </div>

                    <strong>
                        ${formatCurrency(
                            estimate.annualProgramValue
                        )}
                    </strong>

                </div>


                <div class="pax-pdf-notice">

                    <strong>
                        Important:
                    </strong>

                    This estimate covers the selected
                    massage sessions based on the number
                    of employees, session duration and
                    selected program frequency.

                    ${
                        estimate.service === "onsite"
                            ? `
                            Applicable on-site location,
                            transportation or logistics
                            fees are not included and
                            will be quoted separately
                            after the workplace location
                            is reviewed.
                            `
                            : `
                            Any separately applicable
                            arrangements or charges will
                            be confirmed by Pax &amp; Pearl
                            before the program is finalised.
                            `
                    }

                </div>


                <div class="pax-pdf-footer">

                    <div>

                        <strong>
                            Pax &amp; Pearl Body Works
                        </strong>

                        <span>
                            Wellness is a lifestyle
                            you deserve.
                        </span>

                    </div>

                    <div class="pax-pdf-contact">

                        <span>
                            Festac Town, Lagos
                        </span>

                        <span>
                            +234 706 430 2016
                        </span>

                        <span>
                            +234 812 227 0495
                        </span>

                    </div>

                </div>

            `;


            return wrapper;

        }


        /* =================================================
           PRINT ESTIMATE
        ================================================= */

        function printEstimate(
            estimate
        ) {

            const printArea =
                createPDFEstimateElement(
                    estimate
                );


            printArea.id =
                "pax-corporate-print-area";


            document.body.appendChild(
                printArea
            );


            /*
             * Tell CSS that the page is currently
             * in corporate estimate print mode.
             */
            document.body.classList.add(
                "is-printing-corporate-estimate"
            );


            /*
             * Allow the browser to layout the
             * temporary document before printing.
             */
            window.setTimeout(
                function () {

                    window.print();

                },
                100
            );


            /*
             * Clean up after printing.
             */
            const cleanup =
                function () {

                    document.body.classList.remove(
                        "is-printing-corporate-estimate"
                    );

                    const activePrintArea =
                        document.getElementById(
                            "pax-corporate-print-area"
                        );

                    if (activePrintArea) {
                        activePrintArea.remove();
                    }

                    window.removeEventListener(
                        "afterprint",
                        cleanup
                    );

                };


            window.addEventListener(
                "afterprint",
                cleanup
            );


            /*
             * Fallback cleanup for browsers that
             * do not reliably fire afterprint.
             */
            window.setTimeout(
                cleanup,
                10000
            );

        }


        /* =================================================
           SAVE ESTIMATE
        ================================================= */

        function saveEstimate(
            estimate
        ) {

            try {

                const data = {

                    version: 1,

                    savedAt:
                        new Date().toISOString(),

                    estimate:
                        estimate

                };


                localStorage.setItem(
                    CONFIG.storageKey,
                    JSON.stringify(data)
                );


                showSubmitMessage(
                    "Estimate saved on this device.",
                    "success"
                );


                if (saveButton) {

                    saveButton.innerHTML =
                        '<span aria-hidden="true">✓</span> Estimate Saved';


                    window.setTimeout(
                        function () {

                            saveButton.innerHTML =
                                '<span aria-hidden="true">💾</span> Save Estimate';

                        },
                        2500
                    );

                }


            } catch (error) {

                console.error(
                    "Unable to save estimate:",
                    error
                );


                showSubmitMessage(
                    "This browser did not allow the estimate to be saved.",
                    "error"
                );

            }

        }


        /* =================================================
           RESTORE SAVED ESTIMATE
        ================================================= */

        function restoreSavedEstimate() {

            try {

                const stored =
                    localStorage.getItem(
                        CONFIG.storageKey
                    );


                if (!stored) {
                    return;
                }


                const data =
                    JSON.parse(
                        stored
                    );


                if (
                    !data ||
                    !data.estimate
                ) {
                    return;
                }


                const estimate =
                    data.estimate;


                /*
                 * Restore form values.
                 */
                if (companyInput) {
                    companyInput.value =
                        estimate.company || "";
                }


                if (emailInput) {
                    emailInput.value =
                        estimate.email || "";
                }


                if (employeesInput) {
                    employeesInput.value =
                        estimate.employees || "";
                }


                if (locationInput) {
                    locationInput.value =
                        estimate.location || "";
                }


                setRadioValue(
                    "corporate-frequency",
                    estimate.frequency
                );


                setRadioValue(
                    "corporate-service",
                    estimate.service
                );


                setRadioValue(
                    "corporate-duration",
                    String(
                        estimate.duration
                    )
                );


                /*
                 * Recalculate rather than blindly trusting
                 * the stored monetary values.
                 */
                updateCalculator();


            } catch (error) {

                console.warn(
                    "Could not restore saved corporate estimate.",
                    error
                );

            }

        }


        /* =================================================
           SUBMIT STATUS
        ================================================= */

        function showSubmitMessage(
            message,
            type
        ) {

            if (!submitMessage) {
                return;
            }


            submitMessage.textContent =
                message;


            submitMessage.classList.remove(
                "success",
                "error"
            );


            if (type) {

                submitMessage.classList.add(
                    type
                );

            }

        }


    }


    /* =====================================================
       RADIO HELPER
    ===================================================== */

    function getSelectedValue(
        name
    ) {

        const selected =
            document.querySelector(
                `input[name="${name}"]:checked`
            );


        return selected
            ? selected.value
            : "";

    }


    /* =====================================================
       SET RADIO VALUE
    ===================================================== */

    function setRadioValue(
        name,
        value
    ) {

        if (!value) {
            return;
        }


        const input =
            document.querySelector(
                `input[name="${name}"][value="${CSS.escape(String(value))}"]`
            );


        if (input) {

            input.checked = true;

        }

    }


    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    function isValidEmail(
        email
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    }


    /* =====================================================
       CURRENCY
    ===================================================== */

    function formatCurrency(
        amount
    ) {

        return new Intl.NumberFormat(
            "en-NG",
            {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0
            }
        ).format(
            Number(amount) || 0
        );

    }


    /* =====================================================
       PERCENTAGE
    ===================================================== */

    function formatPercentage(
        decimal
    ) {

        return Math.round(
            (Number(decimal) || 0) * 100
        ) + "%";

    }


    /* =====================================================
       DATE
    ===================================================== */

    function formatDate(
        isoDate
    ) {

        const date =
            new Date(
                isoDate
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-NG",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
            date
        );

    }


    /* =====================================================
       PDF FILENAME
    ===================================================== */

    function buildPDFFileName(
        estimate
    ) {

        const company =
            String(
                estimate.company || "Company"
            )
                .replace(
                    /[^a-z0-9]+/gi,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                );


        return (
            CONFIG.pdfPrefix +
            "-" +
            company +
            ".pdf"
        );

    }


    /* =====================================================
       HTML ESCAPING
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value == null
                ? ""
                : value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       WAIT HELPER
    ===================================================== */

    function wait(
        milliseconds
    ) {

        return new Promise(
            function (resolve) {

                window.setTimeout(
                    resolve,
                    milliseconds
                );

            }
        );

    }

})();
