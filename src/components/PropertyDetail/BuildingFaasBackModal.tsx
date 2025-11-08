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
import { getBuildingCodesByStructureCode } from '../../utils/buildingCodeLocalStorage';
import { getBuildingSubcomponentById, BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';
import { getBuildingComponentById } from '../../utils/buildingComponentLocalStorage';
import "../../CSS/BuildingFaasBack.css";

const ROW_ITEMS = 10;
const ROW_ASSESSMENT = 4;

interface BuildingFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingData?: any;
  formData?: any;
  baseMarketValue?: number;
  buildingAdjustments?: any[];
  adjustedMarketValue?: number;
  assessmentLevel?: any;
}

const BuildingFaasBackModal: React.FC<BuildingFaasBackModalProps> = ({ 
  isOpen,
  onClose,
  buildingData, 
  formData, 
  baseMarketValue, 
  buildingAdjustments = [],
  adjustedMarketValue,
  assessmentLevel 
}) => {
  const [appraisal, setAppraisal] = useState<Record<string, string>>({});
  const [addItems, setAddItems] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [buildingCodeData, setBuildingCodeData] = useState<any>(null);
  const [subcomponentData, setSubcomponentData] = useState<BuildingSubcomponentData[]>([]);
  const [componentData, setComponentData] = useState<Map<string, string>>(new Map());
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
    if (assessmentLevel && assessmentLevel.rate_percent && assessmentLevel.rate_percent !== '0%') {
      setIsTaxable(true);
      setIsExempt(false);
    } else {
      setIsTaxable(false);
      setIsExempt(true);
    }
  }, [assessmentLevel]);

  // Load building code data
  useEffect(() => {
    const loadBuildingCodeData = async () => {
      if (buildingData?.structureType) {
        const codes = await getBuildingCodesByStructureCode(buildingData.structureType);
        if (codes && codes.length > 0) {
          setBuildingCodeData(codes[0]);
        }
      }
    };
    loadBuildingCodeData();
  }, [buildingData]);

  // Load subcomponent data and component data for building adjustments
  useEffect(() => {
    const loadSubcomponentAndComponentData = async () => {
      if (buildingAdjustments && buildingAdjustments.length > 0) {
        const subcomData: BuildingSubcomponentData[] = [];
        const compData = new Map<string, string>();
        
        for (const adjustment of buildingAdjustments) {
          if (adjustment.buidlingsubcomponent) {
            const subcom = await getBuildingSubcomponentById(adjustment.buidlingsubcomponent);
            if (subcom) {
              subcomData.push(subcom);
              
              const component = await getBuildingComponentById(subcom.building_com_id);
              if (component) {
                compData.set(subcom.building_subcom_id, component.description);
              }
            }
          }
        }
        setSubcomponentData(subcomData);
        setComponentData(compData);
      }
    };
    loadSubcomponentAndComponentData();
  }, [buildingAdjustments]);

  // Create PDF content for Building FAAS
  const createPdfContent = useCallback(() => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const margin = 15; // Smaller margin for more space
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BUILDING FAAS - BACK PAGE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // PROPERTY APPRAISAL SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROPERTY APPRAISAL', margin, yPosition);
    yPosition += 10;

    // Table headers - compressed for building data
    pdf.setFontSize(7); // Smaller font for more columns
    pdf.setFont('helvetica', 'bold');
    const headers = ['Description', 'Type', 'Area', 'Unit Value', '% Compl.', 'Base Value', '% Depn.', 'Depn. Cost', 'Market Value'];
    const colWidths = [25, 15, 12, 15, 12, 20, 10, 20, 20];
    
    let xPosition = margin;
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 5;

    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Building data rows
    pdf.setFont('helvetica', 'normal');
    const numberOfStoreys = buildingData?.storey ? parseInt(buildingData.storey) : 1;
    const areaValue = formData?.area ? parseFloat(formData.area) : 0;
    const depreciationRate = buildingData?.depreciationRate || 0;
    const constructionPercent = buildingData?.constructionPercent || 100;
    
    const storeyBaseValue = baseMarketValue ? baseMarketValue / numberOfStoreys : 0;
    const afterConstruction = storeyBaseValue * (constructionPercent / 100);
    const depreciationCost = afterConstruction * (depreciationRate / 100);
    const marketValue = afterConstruction - depreciationCost;

    // Storey rows
    for (let storey = 1; storey <= numberOfStoreys; storey++) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      const areaPerStorey = (areaValue / numberOfStoreys).toFixed(2);
      const rowData = [
        `${buildingCodeData?.description || 'Building'} - S${storey}`,
        buildingData?.structureType || 'N/A',
        areaPerStorey,
        buildingCodeData?.rate ? `₱${buildingCodeData.rate}` : 'N/A',
        constructionPercent.toString(),
        `₱${storeyBaseValue.toLocaleString()}`,
        depreciationRate.toString(),
        `₱${depreciationCost.toLocaleString()}`,
        `₱${marketValue.toLocaleString()}`
      ];

      xPosition = margin;
      rowData.forEach((data, index) => {
        pdf.text(data.substring(0, 15), xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 6;
    }

    // Subtotal row
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    const totalDepreciationCost = depreciationCost * numberOfStoreys;
    const totalMarketValue = marketValue * numberOfStoreys;
    
    pdf.text('Sub-total', margin, yPosition);
    pdf.text(`${areaValue.toFixed(2)}`, margin + 25 + 15, yPosition, { align: 'right' });
    pdf.text(`₱${baseMarketValue?.toLocaleString() || '0'}`, margin + 25 + 15 + 12 + 15 + 12, yPosition, { align: 'right' });
    pdf.text(`₱${totalDepreciationCost.toLocaleString()}`, margin + 25 + 15 + 12 + 15 + 12 + 20 + 10, yPosition, { align: 'right' });
    pdf.text(`₱${totalMarketValue.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });

    yPosition += 20;

    // ADDITIONAL ITEMS SECTION
    if (buildingAdjustments && buildingAdjustments.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ADDITIONAL ITEMS:', margin, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      xPosition = margin;
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 5;

      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Additional items rows
      pdf.setFont('helvetica', 'normal');
      buildingAdjustments.forEach((adjustment, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        const subcom = subcomponentData.find(s => s.building_subcom_id === adjustment.buidlingsubcomponent);
        const componentDescription = componentData.get(adjustment.buidlingsubcomponent) || "";
        const area = adjustment.area || 0;
        const completionPercent = adjustment.completion_percent || '0';
        const unitValue = subcom?.rate || 0;
        const depreciation = adjustment.depreciation || '0';
        
        let baseValue = 0;
        if (subcom?.percent) {
          baseValue = (baseMarketValue || 0) * (unitValue / 100);
        } else {
          baseValue = area * unitValue;
        }
        
        const afterCompletion = baseValue * (parseFloat(completionPercent) / 100);
        const depreciationCost = afterCompletion * (parseFloat(depreciation) / 100);
        const itemMarketValue = afterCompletion - depreciationCost;

        const rowData = [
          componentDescription.substring(0, 20),
          subcom?.description?.substring(0, 10) || 'N/A',
          area.toString(),
          unitValue.toString(),
          completionPercent,
          `₱${baseValue.toLocaleString()}`,
          depreciation,
          `₱${depreciationCost.toLocaleString()}`,
          `₱${itemMarketValue.toLocaleString()}`
        ];

        xPosition = margin;
        rowData.forEach((data, index) => {
          pdf.text(data.substring(0, 12), xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 6;
      });

      yPosition += 15;
    }

    // COMBINED TOTALS SECTION
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMBINED TOTALS', margin, yPosition);
    yPosition += 15;

    // Calculate combined totals
    const additionalItemsTotals = calculateAdditionalItemsTotals();
    const combinedTotalMarketValue = totalMarketValue + additionalItemsTotals.totalMarketValue;

    pdf.setFontSize(9);
    pdf.text('TOTAL AREA', margin, yPosition);
    pdf.text(`${areaValue.toFixed(2)} sqm`, margin + 30, yPosition);
    
    pdf.text('TOTAL BASE MARKET VALUE', margin + 60, yPosition);
    pdf.text(`₱${baseMarketValue?.toLocaleString() || '0'}`, margin + 120, yPosition);
    
    pdf.text('GRAND TOTAL', margin + 140, yPosition);
    pdf.text(`₱${combinedTotalMarketValue.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });

    yPosition += 20;

    // PROPERTY ASSESSMENT SECTION
    pdf.setFontSize(12);
    pdf.text('PROPERTY ASSESSMENT', margin, yPosition);
    yPosition += 10;

    // Assessment table
    pdf.setFontSize(8);
    const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level (%)', 'Assessment Value'];
    const assessmentColWidths = [35, 45, 35, 35];
    
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
    const actualUse = formData?.actualUse || buildingData?.actual_use || 'N/A';
    const assessmentValue = calculateAssessmentValue(combinedTotalMarketValue, assessmentLevel?.rate_percent || '0%');
    
    const assessmentData = [
      actualUse,
      `₱${combinedTotalMarketValue.toLocaleString()}`,
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
    pdf.text(`Effectivity: ${currentQuarter} Qtr. ${currentYear}`, margin + 80, yPosition);

    yPosition += 15;

    // SIGNATURE SECTION
    pdf.text('Appraised by:', margin, yPosition);
    pdf.text('Approved by:', pageWidth - margin - 60, yPosition);
    yPosition += 15;

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
    pdf.text('Date of Entry ______ By: ____________', margin, yPosition);

    // POWERED BY
    yPosition += 10;
    pdf.setFontSize(6);
    pdf.text('Powered by: SPIDC', pageWidth - margin - 5, yPosition, { align: 'right' });

    return pdf;
  }, [buildingData, formData, baseMarketValue, buildingAdjustments, assessmentLevel, subcomponentData, componentData, buildingCodeData, isTaxable, isExempt, currentQuarter, currentYear]);

  // Calculate additional items totals
  const calculateAdditionalItemsTotals = useCallback(() => {
    let totalArea = 0;
    let totalBaseValue = 0;
    let totalDepreciationCost = 0;
    let totalMarketValue = 0;

    buildingAdjustments.forEach((adjustment) => {
      const subcom = subcomponentData.find(s => s.building_subcom_id === adjustment.buidlingsubcomponent);
      const area = adjustment.area || 0;
      const completionPercent = adjustment.completion_percent || '0';
      const unitValue = subcom?.rate || 0;
      const depreciation = adjustment.depreciation || '0';
      
      let baseValue = 0;
      if (subcom?.percent) {
        baseValue = (baseMarketValue || 0) * (unitValue / 100);
      } else {
        baseValue = area * unitValue;
      }
      
      const afterCompletion = baseValue * (parseFloat(completionPercent) / 100);
      const depreciationCost = afterCompletion * (parseFloat(depreciation) / 100);
      const marketValue = afterCompletion - depreciationCost;

      totalArea += area;
      totalBaseValue += baseValue;
      totalDepreciationCost += depreciationCost;
      totalMarketValue += marketValue;
    });

    return { totalArea, totalBaseValue, totalDepreciationCost, totalMarketValue };
  }, [buildingAdjustments, subcomponentData, baseMarketValue]);

  // Calculate assessment value
  const calculateAssessmentValue = useCallback((marketValue: number, assessmentRate: string): number => {
    if (!assessmentRate) return 0;
    
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
      const filename = `BuildingFAAS_${timestamp}.pdf`;
      
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

  // Rest of your component (JSX) remains the same...
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Building FAAS - BACK PAGE</IonTitle>
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
          {/* Your existing Building FAAS JSX content */}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingFaasBackModal;