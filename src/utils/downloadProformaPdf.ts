import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/** Safe PDF filename from a proforma number, e.g. PF/SZK-MF-PK/10/2026 → proforma-PF-SZK-MF-PK-10-2026.pdf */
export const proformaPdfFileName = (number: string): string => {
	const safe = number
		.trim()
		.replace(/[\\/]+/g, '-')
		.replace(/[^a-zA-Z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return `proforma-${safe || 'dokument'}.pdf`;
};

/**
 * Renders `element` to an A4 PDF and triggers a browser download.
 * Prefer passing the invoice card only (no chrome / download button).
 */
export const downloadProformaPdf = async (element: HTMLElement, number: string): Promise<void> => {
	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		allowTaint: false,
		backgroundColor: '#ffffff',
		logging: false,
	});

	const imgData = canvas.toDataURL('image/png');
	const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 10;
	const contentWidth = pageWidth - margin * 2;
	const contentHeight = (canvas.height * contentWidth) / canvas.width;

	let heightLeft = contentHeight;
	let position = margin;

	pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
	heightLeft -= pageHeight - margin * 2;

	while (heightLeft > 0) {
		position = margin - (contentHeight - heightLeft);
		pdf.addPage();
		pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
		heightLeft -= pageHeight - margin * 2;
	}

	pdf.save(proformaPdfFileName(number));
};
