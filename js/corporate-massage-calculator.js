/* =========================================================
   PAX & PEARL BODY WORKS
   CORPORATE MASSAGE CALCULATOR
   VERSION 2.0
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.querySelector(
        "[data-corporate-calculator-modal]"
    );

    if (!modal) {
        console.warn(
            "Pax & Pearl Corporate Calculator: modal not found."
        );
        return;
    }


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const PRICING = {
        "20": 15000,
        "30": 20000,
        "60": 35000
    };


    const FREQUENCY = {

        monthly: {
            label: "Monthly",
            discount: 0.10,
            discountLabel: "10%",
            sessionsPerYear: 12
        },

        biannual: {
            label: "Bi-annual (2 times/year)",
            discount: 0.05,
            discountLabel: "5%",
            sessionsPerYear: 2
        },

        annual: {
            label: "Annual",
            discount: 0.03,
            discountLabel: "3%",
            sessionsPerYear: 1
        }

    };


    /*
     * Replace this number with the preferred
     * Pax & Pearl WhatsApp number if necessary.
     *
     * Current public phone:
     * +234 706 430 2016
     */
    const WHATSAPP_NUMBER = "2347064302016";


    const STORAGE_KEY =
        "paxandpearl_corporate_estimate";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const form =
        modal.querySelector("[data-corporate-form]");

    if (!form) {
        console.error(
            "Pax & Pearl Corporate Calculator: form not found."
        );
        return;
    }


    const companyName =
        modal.querySelector("#corporate-company-name");

    const officialEmail =
        modal.querySelector("#corporate-email");

    const employeeCount =
        modal.querySelector("#corporate-employees");

    const officeLocation =
        modal.querySelector("#corporate-location");


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
        modal.querySelector(
            "[data-summary-discount-amount]"
        );

    const summaryTotal =
        modal.querySelector("[data-summary-total]");

    const summaryAnnual =
        modal.querySelector("[data-summary-annual]");

    const summaryAnnualLabel =
        modal.querySelector(
            "[data-summary-annual-label]"
        );


    const locationNotice =
        modal.querySelector("[data-location-notice]");


    const downloadButton =
        modal.querySelector("[data-download-pdf]");

    const printButton =
        modal.querySelector("[data-print-calculation]");

    const submitButton =
        modal.querySelector("[data-submit-corporate]");


    const message =
        modal.querySelector("[data-submit-message]");


    /* =====================================================
       HELPERS
    ===================================================== */

    function formatCurrency(amount) {

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);

    }


    function getSelectedValue(name) {

        const selected =
            modal.querySelector(
                `input[name="${name}"]:checked`
            );

        return selected
            ? selected.value
            : null;

    }


    function getSelectedLabel(name) {

        const selected =
            modal.querySelector(
                `input[name="${name}"]:checked`
            );

        if (!selected) return "";


        const label =
            modal.querySelector(
                `label[for="${selected.id}"]`
            );

        if (!label) {
            return selected.value;
        }


        const title =
            label.querySelector(
                ".corporate-option-title"
            );

        return title
            ? title.textContent.trim()
            : label.textContent.trim();

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function showMessage(
        text,
        type = "success"
    ) {

        if (!message) return;

        message.textContent = text;

        message.className =
            `corporate-submit-message is-visible ${type}`;

    }


    function clearMessage() {

        if (!message) return;

        message.textContent = "";

        message.className =
            "corporate-submit-message";

    }


    /* =====================================================
       CALCULATE
    ===================================================== */

    function calculate() {

        const employees =
            parseInt(
                employeeCount?.value || "0",
                10
            );


        const duration =
            getSelectedValue(
                "corporate-duration"
            );


        const frequency =
            getSelectedValue(
                "corporate-frequency"
            );


        const service =
            getSelectedValue(
                "corporate-service"
            );


        if (
            !employees ||
            employees < 10 ||
            !duration ||
            !frequency ||
            !service
        ) {

            return {
                valid: false,
                employees,
                duration,
                frequency,
                service
            };

        }


        const pricePerEmployee =
            PRICING[duration];


        const frequencyData =
            FREQUENCY[frequency];


        const basePrice =
            employees * pricePerEmployee;


        const discountAmount =
            basePrice *
            frequencyData.discount;


        const discountedPrice =
            basePrice -
            discountAmount;


        const annualProgramValue =
            discountedPrice *
            frequencyData.sessionsPerYear;


        return {

            valid: true,

            employees,

            duration,

            frequency,

            service,

            frequencyData,

            pricePerEmployee,

            basePrice,

            discountAmount,

            discountedPrice,

            annualProgramValue

        };

    }


    /* =====================================================
       UPDATE SUMMARY
    ===================================================== */

    function updateSummary() {

        const result =
            calculate();


        summaryCompany.textContent =
            companyName?.value.trim() ||
            "Your company";


        summaryEmployees.textContent =
            employeeCount?.value
                ? `${employeeCount.value} employees`
                : "—";


        summaryFrequency.textContent =
            result.frequency
                ? getSelectedLabel(
                    "corporate-frequency"
                )
                : "—";


        summaryService.textContent =
            result.service
                ? getSelectedLabel(
                    "corporate-service"
                )
                : "—";


        summaryDuration.textContent =
            result.duration
                ? `${result.duration} minutes`
                : "—";


        if (!result.valid) {

            summaryBase.textContent = "—";

            summaryDiscount.textContent = "—";

            summaryDiscountAmount.textContent = "—";

            summaryTotal.textContent = "—";

            summaryAnnual.textContent = "—";


            downloadButton.disabled = true;

            printButton.disabled = true;

            submitButton.disabled = true;


            if (locationNotice) {
                locationNotice.hidden = true;
            }


            return;

        }


        summaryBase.textContent =
            formatCurrency(
                result.basePrice
            );


        summaryDiscount.textContent =
            `${result.frequencyData.discountLabel} OFF`;


        summaryDiscountAmount.textContent =
            `−${formatCurrency(
                result.discountAmount
            )}`;


        summaryTotal.textContent =
            formatCurrency(
                result.discountedPrice
            );


        summaryAnnualLabel.textContent =
            `${result.frequencyData.sessionsPerYear} ` +
            `session${
                result.frequencyData.sessionsPerYear > 1
                    ? "s"
                    : ""
            } per year`;


        summaryAnnual.textContent =
            formatCurrency(
                result.annualProgramValue
            );


        /* =================================================
           ONSITE NOTICE
        ================================================= */

        if (
            result.service === "onsite"
        ) {

            if (locationNotice) {

                locationNotice.hidden = false;

                locationNotice.innerHTML = `
                    <strong>Onsite service note</strong>
                    The estimate covers the massage/program
                    fee only. Any applicable location,
                    transportation or onsite logistics fee
                    will be quoted separately based on the
                    workplace location.
                `;

            }

        } else {

            if (locationNotice) {
                locationNotice.hidden = true;
            }

        }


        downloadButton.disabled = false;

        printButton.disabled = false;

        submitButton.disabled = false;

    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateForm() {

        clearMessage();


        let valid = true;


        /* ---------------------------------------------
           Text fields
        --------------------------------------------- */

        if (!companyName.value.trim()) {

            companyName.setAttribute(
                "aria-invalid",
                "true"
            );

            valid = false;

        } else {

            companyName.removeAttribute(
                "aria-invalid"
            );

        }


        /* ---------------------------------------------
           Email
        --------------------------------------------- */

        const email =
            officialEmail.value.trim();


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !email ||
            !emailPattern.test(email)
        ) {

            officialEmail.setAttribute(
                "aria-invalid",
                "true"
            );

            valid = false;

        } else {

            officialEmail.removeAttribute(
                "aria-invalid"
            );

        }


        /* ---------------------------------------------
           Employees
        --------------------------------------------- */

        const employees =
            parseInt(
                employeeCount.value || "0",
                10
            );


        if (
            !Number.isInteger(employees) ||
            employees < 10
        ) {

            employeeCount.setAttribute(
                "aria-invalid",
                "true"
            );

            showMessage(
                "Corporate program pricing starts from 10 employees.",
                "error"
            );

            return false;

        } else {

            employeeCount.removeAttribute(
                "aria-invalid"
            );

        }


        /* ---------------------------------------------
           Service
        --------------------------------------------- */

        const service =
            getSelectedValue(
                "corporate-service"
            );


        if (
            service === "onsite" &&
            !officeLocation.value.trim()
        ) {

            officeLocation.setAttribute(
                "aria-invalid",
                "true"
            );

            showMessage(
                "Please enter the workplace location for onsite service.",
                "error"
            );

            officeLocation.focus();

            return false;

        } else {

            officeLocation.removeAttribute(
                "aria-invalid"
            );

        }


        /* ---------------------------------------------
           Radio selections
        --------------------------------------------- */

        const requiredOptions = [

            "corporate-frequency",

            "corporate-service",

            "corporate-duration"

        ];


        requiredOptions.forEach(name => {

            if (
                !getSelectedValue(name)
            ) {

                valid = false;

            }

        });


        if (!valid) {

            showMessage(
                "Please complete all required corporate program details.",
                "error"
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       REPORT DATA
    ===================================================== */

    function getReportData() {

        const result =
            calculate();


        if (!result.valid) {
            return null;
        }


        return {

            companyName:
                companyName.value.trim(),

            officialEmail:
                officialEmail.value.trim(),

            employees:
                result.employees,

            frequency:
                result.frequencyData.label,

            service:
                getSelectedLabel(
                    "corporate-service"
                ),

            duration:
                `${result.duration} minutes`,

            pricePerEmployee:
                result.pricePerEmployee,

            basePrice:
                result.basePrice,

            discountLabel:
                result.frequencyData.discountLabel,

            discountAmount:
                result.discountAmount,

            total:
                result.discountedPrice,

            sessionsPerYear:
                result.frequencyData.sessionsPerYear,

            annualValue:
                result.annualProgramValue,

            officeLocation:
                officeLocation.value.trim(),

            generatedAt:
                new Date()

        };

    }


    /* =====================================================
       LOAD jsPDF
    ===================================================== */

    function loadJsPDF() {

        if (
            window.jspdf &&
            window.jspdf.jsPDF
        ) {

            return Promise.resolve(
                window.jspdf.jsPDF
            );

        }


        return new Promise(
            (resolve, reject) => {

                const existing =
                    document.querySelector(
                        'script[data-pax-jspdf]'
                    );


                if (existing) {

                    existing.addEventListener(
                        "load",
                        () => {

                            if (
                                window.jspdf?.jsPDF
                            ) {

                                resolve(
                                    window.jspdf.jsPDF
                                );

                            } else {

                                reject(
                                    new Error(
                                        "jsPDF loaded without constructor."
                                    )
                                );

                            }

                        }
                    );


                    existing.addEventListener(
                        "error",
                        () => {

                            reject(
                                new Error(
                                    "jsPDF failed to load."
                                )
                            );

                        }
                    );


                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js";


                script.async = true;


                script.dataset.paxJspdf =
                    "true";


                script.onload = () => {

                    if (
                        window.jspdf?.jsPDF
                    ) {

                        resolve(
                            window.jspdf.jsPDF
                        );

                    } else {

                        reject(
                            new Error(
                                "jsPDF constructor unavailable."
                            )
                        );

                    }

                };


                script.onerror = () => {

                    reject(
                        new Error(
                            "Could not load jsPDF."
                        )
                    );

                };


                document.head.appendChild(
                    script
                );

            }
        );

    }


    /* =====================================================
       DOWNLOAD PDF
    ===================================================== */

    async function downloadPDF() {

        if (!validateForm()) {
            return;
        }


        const data =
            getReportData();


        if (!data) {
            return;
        }


        const originalText =
            downloadButton.textContent;


        downloadButton.disabled = true;

        downloadButton.textContent =
            "Preparing PDF...";


        try {

            const jsPDF =
                await loadJsPDF();


            const doc =
                new jsPDF({
                    unit: "mm",
                    format: "a4"
                });


            const pageWidth =
                doc.internal.pageSize.getWidth();


            const pageHeight =
                doc.internal.pageSize.getHeight();


            let y = 22;


            /* -----------------------------------------
               Header
            ----------------------------------------- */

            doc.setFillColor(
                13,
                47,
                37
            );


            doc.rect(
                0,
                0,
                pageWidth,
                42,
                "F"
            );


            doc.setTextColor(
                255,
                255,
                255
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(18);


            doc.text(
                "PAX & PEARL BODY WORKS",
                18,
                17
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(10);


            doc.text(
                "Corporate Massage Program",
                18,
                25
            );


            doc.text(
                "Management Estimate",
                18,
                32
            );


            y = 54;


            /* -----------------------------------------
               Title
            ----------------------------------------- */

            doc.setTextColor(
                24,
                49,
                42
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(14);


            doc.text(
                "Corporate Program Estimate",
                18,
                y
            );


            y += 11;


            /* -----------------------------------------
               Company details
            ----------------------------------------- */

            const details = [

                [
                    "Company",
                    data.companyName
                ],

                [
                    "Official Email",
                    data.officialEmail
                ],

                [
                    "Employees",
                    String(data.employees)
                ],

                [
                    "Frequency",
                    data.frequency
                ],

                [
                    "Service",
                    data.service
                ],

                [
                    "Session Duration",
                    data.duration
                ]

            ];


            if (data.officeLocation) {

                details.push([
                    "Workplace",
                    data.officeLocation
                ]);

            }


            doc.setFontSize(10);


            details.forEach(
                ([label, value]) => {

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );


                    doc.text(
                        `${label}:`,
                        18,
                        y
                    );


                    doc.setFont(
                        "helvetica",
                        "normal"
                    );


                    const wrapped =
                        doc.splitTextToSize(
                            String(value),
                            pageWidth - 78
                        );


                    doc.text(
                        wrapped,
                        60,
                        y
                    );


                    y +=
                        Math.max(
                            7,
                            wrapped.length * 5
                        );

                }
            );


            y += 6;


            /* -----------------------------------------
               Fee breakdown
            ----------------------------------------- */

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(13);


            doc.text(
                "Fee Breakdown",
                18,
                y
            );


            y += 10;


            const breakdown = [

                [
                    "Price per employee",
                    formatCurrency(
                        data.pricePerEmployee
                    )
                ],

                [
                    `${data.employees} employees`,
                    formatCurrency(
                        data.basePrice
                    )
                ],

                [
                    `Program discount (${data.discountLabel})`,
                    `-${formatCurrency(
                        data.discountAmount
                    )}`
                ]

            ];


            doc.setFontSize(10);


            breakdown.forEach(
                ([label, value]) => {

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );


                    doc.text(
                        label,
                        18,
                        y
                    );


                    doc.text(
                        value,
                        pageWidth - 18,
                        y,
                        {
                            align: "right"
                        }
                    );


                    y += 8;

                }
            );


            /* -----------------------------------------
               Total
            ----------------------------------------- */

            y += 5;


            doc.setFillColor(
                245,
                241,
                233
            );


            doc.roundedRect(
                18,
                y,
                pageWidth - 36,
                30,
                4,
                4,
                "F"
            );


            doc.setTextColor(
                24,
                49,
                42
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(9);


            doc.text(
                "ESTIMATED PROGRAM FEE",
                26,
                y + 11
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(18);


            doc.text(
                formatCurrency(
                    data.total
                ),
                26,
                y + 22
            );


            y += 41;


            /* -----------------------------------------
               Annual value
            ----------------------------------------- */

            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(10);


            doc.text(
                `${data.sessionsPerYear} session(s) per year`,
                18,
                y
            );


            y += 7;


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                `Estimated annual program value: ` +
                `${formatCurrency(
                    data.annualValue
                )}`,
                18,
                y
            );


            /* -----------------------------------------
               Onsite notice
            ----------------------------------------- */

            if (
                data.service
                    .toLowerCase()
                    .includes("onsite")
            ) {

                y += 14;


                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(9);


                doc.text(
                    "ONSITE SERVICE NOTE",
                    18,
                    y
                );


                y += 6;


                doc.setFont(
                    "helvetica",
                    "normal"
                );


                const notice =
                    "The estimate covers the " +
                    "massage/program fee only. " +
                    "Any applicable location, " +
                    "transportation or onsite " +
                    "logistics fee will be " +
                    "quoted separately based " +
                    "on the workplace location.";


                const wrapped =
                    doc.splitTextToSize(
                        notice,
                        pageWidth - 36
                    );


                doc.text(
                    wrapped,
                    18,
                    y
                );

            }


            /* -----------------------------------------
               Footer
            ----------------------------------------- */

            const footerY =
                pageHeight - 22;


            doc.setDrawColor(
                201,
                162,
                39
            );


            doc.line(
                18,
                footerY - 6,
                pageWidth - 18,
                footerY - 6
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(8);


            doc.setTextColor(
                101,
                115,
                109
            );


            doc.text(
                "Pax & Pearl Body Works",
                18,
                footerY
            );


            doc.text(
                "+234 706 430 2016 | " +
                "+234 812 227 0495",
                pageWidth - 18,
                footerY,
                {
                    align: "right"
                }
            );


            doc.setFontSize(7);


            const dateText =
                data.generatedAt.toLocaleDateString(
                    "en-NG",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );


            doc.text(
                `Estimate generated ${dateText}`,
                18,
                footerY + 5
            );


            /* -----------------------------------------
               Filename
            ----------------------------------------- */

            const safeCompany =
                data.companyName
                    .replace(
                        /[^a-z0-9]/gi,
                        "-"
                    )
                    .replace(
                        /-+/g,
                        "-"
                    )
                    .replace(
                        /^-|-$/g,
                        ""
                    )
                    .toLowerCase();


            const filename =
                `Pax-and-Pearl-Corporate-Massage-Estimate-` +
                `${safeCompany || "Company"}.pdf`;


            doc.save(filename);


            showMessage(
                "Your corporate estimate PDF has been downloaded.",
                "success"
            );


        } catch (error) {

            console.error(
                "Pax & Pearl PDF generation error:",
                error
            );


            showMessage(
                "PDF generation could not load. Use Print / Save PDF instead.",
                "error"
            );


        } finally {

            downloadButton.disabled =
                false;


            downloadButton.textContent =
                originalText;

        }

    }


    /* =====================================================
       PRINT / SAVE PDF
    ===================================================== */

    function printCalculation() {

        if (!validateForm()) {
            return;
        }


        const data =
            getReportData();


        if (!data) {
            return;
        }


        /*
         * Instead of window.open(), create a temporary
         * printable document in the current page.
         *
         * This is much more reliable on mobile/PWA browsers.
         */

        const printArea =
            document.createElement(
                "div"
            );


        printArea.id =
            "pax-corporate-print-area";


        printArea.innerHTML = `

            <div class="print-document">

                <div class="print-header">

                    <h1>
                        PAX & PEARL BODY WORKS
                    </h1>

                    <p>
                        Corporate Massage Program
                        — Management Estimate
                    </p>

                </div>


                <h2>
                    Corporate Program Estimate
                </h2>


                <div class="print-section">

                    <div class="print-row">
                        <span>Company</span>
                        <strong>
                            ${escapeHTML(
                                data.companyName
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>Official Email</span>
                        <strong>
                            ${escapeHTML(
                                data.officialEmail
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>Employees</span>
                        <strong>
                            ${data.employees}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>Frequency</span>
                        <strong>
                            ${escapeHTML(
                                data.frequency
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>Service</span>
                        <strong>
                            ${escapeHTML(
                                data.service
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>Session Duration</span>
                        <strong>
                            ${escapeHTML(
                                data.duration
                            )}
                        </strong>
                    </div>


                    ${
                        data.officeLocation
                            ? `
                            <div class="print-row">
                                <span>Workplace</span>
                                <strong>
                                    ${escapeHTML(
                                        data.officeLocation
                                    )}
                                </strong>
                            </div>
                            `
                            : ""
                    }

                </div>


                <h2>
                    Fee Breakdown
                </h2>


                <div class="print-section">

                    <div class="print-row">
                        <span>
                            Price per employee
                        </span>

                        <strong>
                            ${formatCurrency(
                                data.pricePerEmployee
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>
                            ${data.employees} employees
                        </span>

                        <strong>
                            ${formatCurrency(
                                data.basePrice
                            )}
                        </strong>
                    </div>


                    <div class="print-row">
                        <span>
                            Program discount
                            (${data.discountLabel})
                        </span>

                        <strong>
                            −${formatCurrency(
                                data.discountAmount
                            )}
                        </strong>
                    </div>

                </div>


                <div class="print-total">

                    <span>
                        ESTIMATED PROGRAM FEE
                    </span>

                    <strong>
                        ${formatCurrency(
                            data.total
                        )}
                    </strong>

                </div>


                <div class="print-annual">

                    <p>
                        ${data.sessionsPerYear}
                        session(s) per year
                    </p>

                    <strong>
                        Estimated annual program value:
                        ${formatCurrency(
                            data.annualValue
                        )}
                    </strong>

                </div>


                ${
                    data.service
                        .toLowerCase()
                        .includes("onsite")
                        ? `
                        <div class="print-notice">

                            <strong>
                                ONSITE SERVICE NOTE
                            </strong>

                            <p>
                                The estimate covers the
                                massage/program fee only.
                                Any applicable location,
                                transportation or onsite
                                logistics fee will be
                                quoted separately based
                                on the workplace location.
                            </p>

                        </div>
                        `
                        : ""
                }


                <footer class="print-footer">

                    <strong>
                        Pax & Pearl Body Works
                    </strong>

                    <br>

                    +234 706 430 2016 |
                    +234 812 227 0495

                    <br>

                    Suite 8, Okaka Plaza,
                    1st Avenue,
                    Festac Town, Lagos

                </footer>

            </div>

        `;


        document.body.appendChild(
            printArea
        );


        /*
         * Give the browser time to insert the
         * print DOM before opening the dialog.
         */

        requestAnimationFrame(() => {

            setTimeout(() => {

                window.print();

            }, 150);

        });


        /*
         * Remove temporary print document
         * after printing/cancelling.
         */

        const cleanup =
            () => {

                if (
                    printArea &&
                    printArea.parentNode
                ) {

                    printArea.remove();

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

    }


    /* =====================================================
       SAVE ESTIMATE
    ===================================================== */

    function saveEstimate() {

        if (!validateForm()) {
            return;
        }


        const data =
            getReportData();


        if (!data) {
            return;
        }


        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );


            showMessage(
                "Estimate saved on this device.",
                "success"
            );


        } catch (error) {

            console.error(
                "Unable to save estimate:",
                error
            );


            showMessage(
                "The estimate could not be saved on this device.",
                "error"
            );

        }

    }


    /* =====================================================
       LOAD SAVED ESTIMATE
    ===================================================== */

    function loadSavedEstimate() {

        try {

            const stored =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!stored) {
                return;
            }


            const data =
                JSON.parse(stored);


            if (!data) {
                return;
            }


            if (companyName) {
                companyName.value =
                    data.companyName || "";
            }


            if (officialEmail) {
                officialEmail.value =
                    data.officialEmail || "";
            }


            if (employeeCount) {
                employeeCount.value =
                    data.employees || "";
            }


            if (officeLocation) {
                officeLocation.value =
                    data.officeLocation || "";
            }


            const frequency =
                modal.querySelector(
                    `input[name="corporate-frequency"][value="${data.frequency === "Monthly"
                        ? "monthly"
                        : data.frequency.startsWith("Bi-annual")
                            ? "biannual"
                            : "annual"
                    }"]`
                );


            if (frequency) {
                frequency.checked = true;
            }


            const serviceValue =
                data.service
                    .toLowerCase()
                    .includes("onsite")
                    ? "onsite"
                    : "spa";


            const service =
                modal.querySelector(
                    `input[name="corporate-service"][value="${serviceValue}"]`
                );


            if (service) {
                service.checked = true;
            }


            const durationValue =
                String(
                    data.duration
                        .replace(/\D/g, "")
                );


            const duration =
                modal.querySelector(
                    `input[name="corporate-duration"][value="${durationValue}"]`
                );


            if (duration) {
                duration.checked = true;
            }


            updateSummary();


        } catch (error) {

            console.warn(
                "Saved corporate estimate could not be loaded.",
                error
            );

        }

    }


    /* =====================================================
       CORPORATE REQUEST
    ===================================================== */

    function submitCorporateRequest() {

        if (!validateForm()) {
            return;
        }


        const data =
            getReportData();


        if (!data) {
            return;
        }


        /*
         * WhatsApp is intentionally used here instead
         * of mailto because many mobile devices/PWAs
         * do not have a default email application.
         */

        const messageText = `

CORPORATE MASSAGE PROGRAM REQUEST

Company:
${data.companyName}

Official Email:
${data.officialEmail}

Number of Employees:
${data.employees}

Frequency:
${data.frequency}

Service:
${data.service}

Session Duration:
${data.duration}

Workplace Location:
${data.officeLocation || "Not provided"}

Price Per Employee:
${formatCurrency(
    data.pricePerEmployee
)}

Base Fee:
${formatCurrency(
    data.basePrice
)}

Program Discount:
${data.discountLabel}

Discount Amount:
${formatCurrency(
    data.discountAmount
)}

ESTIMATED PROGRAM FEE:
${formatCurrency(
    data.total
)}

Estimated Annual Program Value:
${formatCurrency(
    data.annualValue
)}

NOTE:
The displayed estimate excludes any applicable
onsite location, transportation or logistics fee.
Such fees will be confirmed separately by
Pax & Pearl Body Works.

Please contact me regarding this corporate
wellness program estimate.
        `.trim();


        const whatsappURL =
            `https://wa.me/${WHATSAPP_NUMBER}` +
            `?text=${encodeURIComponent(
                messageText
            )}`;


        window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
        );


        showMessage(
            "Your corporate request has been prepared. WhatsApp will open so you can send it to Pax & Pearl.",
            "success"
        );

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    form.addEventListener(
        "input",
        updateSummary
    );


    form.addEventListener(
        "change",
        updateSummary
    );


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            submitCorporateRequest();

        }
    );


    downloadButton?.addEventListener(
        "click",
        downloadPDF
    );


    printButton?.addEventListener(
        "click",
        printCalculation
    );


    /* =====================================================
       SAVE BUTTON
       Works with an existing button OR creates one.
    ===================================================== */

    let saveButton =
        modal.querySelector(
            "[data-save-calculation]"
        );


    if (!saveButton) {

        const actions =
            modal.querySelector(
                ".corporate-calculator-actions"
            );


        if (actions) {

            saveButton =
                document.createElement(
                    "button"
                );


            saveButton.type =
                "button";


            saveButton.className =
                "corporate-action-button secondary";


            saveButton.dataset.saveCalculation =
                "";


            saveButton.textContent =
                "Save Estimate";


            saveButton.disabled =
                true;


            actions.appendChild(
                saveButton
            );

        }

    }


    saveButton?.addEventListener(
        "click",
        saveEstimate
    );


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    document
        .querySelectorAll(
            "[data-corporate-calculator-open]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    modal.classList.add(
                        "is-open"
                    );


                    modal.setAttribute(
                        "aria-hidden",
                        "false"
                    );


                    document.body.style.overflow =
                        "hidden";


                    setTimeout(
                        () => {

                            companyName?.focus();

                        },
                        100
                    );

                }
            );

        });


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        modal.classList.remove(
            "is-open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        clearMessage();

    }


    modal
        .querySelectorAll(
            "[data-corporate-calculator-close]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeModal
            );

        });


    /* =====================================================
       BACKDROP CLOSE
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            /*
             * This supports either:
             *
             * 1. modal itself as backdrop
             * 2. a dedicated backdrop element
             */

            if (
                event.target === modal ||
                event.target.closest(
                    ".corporate-calculator-backdrop"
                )
            ) {

                closeModal();

            }

        }
    );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "is-open"
                )
            ) {

                closeModal();

            }

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    loadSavedEstimate();

    updateSummary();


    console.log(
        "Pax & Pearl Corporate Massage Calculator loaded successfully."
    );

});
