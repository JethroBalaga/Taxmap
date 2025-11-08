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
import { getLandAdjustmentData, LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { getSubclassById, SubclassData } from '../../utils/subclassLocalStorage';
import "../../CSS/LandFaasBackModal.css";

interface LandFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  landData?: any;
  formData?: any;
  baseMarketValue?: number;
  landAdjustments?: any[];
  adjustedMarketValue?: number;
  assessmentLevel?: any;
  agriculturalData?: any;
  subclassRates?: any[];
}

const LandFaasBackModal: React.FC<LandFaasBackModalProps> = ({ 
  isOpen,
  onClose,
  landData,
  formData,
  baseMarketValue = 0,
  landAdjustments = [],
  adjustedMarketValue = 0,
  assessmentLevel,
  agriculturalData,
  subclassRates = []
}) => {
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [superseded, setSuperseded] = useState<Record<string, string>>({});
  const [landAdjustmentData, setLandAdjustmentData] = useState<LandAdjustmentData[]>([]);
  const [subclassData, setSubclassData] = useState<SubclassData | null>(null);
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

  // Load land adjustment data AND subclass data
  useEffect(() => {
    const loadData = async () => {
      try {
        const adjustments = await getLandAdjustmentData();
        if (adjustments) {
          setLandAdjustmentData(adjustments);
        }

        if (formData?.subclass) {
          const subclass = await getSubclassById(formData.subclass);
          if (subclass) {
            setSubclassData(subclass);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [formData?.subclass]);

  // Set taxable checkbox based on assessment level
  useEffect(() => {
    if (assessmentLevel && assessmentLevel.rate_percent && assessmentLevel.rate_percent !== '0%') {
      setIsTaxable(true);
      setIsExempt(false);
    } else {
      setIsTaxable(false);
      setIsExempt(true);
    }
  }, [assessmentLevel]);

  // Create PDF content for Land FAAS
  const createPdfContent = useCallback(() => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LAND FAAS - BACK PAGE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // SUBCLASS BREAKDOWN SECTION
    if (subclassRates && subclassRates.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUBCLASS BREAKDOWN', margin, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(8);
      const headers = ['Subclass Description', 'Rate (₱/sqm)', 'Area (sqm)', 'Base Market Value (₱)', 'Adjusted Market Value (₱)'];
      const colWidths = [45, 25, 20, 35, 35];
      
      let xPosition = margin;
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 5;

      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Subclass rows
      pdf.setFont('helvetica', 'normal');
      subclassRates.forEach((rate, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        const area = formData?.area || 0;
        const baseMarketValue = parseFloat(rate.base_market_value) || 0;
        const adjustedMarketValue = parseFloat(rate.adjustment_market_value) || 0;
        
        const rowData = [
          subclassData?.subclass || rate.subclass_description || 'N/A',
          `₱${parseFloat(rate.rate || '0').toFixed(4)}`,
          area.toLocaleString(),
          `₱${baseMarketValue.toLocaleString()}`,
          `₱${adjustedMarketValue.toLocaleString()}`
        ];

        xPosition = margin;
        rowData.forEach((data, index) => {
          pdf.text(data.substring(0, 25), xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 6;
      });

      // Subclass totals
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      const totalBaseValue = subclassRates.reduce((sum, rate) => sum + (parseFloat(rate.base_market_value) || 0), 0);
      const totalAdjustedValue = subclassRates.reduce((sum, rate) => sum + (parseFloat(rate.adjustment_market_value) || 0), 0);
      
      pdf.text('Total', margin + 45 + 25 + 20, yPosition, { align: 'center' });
      pdf.text(`₱${totalBaseValue.toLocaleString()}`, margin + 45 + 25 + 20 + 35, yPosition, { align: 'right' });
      pdf.text(`₱${totalAdjustedValue.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });

      yPosition += 20;
    }

    // VALUE ADJUSTMENT SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VALUE ADJUSTMENT', margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(8);
    const adjHeaders = ['Base Market Value (₱)', 'Adjustment Factor', 'Adjustment Percent', 'Value Adjustment (₱)', 'Market Value (₱)'];
    const adjColWidths = [35, 35, 30, 35, 35];
    
    let xPosition = margin;
    adjHeaders.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += adjColWidths[index];
    });
    yPosition += 5;

    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Adjustment rows
    pdf.setFont('helvetica', 'normal');
    const marketValue = adjustedMarketValue || baseMarketValue || 0;
    
    landAdjustments.forEach((adj, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      const rowData = [
        `₱${baseMarketValue?.toLocaleString() || '0'}`,
        adj.adjustment_type || 'N/A',
        adj.adjustment_factor || '0%',
        `₱${parseFloat(adj.value_adjustment || '0').toLocaleString()}`,
        `₱${marketValue.toLocaleString()}`
      ];

      xPosition = margin;
      rowData.forEach((data, index) => {
        pdf.text(data.substring(0, 20), xPosition, yPosition);
        xPosition += adjColWidths[index];
      });
      yPosition += 6;
    });

    // Add agricultural adjustments if any
    if (agriculturalData) {
      const frontage = parseFloat(agriculturalData.frontage) || 0;
      const weatherRoad = parseFloat(agriculturalData.weather_road) || 0;
      const market = parseFloat(agriculturalData.market) || 0;
      
      if (frontage > 0) {
        const rowData = [
          `₱${baseMarketValue?.toLocaleString() || '0'}`,
          'Frontage',
          `${frontage}%`,
          `₱${(baseMarketValue * (frontage / 100)).toLocaleString()}`,
          `₱${marketValue.toLocaleString()}`
        ];

        xPosition = margin;
        rowData.forEach((data, index) => {
          pdf.text(data.substring(0, 20), xPosition, yPosition);
          xPosition += adjColWidths[index];
        });
        yPosition += 6;
      }
      
      // Add other agricultural adjustments similarly...
    }

    yPosition += 15;

    // PROPERTY ASSESSMENT SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROPERTY ASSESSMENT', margin, yPosition);
    yPosition += 10;

    // Assessment table
    pdf.setFontSize(8);
    const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level', 'Assessed Value'];
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
    const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
    const assessmentValue = assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0;
    
    const assessmentData = [
      actualUse,
      `₱${marketValue.toLocaleString()}`,
      assessmentLevel?.rate_percent || '0%',
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
    pdf.text('Approved by:', margin, yPosition);
    yPosition += 15;

    pdf.line(margin, yPosition, margin + 80, yPosition);
    yPosition += 8;

    pdf.setFontSize(7);
    pdf.text('Municipal Assessor', margin + 40, yPosition, { align: 'center' });

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
  }, [subclassRates, formData, subclassData, landAdjustments, agriculturalData, baseMarketValue, adjustedMarketValue, assessmentLevel, isTaxable, isExempt, currentQuarter, currentYear]);

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
      const filename = `LandFAAS_${timestamp}.pdf`;
      
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

  // Rest of your component (calculations, JSX) remains the same...
  const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
  const marketValue = adjustedMarketValue || baseMarketValue || 0;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Land FAAS - BACK PAGE</IonTitle>
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
          {/* Your existing Land FAAS JSX content */}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LandFaasBackModal;