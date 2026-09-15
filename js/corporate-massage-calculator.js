/* =========================================================
   PAX & PEARL BODY WORKS
   CORPORATE MASSAGE CALCULATOR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.querySelector("[data-corporate-calculator-modal]");

    if (!modal) return;


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
            label: "Bi-annual",
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


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const form = modal.querySelector("[data-corporate-form]");

    const companyName = modal.querySelector("#corporate-company-name");
    const officialEmail = modal.querySelector("#corporate-email");
    const employeeCount = modal.querySelector("#corporate-employees");
    const officeLocation = modal.querySelector("#corporate-location");

    const summaryCompany = modal.querySelector("[data-summary-company]");
    const summaryEmployees = modal.querySelector("[data-summary-employees]");
    const summaryFrequency = modal.querySelector("[data-summary-frequency]");
    const summaryService = modal.querySelector("[data-summary-service]");
    const summaryDuration = modal.querySelector("[data-summary-duration]");
    const summaryBase = modal.querySelector("[data-summary-base]");
    const summaryDiscount = modal.querySelector("[data-summary-discount]");
    const summaryDiscountAmount = modal.querySelector("[data-summary-discount-amount]");
    const summaryTotal = modal.querySelector("[data-summary-total]");
    const summaryAnnual = modal.querySelector("[data-summary-annual]");
    const summaryAnnualLabel = modal.querySelector("[data-summary-annual-label]");

    const locationNotice = modal.querySelector("[data-location-notice]");

    const downloadButton = modal.querySelector("[data-download-pdf]");
    const printButton = modal.querySelector("[data-print-calculation]");
    const submitButton = modal.querySelector("[data-submit-corporate]");

    const message = modal.querySelector("[data-submit-message]");


    /* =====================================================
       HELPERS
    ===================================================== */

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }


    function getSelectedValue(name) {

        const selected = modal.querySelector(
            `input[name="${name}"]:checked`
        );

        return selected ? selected.value : null;
    }


    function getSelectedLabel(name) {

        const selected = modal.querySelector(
            `input[name="${name}"]:checked`
        );

        if (!selected) return "";

        const label = modal.querySelector(
            `label[for="${selected.id}"]`
        );

        if (!label) return selected.value;

        const title = label.querySelector(
            ".corporate-option-title"
        );

        return title
            ? title.textContent.trim()
            : label.textContent.trim();
    }


    function showMessage(text, type = "success") {

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
       CALCULATION
    ===================================================== */

    function calculate() {

        const employees = parseInt(
            employeeCount?.value || 0,
            10
        );

        const duration = getSelectedValue("corporate-duration");

        const frequency = getSelectedValue("corporate-frequency");

        const service = getSelectedValue("corporate-service");

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


        const pricePerEmployee = PRICING[duration];

        const frequencyData = FREQUENCY[frequency];

        const basePrice =
            employees * pricePerEmployee;

        const discountAmount =
            basePrice * frequencyData.discount;

        const discountedPrice =
            basePrice - discountAmount;

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

        const result = calculate();

        if (!result.valid) {

            summaryCompany.textContent =
                companyName?.value.trim() || "Your company";

            summaryEmployees.textContent =
                employeeCount?.value
                    ? `${employeeCount.value} employees`
                    : "—";

            summaryFrequency.textContent =
                result.frequency
                    ? getSelectedLabel("corporate-frequency")
                    : "—";

            summaryService.textContent =
                result.service
                    ? getSelectedLabel("corporate-service")
                    : "—";

            summaryDuration.textContent =
                result.duration
                    ? `${result.duration} minutes`
                    : "—";

            summaryBase.textContent = "—";
            summaryDiscount.textContent = "—";
            summaryDiscountAmount.textContent = "—";
            summaryTotal.textContent = "—";
            summaryAnnual.textContent = "—";

            downloadButton.disabled = true;
            printButton.disabled = true;
            submitButton.disabled = true;

            return;
        }


        summaryCompany.textContent =
            companyName.value.trim() ||
            "Your company";

        summaryEmployees.textContent =
            `${result.employees} employees`;

        summaryFrequency.textContent =
            result.frequencyData.label;

        summaryService.textContent =
            getSelectedLabel("corporate-service");

        summaryDuration.textContent =
            `${result.duration} minutes`;

        summaryBase.textContent =
            formatCurrency(result.basePrice);

        summaryDiscount.textContent =
            `${result.frequencyData.discountLabel} OFF`;

        summaryDiscountAmount.textContent =
            `−${formatCurrency(result.discountAmount)}`;

        summaryTotal.textContent =
            formatCurrency(result.discountedPrice);

        summaryAnnualLabel.textContent =
            `${result.frequencyData.sessionsPerYear} session${
                result.frequencyData.sessionsPerYear > 1
                    ? "s"
                    : ""
            } per year`;

        summaryAnnual.textContent =
            formatCurrency(result.annualProgramValue);


        /* ---------------------------------------------
           Onsite notice
        --------------------------------------------- */

        if (service === "onsite") {

            locationNotice.hidden = false;

            locationNotice.innerHTML = `
                <strong>Onsite service note</strong>
                The estimate above covers the massage/program fee only.
                Any applicable location, transportation or onsite logistics
                fee will be confirmed separately based on the workplace
                location.
            `;

        } else {

            locationNotice.hidden = true;
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

        const requiredFields = [
            companyName,
            officialEmail,
            employeeCount
        ];

        requiredFields.forEach(field => {

            if (!field) return;

            const value = field.value.trim();

            if (!value) {

                field.setAttribute(
                    "aria-invalid",
                    "true"
                );

                valid = false;

            } else {

                field.removeAttribute(
                    "aria-invalid"
                );
            }
        });


        /* ---------------------------------------------
           Email
        --------------------------------------------- */

        if (
            officialEmail &&
            officialEmail.value.trim()
        ) {

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(
                officialEmail.value.trim()
            )) {

                officialEmail.setAttribute(
                    "aria-invalid",
                    "true"
                );

                valid = false;
            }
        }


        /* ---------------------------------------------
           Employee minimum
        --------------------------------------------- */

        const employees =
            parseInt(employeeCount?.value || 0, 10);

        if (employees < 10) {

            employeeCount.setAttribute(
                "aria-invalid",
                "true"
            );

            showMessage(
                "Corporate massage program pricing starts from 10 employees.",
                "error"
            );

            return false;
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

            if (!getSelectedValue(name)) {
                valid = false;
            }
        });


        if (!valid) {

            showMessage(
                "Please complete the required corporate program details.",
                "error"
            );

            return false;
        }


        return true;
    }


    /* =====================================================
       BUILD REPORT DATA
    ===================================================== */

    function getReportData() {

        const result = calculate();

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
                getSelectedLabel("corporate-service"),

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
                officeLocation?.value.trim() || "",

            generatedAt:
                new Date()
        };
    }


    /* =====================================================
       LOAD jsPDF
    ===================================================== */

    async function loadJsPDF() {

        if (window.jspdf?.jsPDF) {
            return window.jspdf.jsPDF;
        }


        return new Promise((resolve, reject) => {

            const script =
                document.createElement("script");

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js";

            script.onload = () => {

                if (window.jspdf?.jsPDF) {
                    resolve(window.jspdf.jsPDF);
                } else {
                    reject(
                        new Error("jsPDF failed to load.")
                    );
                }
            };

            script.onerror = () => {

                reject(
                    new Error("Unable to load PDF library.")
                );
            };

            document.head.appendChild(script);
        });
    }


    /* =====================================================
       DOWNLOAD PDF
    ===================================================== */

    async function downloadPDF() {

        if (!validateForm()) return;

        const result = calculate();

        if (!result.valid) return;

        const data = getReportData();

        downloadButton.disabled = true;

        try {

            const jsPDF = await loadJsPDF();

            const doc = new jsPDF({
                unit: "mm",
                format: "a4"
            });


            const pageWidth =
                doc.internal.pageSize.getWidth();

            let y = 22;


            /* ---------------------------------------------
               Header
            --------------------------------------------- */

            doc.setFillColor(13, 47, 37);

            doc.rect(
                0,
                0,
                pageWidth,
                40,
                "F"
            );

            doc.setTextColor(255, 255, 255);

            doc.setFontSize(18);

            doc.setFont(undefined, "bold");

            doc.text(
                "PAX & PEARL BODY WORKS",
                18,
                17
            );

            doc.setFontSize(10);

            doc.setFont(undefined, "normal");

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


            y = 53;


            /* ---------------------------------------------
               Company
            --------------------------------------------- */

            doc.setTextColor(24, 49, 42);

            doc.setFontSize(13);

            doc.setFont(undefined, "bold");

            doc.text(
                "Corporate Program Estimate",
                18,
                y
            );

            y += 10;

            doc.setFontSize(10);

            doc.setFont(undefined, "normal");

            const details = [
                ["Company", data.companyName],
                ["Official Email", data.officialEmail],
                ["Employees", String(data.employees)],
                ["Frequency", data.frequency],
                ["Service", data.service],
                ["Session Duration", data.duration]
            ];

            details.forEach(([label, value]) => {

                doc.setFont(undefined, "bold");

                doc.text(
                    `${label}:`,
                    18,
                    y
                );

                doc.setFont(undefined, "normal");

                doc.text(
                    String(value),
                    60,
                    y
                );

                y += 7;
            });


            y += 6;


            /* ---------------------------------------------
               Financial breakdown
            --------------------------------------------- */

            doc.setFontSize(13);

            doc.setFont(undefined, "bold");

            doc.text(
                "Fee Breakdown",
                18,
                y
            );

            y += 10;

            doc.setFontSize(10);

            const breakdown = [
                [
                    "Price per employee",
                    formatCurrency(data.pricePerEmployee)
                ],
                [
                    `${data.employees} employees`,
                    formatCurrency(data.basePrice)
                ],
                [
                    `Program discount (${data.discountLabel})`,
                    `-${formatCurrency(data.discountAmount)}`
                ]
            ];

            breakdown.forEach(([label, value]) => {

                doc.setFont(undefined, "normal");

                doc.text(
                    label,
                    18,
                    y
                );

                doc.text(
                    value,
                    pageWidth - 18,
                    y,
                    { align: "right" }
                );

                y += 8;
            });


            /* ---------------------------------------------
               Total box
            --------------------------------------------- */

            y += 4;

            doc.setFillColor(245, 241, 233);

            doc.roundedRect(
                18,
                y,
                pageWidth - 36,
                28,
                4,
                4,
                "F"
            );

            doc.setTextColor(24, 49, 42);

            doc.setFontSize(9);

            doc.setFont(undefined, "normal");

            doc.text(
                "ESTIMATED PROGRAM FEE",
                26,
                y + 10
            );

            doc.setFontSize(18);

            doc.setFont(undefined, "bold");

            doc.text(
                formatCurrency(data.total),
                26,
                y + 20
            );


            y += 39;


            /* ---------------------------------------------
               Annual value
            --------------------------------------------- */

            doc.setFontSize(10);

            doc.setFont(undefined, "normal");

            doc.text(
                `${data.sessionsPerYear} session(s) per year`,
                18,
                y
            );

            y += 7;

            doc.setFont(undefined, "bold");

            doc.text(
                `Estimated annual program value: ${formatCurrency(data.annualValue)}`,
                18,
                y
            );


            /* ---------------------------------------------
               Onsite notice
            --------------------------------------------- */

            if (data.service.toLowerCase().includes("onsite")) {

                y += 14;

                doc.setFont(undefined, "bold");

                doc.setFontSize(9);

                doc.text(
                    "ONSITE SERVICE NOTE",
                    18,
                    y
                );

                y += 6;

                doc.setFont(undefined, "normal");

                const notice =
                    "The estimate covers the massage/program fee only. " +
                    "Any applicable location, transportation or onsite " +
                    "logistics fee will be confirmed separately based " +
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

                y += wrapped.length * 4.5;
            }


            /* ---------------------------------------------
               Footer
            --------------------------------------------- */

            const footerY =
                doc.internal.pageSize.getHeight() - 22;

            doc.setDrawColor(201, 162, 39);

            doc.line(
                18,
                footerY - 6,
                pageWidth - 18,
                footerY - 6
            );

            doc.setFontSize(8);

            doc.setTextColor(101, 115, 109);

            doc.setFont(undefined, "normal");

            doc.text(
                "Pax & Pearl Body Works",
                18,
                footerY
            );

            doc.text(
                "+234 706 430 2016 | +234 812 227 0495",
                pageWidth - 18,
                footerY,
                { align: "right" }
            );


            /* ---------------------------------------------
               Generated date
            --------------------------------------------- */

            const dateText =
                data.generatedAt.toLocaleDateString(
                    "en-NG",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );

            doc.setFontSize(7);

            doc.text(
                `Estimate generated ${dateText}`,
                18,
                footerY + 5
            );


            /* ---------------------------------------------
               Download
            --------------------------------------------- */

            const safeCompany =
                data.companyName
                    .replace(/[^a-z0-9]/gi, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "")
                    .toLowerCase();

            doc.save(
                `Pax-and-Pearl-Corporate-Massage-Estimate-${safeCompany || "Company"}.pdf`
            );


        } catch (error) {

            console.error(
                "Corporate PDF error:",
                error
            );

            showMessage(
                "The PDF could not be generated. Please try the Print option instead.",
                "error"
            );

        } finally {

            downloadButton.disabled = false;
        }
    }


    /* =====================================================
       PRINT
    ===================================================== */

    function printCalculation() {

        if (!validateForm()) return;

        const data = getReportData();

        const result =
            calculate();

        if (!result.valid) return;


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=850,height=900"
            );

        if (!printWindow) {

            showMessage(
                "Please allow pop-ups to print the estimate.",
                "error"
            );

            return;
        }


        printWindow.document.write(`
            <!DOCTYPE html>

            <html lang="en-NG">

            <head>

                <meta charset="UTF-8">

                <title>
                    Pax & Pearl Corporate Massage Estimate
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 40px;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                        color: #18312a;
                    }

                    .header {
                        padding: 24px;
                        background: #0d2f25;
                        color: white;
                    }

                    h1 {
                        margin: 0 0 6px;
                        font-size: 22px;
                    }

                    h2 {
                        margin-top: 32px;
                        font-size: 17px;
                    }

                    .muted {
                        color: #65736d;
                    }

                    .row {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        padding: 10px 0;
                        border-bottom: 1px solid #ddd5c8;
                    }

                    .total {
                        margin-top: 24px;
                        padding: 20px;
                        background: #f5f1e9;
                        border-top: 3px solid #c9a227;
                    }

                    .total strong {
                        display: block;
                        margin-top: 8px;
                        font-size: 25px;
                    }

                    .notice {
                        margin-top: 24px;
                        padding: 15px;
                        background: #faf5e7;
                        border-left: 3px solid #c9a227;
                        font-size: 13px;
                        line-height: 1.6;
                    }

                    footer {
                        margin-top: 50px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd5c8;
                        font-size: 11px;
                        color: #65736d;
                    }

                </style>

            </head>

            <body>

                <div class="header">

                    <h1>
                        PAX & PEARL BODY WORKS
                    </h1>

                    <div>
                        Corporate Massage Program
                        — Management Estimate
                    </div>

                </div>


                <h2>
                    Company Details
                </h2>

                <div class="row">
                    <span>Company</span>
                    <strong>${escapeHTML(data.companyName)}</strong>
                </div>

                <div class="row">
                    <span>Official Email</span>
                    <strong>${escapeHTML(data.officialEmail)}</strong>
                </div>

                <div class="row">
                    <span>Employees</span>
                    <strong>${data.employees}</strong>
                </div>

                <div class="row">
                    <span>Frequency</span>
                    <strong>${escapeHTML(data.frequency)}</strong>
                </div>

                <div class="row">
                    <span>Service</span>
                    <strong>${escapeHTML(data.service)}</strong>
                </div>

                <div class="row">
                    <span>Session</span>
                    <strong>${escapeHTML(data.duration)}</strong>
                </div>


                <h2>
                    Fee Breakdown
                </h2>

                <div class="row">
                    <span>Price per employee</span>
                    <strong>${formatCurrency(data.pricePerEmployee)}</strong>
                </div>

                <div class="row">
                    <span>${data.employees} employees</span>
                    <strong>${formatCurrency(data.basePrice)}</strong>
                </div>

                <div class="row">
                    <span>${data.discountLabel} program discount</span>
                    <strong>-${formatCurrency(data.discountAmount)}</strong>
                </div>


                <div class="total">

                    Estimated Program Fee

                    <strong>
                        ${formatCurrency(data.total)}
                    </strong>

                </div>


                <p>
                    ${data.sessionsPerYear}
                    session(s) per year
                </p>

                <p>
                    <strong>
                        Estimated annual program value:
                        ${formatCurrency(data.annualValue)}
                    </strong>
                </p>


                ${
                    data.service
                        .toLowerCase()
                        .includes("onsite")
                    ?
                    `
                    <div class="notice">

                        <strong>
                            Onsite Service Note
                        </strong>

                        <br>

                        The estimate covers the
                        massage/program fee only.
                        Any applicable location,
                        transportation or onsite
                        logistics fee will be confirmed
                        separately based on the
                        workplace location.

                    </div>
                    `
                    :
                    ""
                }


                <footer>

                    Pax & Pearl Body Works<br>

                    +234 706 430 2016 |
                    +234 812 227 0495<br>

                    Festac Town, Lagos

                </footer>


                <script>

                    window.onload = function () {
                        window.print();
                    };

                    function escapeHTML(value) {
                        return String(value)
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    }

                <\/script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       CORPORATE ENQUIRY
    ===================================================== */

    async function submitCorporateRequest() {

        if (!validateForm()) return;

        const data = getReportData();

        /*
         * IMPORTANT:
         *
         * Replace this section with the actual Pax & Pearl
         * backend/API endpoint once confirmed.
         *
         * Do NOT put private API keys in this JavaScript.
         */

        const payload = {
            type: "corporate_massage_request",

            companyName:
                data.companyName,

            officialEmail:
                data.officialEmail,

            employees:
                data.employees,

            frequency:
                data.frequency,

            service:
                data.service,

            duration:
                data.duration,

            pricePerEmployee:
                data.pricePerEmployee,

            basePrice:
                data.basePrice,

            discount:
                data.discountLabel,

            discountAmount:
                data.discountAmount,

            estimatedFee:
                data.total,

            annualProgramValue:
                data.annualValue,

            officeLocation:
                data.officeLocation
        };


        console.log(
            "Corporate enquiry:",
            payload
        );


        /*
         * TEMPORARY BEHAVIOUR
         *
         * Until the backend endpoint is connected,
         * create an email enquiry using mailto.
         *
         * This should eventually be replaced by
         * fetch("/api/corporate-enquiry", {...})
         */

        const subject =
            encodeURIComponent(
                `Corporate Massage Enquiry — ${data.companyName}`
            );

        const body =
            encodeURIComponent(
`
CORPORATE MASSAGE ENQUIRY

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

Price Per Employee:
${formatCurrency(data.pricePerEmployee)}

Base Fee:
${formatCurrency(data.basePrice)}

Discount:
${data.discountLabel}

Discount Amount:
${formatCurrency(data.discountAmount)}

ESTIMATED PROGRAM FEE:
${formatCurrency(data.total)}

Estimated Annual Program Value:
${formatCurrency(data.annualValue)}

Office Location:
${data.officeLocation || "Not provided"}

NOTE:
The displayed estimate excludes any applicable
onsite location/transportation/logistics fee.
Such fee will be confirmed separately by
Pax & Pearl Body Works.
`
            );


        window.location.href =
            `mailto:paxandpearlbodyworks@gmail.com?subject=${subject}&body=${body}`;


        showMessage(
            "Your corporate enquiry has been prepared. Please send the email that opens.",
            "success"
        );
    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    form?.addEventListener(
        "input",
        updateSummary
    );

    form?.addEventListener(
        "change",
        updateSummary
    );


    form?.addEventListener(
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
       OPEN MODAL
    ===================================================== */

    document.querySelectorAll(
        "[data-corporate-calculator-open]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                modal.classList.add("is-open");

                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

                document.body.style.overflow =
                    "hidden";

                setTimeout(() => {

                    companyName?.focus();

                }, 100);
            }
        );
    });


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

        modal.classList.remove("is-open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        clearMessage();
    }


    modal.querySelectorAll(
        "[data-corporate-calculator-close]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            closeModal
        );
    });


    /* =====================================================
       CLICK BACKDROP TO CLOSE
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        }
    );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains("is-open")
            ) {
                closeModal();
            }
        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updateSummary();

});
