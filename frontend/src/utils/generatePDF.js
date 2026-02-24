import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF report of the moneystill budget plan
 * Exports the currently visible content based on active tab
 * @param {number} year - The year for the report
 * @returns {Promise<void>}
 */
export async function generatePDF(year) {
    // Create PDF in US Letter landscape format
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 279.4mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 215.9mm
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 18;
    const usableHeight = pageHeight - margin - headerHeight - 5;

    // Store current theme and force light mode for PDF
    const htmlElement = document.documentElement;
    const wasDarkMode = htmlElement.classList.contains('dark');
    if (wasDarkMode) {
        htmlElement.classList.remove('dark');
    }

    // Temporarily hide elements that shouldn't appear in PDF
    const elementsToHide = [
        ...document.querySelectorAll('[data-pdf-hide]'),
        ...document.querySelectorAll('.edit-mode-controls'),
        ...document.querySelectorAll('button'),
        document.querySelector('[data-tab-nav]')
    ].filter(Boolean);

    const originalDisplayStyles = elementsToHide.map(el => ({
        element: el,
        display: el.style.display
    }));

    elementsToHide.forEach(el => {
        el.style.display = 'none';
    });

    // Prepare elements with special PDF styling
    const pdfStyleOverrides = [];

    // Remove truncate and overflow restrictions for full text visibility
    const truncateElements = document.querySelectorAll('.truncate, .text-ellipsis');
    truncateElements.forEach(el => {
        pdfStyleOverrides.push({
            element: el,
            className: el.className,
            styles: {
                overflow: el.style.overflow,
                whiteSpace: el.style.whiteSpace,
                textOverflow: el.style.textOverflow
            }
        });
        el.classList.remove('truncate', 'text-ellipsis');
        el.style.overflow = 'visible';
        el.style.whiteSpace = 'normal';
        el.style.textOverflow = 'clip';
    });

    // Make overflow elements visible
    const overflowElements = document.querySelectorAll('.overflow-y-auto, .overflow-hidden, .max-h-56, [data-pdf-legend]');
    overflowElements.forEach(el => {
        pdfStyleOverrides.push({
            element: el,
            className: el.className,
            styles: {
                overflow: el.style.overflow,
                maxHeight: el.style.maxHeight
            }
        });
        el.style.overflow = 'visible';
        el.style.maxHeight = 'none';
        el.classList.remove('overflow-y-auto', 'overflow-hidden', 'max-h-56');
    });

    // Small delay to let styles recalculate
    await new Promise(resolve => setTimeout(resolve, 200));

    let pageCount = 0;

    try {
        // Check which sections are currently visible (not off-screen)
        const analysisSection = document.querySelector('[data-pdf-analysis]');
        const budgetTable = document.querySelector('[data-pdf-budget-table]');
        const summaryCards = document.querySelector('[data-pdf-summary-cards]');

        // Determine which content is actually visible
        const isAnalysisVisible = analysisSection && isElementVisible(analysisSection);
        const isOverviewVisible = budgetTable && isElementVisible(budgetTable);

        // --- Capture Analysis Section if visible ---
        if (isAnalysisVisible) {
            if (pageCount > 0) pdf.addPage();
            addPDFHeader(pdf, year, margin, pageWidth, margin, false, 'Analysis');

            const canvas = await html2canvas(analysisSection, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc',
                windowWidth: 1400,
                onclone: (clonedDoc, clonedElement) => {
                    clonedElement.style.backgroundColor = '#f8fafc';
                    // Ensure all text is visible in clone
                    clonedElement.querySelectorAll('.truncate, .text-ellipsis').forEach(el => {
                        el.style.overflow = 'visible';
                        el.style.whiteSpace = 'normal';
                        el.style.textOverflow = 'clip';
                    });
                    clonedElement.querySelectorAll('.overflow-y-auto, .overflow-hidden, .max-h-56').forEach(el => {
                        el.style.overflow = 'visible';
                        el.style.maxHeight = 'none';
                    });
                }
            });

            addCanvasToPDF(pdf, canvas, margin, headerHeight, contentWidth, usableHeight);
            pageCount++;
        }

        // --- Capture Overview (Summary Cards + Budget Table) if visible ---
        if (isOverviewVisible) {
            // Capture Budget Table
            if (pageCount > 0) pdf.addPage();
            addPDFHeader(pdf, year, margin, pageWidth, margin, pageCount > 0, 'Budget Table');

            const tableCanvas = await html2canvas(budgetTable, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc',
                windowWidth: 1800,
                onclone: (clonedDoc, clonedElement) => {
                    clonedElement.style.backgroundColor = '#f8fafc';
                    clonedElement.style.width = 'auto';
                    clonedElement.style.maxWidth = 'none';
                }
            });

            addCanvasToPDF(pdf, tableCanvas, margin, headerHeight, contentWidth, usableHeight);
            pageCount++;
        }

        // If nothing was captured, show error
        if (pageCount === 0) {
            pdf.setFontSize(14);
            pdf.text('No content found to export.', margin, 50);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const tabName = isAnalysisVisible ? 'Analysis' : 'Overview';
        pdf.save(`moneystill_${year}_${tabName}_${timestamp}.pdf`);

    } finally {
        // Restore hidden elements
        originalDisplayStyles.forEach(({ element, display }) => {
            element.style.display = display;
        });

        // Restore PDF style overrides
        pdfStyleOverrides.forEach(({ element, className, styles }) => {
            if (className) element.className = className;
            if (styles) {
                Object.entries(styles).forEach(([key, value]) => {
                    element.style[key] = value || '';
                });
            }
        });

        // Restore original theme
        if (wasDarkMode) {
            htmlElement.classList.add('dark');
        }
    }
}

/**
 * Check if an element is actually visible (not positioned off-screen)
 */
function isElementVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Check if hidden or off-screen
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    if (rect.left < -1000 || rect.top < -1000) return false;

    // Check parent as well (for wrapper divs)
    const parent = element.parentElement;
    if (parent) {
        const parentStyle = window.getComputedStyle(parent);
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.left < -1000 || parentRect.top < -1000) return false;
        if (parentStyle.opacity === '0') return false;
    }

    return true;
}

/**
 * Add a canvas image to the PDF, scaled to fit
 */
function addCanvasToPDF(pdf, canvas, margin, headerHeight, contentWidth, usableHeight) {
    const startY = margin + headerHeight + 3;
    const availableHeight = usableHeight;

    const aspectRatio = canvas.width / canvas.height;
    let imgWidth = contentWidth;
    let imgHeight = imgWidth / aspectRatio;

    // If too tall, scale down to fit height
    if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * aspectRatio;
    }

    // Center horizontally if scaled down
    const xOffset = margin + (contentWidth - imgWidth) / 2;
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', xOffset, startY, imgWidth, imgHeight);
}

/**
 * Add styled header to PDF page
 */
function addPDFHeader(pdf, year, margin, pageWidth, startY, isContinuation = false, sectionName = '') {
    const headerHeight = 16;

    // Header background - dark blue
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, headerHeight + 2, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');

    const titleText = sectionName
        ? `moneystill ${year} – ${sectionName}`
        : `moneystill Report ${year}`;
    pdf.text(titleText, margin, startY + 10);

    // Date - right aligned
    const dateStr = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const dateWidth = pdf.getTextWidth(`Generated: ${dateStr}`);
    pdf.text(`Generated: ${dateStr}`, pageWidth - margin - dateWidth, startY + 10);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    return startY + headerHeight + 3;
}

export default generatePDF;
