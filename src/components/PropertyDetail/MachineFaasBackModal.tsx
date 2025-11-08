import React, { useState, useEffect, useCallback } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons
} from "@ionic/react";
import { documentOutline, close } from "ionicons/icons";
import { jsPDF } from 'jspdf';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import "../../CSS/MachineFaasBack.css";

const ROW_ITEMS = 10;
const ROW_ASSESSMENT = 4;

interface MachineFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineData?: any;
  formData?: any;
  baseMarketValue?: number;
  machineAdjustments?: any[];
  adjustedMarketValue?: number;
  assessmentLevel?: any;
}

const MachineFaasBackModal: React.FC<MachineFaasBackModalProps> = ({ 
  isOpen,
  onClose,
  machineData, 
  formData, 
  baseMarketValue, 
  adjustedMarketValue,
  assessmentLevel 
}) => {
  const [appraisal, setAppraisal] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Get current quarter and year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setCurrentQuarter("1");
    setCurrentYear(year.toString());
  }, []);

  // Set taxable checkbox based on assessment level
  useEffect(() => {
    if (assessmentLevel && assessmentLevel !== '0%' && assessmentLevel !== 'N/A') {
      setIsTaxable(true);
      setIsExempt(false);
    } else {
      setIsTaxable(false);
      setIsExempt(true);
    }
  }, [assessmentLevel]);

  // Create PDF content using jsPDF only
  const createPdfContent = useCallback(() => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Machinery FAAS - BACK PAGE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // PROPERTY APPRAISAL SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROPERTY APPRAISAL', margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const headers = ['Description', 'Type', 'Units', 'Unit Value', 'Base Market Value (₱)', '% Depn.', 'Depreciation Cost (₱)', 'Market Value (₱)'];
    const colWidths = [30, 18, 12, 18, 25, 12, 25, 22];
    
    let xPosition = margin;
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 5;

    // Add horizontal line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Machine data row
    pdf.setFont('helvetica', 'normal');
    const machineDescription = machineData?.machineDescription || machineData?.selectedEquipment || 'N/A';
    const totalBaseValue = baseMarketValue || 0;
    const depreciationRate = parseFloat(machineData?.depreciation) || 0;
    const depreciationCost = totalBaseValue * (depreciationRate / 100);
    const marketValue = adjustedMarketValue || (totalBaseValue - depreciationCost);

    const rowData = [
      machineDescription,
      'Machinery',
      machineData?.numberOfUnits || '1',
      `₱${totalBaseValue.toLocaleString()}`,
      `₱${totalBaseValue.toLocaleString()}`,
      `${depreciationRate}%`,
      `₱${depreciationCost.toLocaleString()}`,
      `₱${marketValue.toLocaleString()}`
    ];

    xPosition = margin;
    rowData.forEach((data, index) => {
      pdf.text(data.substring(0, 20), xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 15;

    // Empty rows
    for (let i = 0; i < 5; i++) {
      xPosition = margin;
      headers.forEach((_, index) => {
        pdf.text('', xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 6;
    }

    // Subtotal row
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sub-total', margin, yPosition);
    pdf.text(`${machineData?.numberOfUnits || '1'} units`, margin + 30 + 18, yPosition, { align: 'right' });
    pdf.text(`₱${totalBaseValue.toLocaleString()}`, margin + 30 + 18 + 12 + 18, yPosition, { align: 'right' });
    pdf.text(`₱${depreciationCost.toLocaleString()}`, margin + 30 + 18 + 12 + 18 + 25 + 12, yPosition, { align: 'right' });
    pdf.text(`₱${marketValue.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });

    yPosition += 20;

    // COMBINED TOTALS SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMBINED TOTALS', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(9);
    pdf.text('TOTAL UNITS', margin, yPosition);
    pdf.text(`${machineData?.numberOfUnits || '1'} units`, margin + 40, yPosition);
    
    pdf.text('TOTAL BASE MARKET VALUE', margin + 60, yPosition);
    pdf.text(`₱${totalBaseValue.toLocaleString()}`, margin + 120, yPosition);
    
    pdf.text('TOTAL DEPRECIATION', margin + 140, yPosition);
    pdf.text(`₱${depreciationCost.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    yPosition += 8;

    pdf.text('GRAND TOTAL', margin + 140, yPosition);
    pdf.text(`₱${marketValue.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });

    yPosition += 20;

    // PROPERTY ASSESSMENT SECTION
    pdf.setFontSize(12);
    pdf.text('PROPERTY ASSESSMENT', margin, yPosition);
    yPosition += 10;

    // Assessment table headers
    pdf.setFontSize(8);
    const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level (%)', 'Assessment Value'];
    const assessmentColWidths = [40, 50, 40, 40];
    
    xPosition = margin;
    assessmentHeaders.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += assessmentColWidths[index];
    });
    yPosition += 5;

    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Assessment data
    pdf.setFont('helvetica', 'normal');
    const actualUse = formData?.actualUse || 'N/A';
    const assessmentValue = calculateAssessmentValue(marketValue, assessmentLevel || '0%');
    
    const assessmentData = [
      actualUse,
      `₱${marketValue.toLocaleString()}`,
      assessmentLevel || '0%',
      `₱${assessmentValue.toLocaleString()}`
    ];

    xPosition = margin;
    assessmentData.forEach((data, index) => {
      pdf.text(data, xPosition, yPosition);
      xPosition += assessmentColWidths[index];
    });

    yPosition += 20;

    // TAXABLE/EXEMPT SECTION
    pdf.setFontSize(9);
    pdf.text(`Taxable: ${isTaxable ? '☒' : '☐'}`, margin, yPosition);
    pdf.text(`Exempt: ${isExempt ? '☒' : '☐'}`, margin + 40, yPosition);
    pdf.text(`Effectivity of Assessment: ${currentQuarter} Qtr. ${currentYear} Yr.`, margin + 80, yPosition);

    yPosition += 15;

    // SIGNATURE SECTION
    pdf.text('Appraised by:', margin, yPosition);
    pdf.text('Approved by:', pageWidth - margin - 60, yPosition);
    yPosition += 15;

    // Signature lines
    pdf.line(margin, yPosition, margin + 80, yPosition);
    pdf.line(pageWidth - margin - 80, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(7);
    pdf.text('Acting Provincial Assessor', pageWidth - margin - 80, yPosition, { align: 'center' });

    yPosition += 15;

    // MEMORANDA
    pdf.setFontSize(8);
    pdf.text('MEMORANDA:', margin, yPosition);
    yPosition += 5;
    pdf.text('Date of Entry in the Record of Assessment ______ By: ____________', margin, yPosition);

    // POWERED BY
    yPosition += 10;
    pdf.setFontSize(6);
    pdf.text('Powered by: SPIDC', pageWidth - margin - 5, yPosition, { align: 'right' });

    return pdf;
  }, [machineData, formData, baseMarketValue, adjustedMarketValue, assessmentLevel, isTaxable, isExempt, currentQuarter, currentYear]);

  // Calculate assessment value
  const calculateAssessmentValue = useCallback((marketValue: number, assessmentRate: string): number => {
    if (!assessmentRate || assessmentRate === 'N/A') return 0;
    
    let rateDecimal: number;
    if (assessmentRate.includes('%')) {
      rateDecimal = parseFloat(assessmentRate.replace('%', '')) / 100;
    } else {
      rateDecimal = parseFloat(assessmentRate);
    }
    
    if (isNaN(rateDecimal)) return 0;
    
    return Math.round(marketValue * rateDecimal);
  }, []);

  // Generate PDF and save to filesystem
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Create PDF
      const pdf = createPdfContent();
      
      // Convert to Base64
      const pdfBase64 = pdf.output('datauristring');
      const base64Data = pdfBase64.split(',')[1];
      
      // Generate filename with timestamp
      const timestamp = new Date().getTime();
      const filename = `MachineFAAS_${timestamp}.pdf`;
      
      // Save to filesystem
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      console.log('PDF saved at:', result.uri);
      
      // Open the PDF file
      await FileOpener.openFile({
        path: result.uri
      });
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [isGeneratingPdf, createPdfContent]);

  // Rest of your component remains the same...
  const formatCurrency = useCallback((value: number) => {
    if (isNaN(value)) return '₱0.00';
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const totalBaseValue = baseMarketValue || 0;
  const depreciationRate = parseFloat(machineData?.depreciation) || 0;
  const depreciationCost = totalBaseValue * (depreciationRate / 100);
  const marketValue = adjustedMarketValue || (totalBaseValue - depreciationCost);
  const assessmentValue = calculateAssessmentValue(marketValue, assessmentLevel || '0%');
  const machineDescription = machineData?.machineDescription || machineData?.selectedEquipment || 'N/A';
  const actualUse = formData?.actualUse || 'N/A';

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Machinery FAAS - BACK PAGE</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={generatePdf} 
              className={`generate-pdf-btn ${isGeneratingPdf ? 'loading' : ''}`}
              disabled={isGeneratingPdf}
            >
              <IonIcon icon={documentOutline} slot="start" />
              {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
            </IonButton>
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="sheet">
          {/* Your existing JSX content */}
          <div className="section-header">PROPERTY APPRAISAL</div>
          <table className="table appraisal-table">
            {/* Your table content */}
          </table>
          {/* Rest of your JSX */}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineFaasBackModal;