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
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { getBuildingCodeByCode, getBuildingCodesByStructureCode } from '../../utils/buildingCodeLocalStorage';
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

  // Universal PDF handling for both native and web
  const saveAndOpenPdf = async (pdfBlob: Blob) => {
    try {
      // Check if we're in a native Capacitor environment
      const isNative = (window as any).Capacitor?.isNativePlatform();
      
      if (isNative) {
        // NATIVE: Convert to base64 and save to filesystem
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 data without the data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(pdfBlob);
        });

        const timestamp = new Date().getTime();
        const fileName = `BuildingFAAS_${timestamp}.pdf`;

        // Write file to documents directory
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        console.log('PDF saved to:', result.uri);

        // Open the file using FileOpener
        try {
          await FileOpener.openFile({ 
            path: result.uri
          });
        } catch (openError) {
          console.error('Error opening file:', openError);
          // Fallback: try with just the filename
          try {
            await FileOpener.openFile({ 
              path: fileName 
            });
          } catch (fallbackError) {
            console.error('Fallback open also failed:', fallbackError);
            throw new Error('Cannot open PDF file');
          }
        }
      } else {
        // WEB: Use blob URL and open in new tab
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (!newWindow) {
          alert('Please allow popups for this site to view the PDF directly in the browser.');
        }
        
        // Clean up URL after some time
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      }
    } catch (error) {
      console.error('Error in saveAndOpenPdf:', error);
      
      // Ultimate fallback for both platforms
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        alert('Please allow popups for this site to view the PDF.');
      }
      
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    }
  };

  // Pure jsPDF generation for Building FAAS
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const numberOfStoreys = buildingData?.storey ? parseInt(buildingData.storey) : 1;
      const areaValue = formData?.area ? parseFloat(formData.area) : 0;
      const depreciationRate = buildingData?.depreciationRate !== null && buildingData?.depreciationRate !== undefined 
        ? buildingData.depreciationRate 
        : 0;
      const constructionPercent = buildingData?.constructionPercent !== null && buildingData?.constructionPercent !== undefined 
        ? buildingData.constructionPercent 
        : 100;
      const actualUse = formData?.actualUse || buildingData?.actual_use || 'N/A';

      // Calculate values
      const storeyBaseValue = baseMarketValue ? baseMarketValue / numberOfStoreys : 0;
      const afterConstruction = storeyBaseValue * (constructionPercent / 100);
      const depreciationCost = afterConstruction * (depreciationRate / 100);
      const marketValue = afterConstruction - depreciationCost;
      
      const totalDepreciationCost = depreciationCost * numberOfStoreys;
      const totalMarketValue = marketValue * numberOfStoreys;

      // Calculate additional items totals
      const additionalItemsTotals = calculateAdditionalItemsTotals();
      const combinedTotalMarketValue = totalMarketValue + additionalItemsTotals.totalMarketValue;
      const assessmentValue = calculateAssessmentValue(combinedTotalMarketValue, assessmentLevel?.rate_percent || '0%');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Building FAAS - BACK PAGE', 105, 20, { align: 'center' });

      let yPosition = 40;

      // PROPERTY APPRAISAL SECTION
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROPERTY APPRAISAL', 20, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Description', 'Type', 'Area (sq.m.)', 'Unit Value', '% Completion (BUCC)', 'Base Market Value (₱)', '% Depn.', 'Depreciation Cost (₱)', 'Market Value (₱)'];
      
      let xPosition = 20;
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += index === 0 ? 25 : 20;
      });
      yPosition += 5;

      // Storey rows
      pdf.setFont('helvetica', 'normal');
      for (let storey = 1; storey <= numberOfStoreys; storey++) {
        const areaPerStorey = areaValue > 0 ? (areaValue / numberOfStoreys).toFixed(2) : '0';
        
        const rowData = [
          `${buildingCodeData?.description || buildingData?.structureType} - Storey ${storey}`,
          buildingData?.structureType || 'N/A',
          areaPerStorey,
          buildingCodeData?.rate ? `₱${buildingCodeData.rate.toLocaleString()}` : "N/A",
          constructionPercent.toString(),
          `₱${storeyBaseValue.toLocaleString()}`,
          depreciationRate.toString(),
          `₱${depreciationCost.toLocaleString()}`,
          `₱${marketValue.toLocaleString()}`
        ];

        xPosition = 20;
        rowData.forEach((data, index) => {
          const text = (typeof data === 'string' ? data : String(data)).substring(0, 12);
          pdf.text(text, xPosition, yPosition);
          xPosition += index === 0 ? 25 : 20;
        });
        yPosition += 6;

        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      }

      // Subtotal
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub-total', 20, yPosition);
      pdf.text(`${areaValue.toFixed(2)} sq ft`, 20 + 25 + 20, yPosition, { align: 'right' });
      pdf.text(`₱${baseMarketValue?.toLocaleString() || '0'}`, 20 + 25 + 20 + 20 + 20 + 20, yPosition, { align: 'right' });
      pdf.text(`₱${totalDepreciationCost.toLocaleString()}`, 20 + 25 + 20 + 20 + 20 + 20 + 20 + 20, yPosition, { align: 'right' });
      pdf.text(`₱${totalMarketValue.toLocaleString()}`, 180, yPosition, { align: 'right' });

      yPosition += 20;

      // ADDITIONAL ITEMS SECTION
      if (buildingAdjustments && buildingAdjustments.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ADDITIONAL ITEMS:', 20, yPosition);
        yPosition += 10;

        // Table headers
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        xPosition = 20;
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += index === 0 ? 25 : 20;
        });
        yPosition += 5;

        // Additional items rows
        pdf.setFont('helvetica', 'normal');
        buildingAdjustments.forEach((adjustment, index) => {
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
            componentDescription,
            subcom?.description || "",
            area.toString(),
            unitValue.toString(),
            completionPercent,
            `₱${baseValue.toLocaleString()}`,
            depreciation,
            `₱${depreciationCost.toLocaleString()}`,
            `₱${itemMarketValue.toLocaleString()}`
          ];

          xPosition = 20;
          rowData.forEach((data, index) => {
            const text = (typeof data === 'string' ? data : String(data)).substring(0, 10);
            pdf.text(text, xPosition, yPosition);
            xPosition += index === 0 ? 25 : 20;
          });
          yPosition += 6;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });

        // Additional items subtotal
        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sub-total', 20, yPosition);
        pdf.text(`${additionalItemsTotals.totalArea.toFixed(2)} sq ft`, 20 + 25 + 20, yPosition, { align: 'right' });
        pdf.text(`₱${additionalItemsTotals.totalBaseValue.toLocaleString()}`, 20 + 25 + 20 + 20 + 20 + 20, yPosition, { align: 'right' });
        pdf.text(`₱${additionalItemsTotals.totalDepreciationCost.toLocaleString()}`, 20 + 25 + 20 + 20 + 20 + 20 + 20 + 20, yPosition, { align: 'right' });
        pdf.text(`₱${additionalItemsTotals.totalMarketValue.toLocaleString()}`, 180, yPosition, { align: 'right' });

        yPosition += 20;
      }

      // COMBINED TOTALS SECTION
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMBINED TOTALS', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(9);
      pdf.text('TOTAL AREA', 20, yPosition);
      pdf.text(`${areaValue.toFixed(2)} sq ft`, 60, yPosition);
      
      pdf.text('TOTAL BASE MARKET VALUE', 80, yPosition);
      pdf.text(`₱${baseMarketValue?.toLocaleString() || '0'}`, 140, yPosition);
      
      pdf.text('TOTAL DEPRECIATION', 160, yPosition);
      pdf.text(`₱${totalDepreciationCost.toLocaleString()}`, 190, yPosition, { align: 'right' });
      yPosition += 8;

      pdf.text('GRAND TOTAL', 160, yPosition);
      pdf.text(`₱${combinedTotalMarketValue.toLocaleString()}`, 190, yPosition, { align: 'right' });

      yPosition += 20;

      // PROPERTY ASSESSMENT SECTION
      pdf.setFontSize(12);
      pdf.text('PROPERTY ASSESSMENT', 20, yPosition);
      yPosition += 10;

      // Assessment table
      pdf.setFontSize(8);
      const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level (%)', 'Assessment Value'];
      
      xPosition = 20;
      assessmentHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += 45;
      });
      yPosition += 5;

      // Assessment data
      pdf.setFont('helvetica', 'normal');
      const assessmentData = [
        actualUse,
        `₱${combinedTotalMarketValue.toLocaleString()}`,
        assessmentLevel?.rate_percent || '0%',
        `₱${assessmentValue.toLocaleString()}`
      ];

      xPosition = 20;
      assessmentData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += 45;
      });

      yPosition += 20;

      // TAXABLE/EXEMPT SECTION
      pdf.setFontSize(9);
      pdf.text(`Taxable: ${isTaxable ? '☒' : '☐'}`, 20, yPosition);
      pdf.text(`Exempt: ${isExempt ? '☒' : '☐'}`, 60, yPosition);
      pdf.text(`Effectivity of Assessment: ${currentQuarter} Qtr. ${currentYear} Yr.`, 100, yPosition);

      yPosition += 15;

      // SIGNATURE SECTION
      pdf.text('Appraised by:', 20, yPosition);
      pdf.text('Approved by:', 130, yPosition);
      yPosition += 15;

      pdf.line(20, yPosition, 100, yPosition);
      pdf.line(130, yPosition, 190, yPosition);
      yPosition += 8;

      pdf.setFontSize(7);
      pdf.text('Acting Provincial Assessor', 160, yPosition, { align: 'center' });

      yPosition += 15;

      // MEMORANDA
      pdf.setFontSize(8);
      pdf.text('MEMORANDA:', 20, yPosition);
      yPosition += 5;
      pdf.text('Date of Entry in the Record of Assessment ______ By: ____________', 20, yPosition);

      // POWERED BY
      yPosition += 10;
      pdf.setFontSize(6);
      pdf.text('Powered by: SPIDC', 190, yPosition, { align: 'right' });

      // Convert to Blob for universal handling
      const pdfBlob = pdf.output('blob');
      
      // Use the universal PDF handler
      await saveAndOpenPdf(pdfBlob);
      
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF generation failed — check console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    isGeneratingPdf, buildingData, formData, baseMarketValue, buildingAdjustments, 
    adjustedMarketValue, assessmentLevel, subcomponentData, componentData, 
    buildingCodeData, isTaxable, isExempt, currentQuarter, currentYear
  ]);

  // Calculate values
  const numberOfStoreys = buildingData?.storey ? parseInt(buildingData.storey) : 1;
  const areaValue = formData?.area ? parseFloat(formData.area) : 0;
  const depreciationRate = buildingData?.depreciationRate !== null && buildingData?.depreciationRate !== undefined 
    ? buildingData.depreciationRate 
    : 0;
  const constructionPercent = buildingData?.constructionPercent !== null && buildingData?.constructionPercent !== undefined 
    ? buildingData.constructionPercent 
    : 100;
  const actualUse = formData?.actualUse || buildingData?.actual_use || 'N/A';

  const calculateStoreyValues = (storeyBaseValue: number) => {
    const afterConstruction = storeyBaseValue * (constructionPercent / 100);
    const depreciationCost = afterConstruction * (depreciationRate / 100);
    const marketValue = afterConstruction - depreciationCost;
    
    return {
      baseValue: storeyBaseValue,
      afterConstruction,
      depreciationCost,
      marketValue
    };
  };

  const storeyBaseValue = baseMarketValue ? baseMarketValue / numberOfStoreys : 0;
  const storeyValues = calculateStoreyValues(storeyBaseValue);
  
  const totalDepreciationCost = storeyValues.depreciationCost * numberOfStoreys;
  const totalMarketValue = storeyValues.marketValue * numberOfStoreys;

  const calculateAdditionalItemsTotals = () => {
    let totalArea = 0;
    let totalBaseValue = 0;
    let totalDepreciationCost = 0;
    let totalMarketValue = 0;

    buildingAdjustments.forEach((adjustment, index) => {
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

    return {
      totalArea,
      totalBaseValue,
      totalDepreciationCost,
      totalMarketValue
    };
  };

  const additionalItemsTotals = calculateAdditionalItemsTotals();

  const combinedTotalArea = areaValue + additionalItemsTotals.totalArea;
  const combinedTotalBaseValue = (baseMarketValue || 0) + additionalItemsTotals.totalBaseValue;
  const combinedTotalDepreciationCost = totalDepreciationCost + additionalItemsTotals.totalDepreciationCost;
  const combinedTotalMarketValue = totalMarketValue + additionalItemsTotals.totalMarketValue;

  const calculateAssessmentValue = (marketValue: number, assessmentRate: string): number => {
    if (!assessmentRate) return 0;
    
    let rateDecimal: number;
    if (assessmentRate.includes('%')) {
      rateDecimal = parseFloat(assessmentRate.replace('%', '')) / 100;
    } else {
      rateDecimal = parseFloat(assessmentRate);
    }
    
    const assessedValue = marketValue * rateDecimal;
    return Math.round(assessedValue);
  };

  const assessmentValue = calculateAssessmentValue(combinedTotalMarketValue, assessmentLevel?.rate_percent || '0%');

  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Create arrays for displayable content
  const storeyRows = Array.from({ length: numberOfStoreys }, (_, index) => index + 1);
  
  const appraisalHeaders = ['Description', 'Type', 'Area (sq.m.)', 'Unit Value', '% Completion (BUCC)', 'Base Market Value (₱)', '% Depn.', 'Depreciation Cost (₱)', 'Market Value (₱)'];
  
  const additionalItemsRows = buildingAdjustments.map((adjustment, index) => {
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
    const marketValue = afterCompletion - depreciationCost;

    return {
      description: componentDescription,
      type: subcom?.description || "",
      area: area.toString(),
      unitValue: unitValue.toString(),
      completionPercent,
      baseValue: formatCurrency(baseValue),
      depreciation,
      depreciationCost: formatCurrency(depreciationCost),
      marketValue: formatCurrency(marketValue)
    };
  });

  const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level (%)', 'Assessment Value'];
  
  const assessmentRows = [
    {
      actualUse: actualUse,
      adjustedMarketValue: formatCurrency(combinedTotalMarketValue),
      assessmentLevel: assessmentLevel?.rate_percent || '0%',
      assessmentValue: formatCurrency(assessmentValue)
    },
    ...Array(ROW_ASSESSMENT - 1).fill(null).map((_, index) => ({
      actualUse: "",
      adjustedMarketValue: "",
      assessmentLevel: "",
      assessmentValue: ""
    }))
  ];

  const combinedTotalsData = [
    { label: 'TOTAL AREA', value: `${combinedTotalArea.toFixed(2)} sq ft` },
    { label: 'TOTAL BASE MARKET VALUE', value: formatCurrency(combinedTotalBaseValue) },
    { label: 'TOTAL DEPRECIATION', value: formatCurrency(combinedTotalDepreciationCost) },
    { label: 'GRAND TOTAL', value: formatCurrency(combinedTotalMarketValue) }
  ];

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
              className="generate-pdf-btn"
              disabled={isGeneratingPdf}
            >
              <IonIcon icon={documentOutline} /> 
              &nbsp; 
              {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
            </IonButton>
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div id="faas-back-sheet" className="sheet">
          {/* PROPERTY APPRAISAL - TABLE 1 */}
          <div className="section-header">PROPERTY APPRAISAL</div>

          <table className="table appraisal-table">
            <thead>
              <tr>
                {appraisalHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeyRows.map((storey, index) => {
                const areaPerStorey = areaValue > 0 ? (areaValue / numberOfStoreys).toFixed(2) : '0';
                
                return (
                  <tr key={storey}>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_desc`] || ""}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_desc`]: e.target.value }))}
                        placeholder={`${buildingCodeData?.description || buildingData?.structureType} - Storey ${storey}`}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_type`] || ""}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_type`]: e.target.value }))}
                        placeholder={buildingData?.structureType}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_area`] || areaPerStorey}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_area`]: e.target.value }))}
                        placeholder={areaPerStorey}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_unit`] || ""}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_unit`]: e.target.value }))}
                        placeholder={buildingCodeData?.rate ? `₱${buildingCodeData.rate.toLocaleString()}` : "Unit Value"}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_bucc`] || constructionPercent.toString()}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_bucc`]: e.target.value }))}
                        placeholder={constructionPercent.toString()}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_base`] || formatCurrency(storeyValues.baseValue)}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_base`]: e.target.value }))}
                        placeholder={formatCurrency(storeyValues.baseValue)}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_depn`] || depreciationRate.toString()}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_depn`]: e.target.value }))}
                        placeholder={depreciationRate.toString()}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_depn_cost`] || formatCurrency(storeyValues.depreciationCost)}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_depn_cost`]: e.target.value }))}
                        placeholder={formatCurrency(storeyValues.depreciationCost)}
                      />
                    </td>
                    <td>
                      <input
                        value={appraisal[`storey${storey}_market`] || formatCurrency(storeyValues.marketValue)}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`storey${storey}_market`]: e.target.value }))}
                        placeholder={formatCurrency(storeyValues.marketValue)}
                      />
                    </td>
                  </tr>
                );
              })}
              
              {storeyRows.length < 6 && 
                [...Array(6 - storeyRows.length)].map((_, index) => (
                  <tr key={`empty-${index}`}>
                    {[...Array(9)].map((_, c) => (
                      <td key={c}>
                        <input
                          value={appraisal[`empty${index}_c${c}`] || ""}
                          onChange={(e) => setAppraisal((p) => ({ ...p, [`empty${index}_c${c}`]: e.target.value }))}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              }
              
              {/* Table 1 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Sub-total</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{areaValue.toFixed(2)} sq ft</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(baseMarketValue || 0)}</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalDepreciationCost)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalMarketValue)}</td>
              </tr>
            </tbody>
          </table>

          {/* ADDITIONAL ITEMS - TABLE 2 */}
          <div className="section-header">ADDITIONAL ITEMS:</div>

          <table className="table items-table">
            <thead>
              <tr>
                {appraisalHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {additionalItemsRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={addItems[`adj${index}_desc`] || row.description}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_desc`]: e.target.value }))}
                      placeholder={row.description}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_type`] || row.type}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_type`]: e.target.value }))}
                      placeholder={row.type}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_area`] || row.area}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_area`]: e.target.value }))}
                      placeholder={row.area}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_unit`] || row.unitValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_unit`]: e.target.value }))}
                      placeholder={row.unitValue}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_bucc`] || row.completionPercent}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_bucc`]: e.target.value }))}
                      placeholder={row.completionPercent}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_base`] || row.baseValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_base`]: e.target.value }))}
                      placeholder={row.baseValue}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_depn`] || row.depreciation}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn`]: e.target.value }))}
                      placeholder={row.depreciation}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_depn_cost`] || row.depreciationCost}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn_cost`]: e.target.value }))}
                      placeholder={row.depreciationCost}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_market`] || row.marketValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_market`]: e.target.value }))}
                      placeholder={row.marketValue}
                    />
                  </td>
                </tr>
              ))}
              
              {additionalItemsRows.length < ROW_ITEMS && 
                [...Array(ROW_ITEMS - additionalItemsRows.length)].map((_, index) => (
                  <tr key={`empty-adj-${index}`}>
                    {[...Array(9)].map((_, c) => (
                      <td key={c}>
                        <input
                          value={addItems[`emptyadj${index}_c${c}`] || ""}
                          onChange={(e) => setAddItems((p) => ({ ...p, [`emptyadj${index}_c${c}`]: e.target.value }))}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              }
              
              {/* Table 2 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Sub-total</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{additionalItemsTotals.totalArea.toFixed(2)} sq ft</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalBaseValue)}</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalDepreciationCost)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalMarketValue)}</td>
              </tr>
            </tbody>
          </table>

          {/* COMBINED TOTALS */}
          <div className="section-header">COMBINED TOTALS</div>

          <table className="table combined-totals-table">
            <tbody>
              <tr className="subtotal-row">
                {combinedTotalsData.map((item, index) => (
                  <React.Fragment key={index}>
                    <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>{item.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>{item.value}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>

          {/* PROPERTY ASSESSMENT */}
          <div className="section-header">PROPERTY ASSESSMENT</div>

          <table className="table assessment-table">
            <thead>
              <tr>
                {assessmentHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessmentRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={assessment[`actual_use_${index}`] || row.actualUse}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`actual_use_${index}`]: e.target.value }))}
                      placeholder={row.actualUse}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`adjusted_market_value_${index}`] || row.adjustedMarketValue}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`adjusted_market_value_${index}`]: e.target.value }))}
                      placeholder={row.adjustedMarketValue}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`assessment_level_${index}`] || row.assessmentLevel}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`assessment_level_${index}`]: e.target.value }))}
                      placeholder={row.assessmentLevel}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`assessment_value_${index}`] || row.assessmentValue}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`assessment_value_${index}`]: e.target.value }))}
                      placeholder={row.assessmentValue}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tax-row">
            <label>
              Taxable 
              <input 
                type="checkbox" 
                checked={isTaxable}
                onChange={(e) => {
                  setIsTaxable(e.target.checked);
                  if (e.target.checked) setIsExempt(false);
                }}
              />
            </label>
            <label>
              Exempt 
              <input 
                type="checkbox" 
                checked={isExempt}
                onChange={(e) => {
                  setIsExempt(e.target.checked);
                  if (e.target.checked) setIsTaxable(false);
                }}
              />
            </label>
            <div className="effectivity">
              Effectivity of Assessment: {currentQuarter} Qtr. {currentYear} Yr.
            </div>
          </div>

          <div className="signature-container">
            <div>
              <div>Appraised by:</div>
              <div className="sig-line"></div>
            </div>
            <div>
              <div>Approved by:</div>
              <div className="sig-line"></div>
              <div className="prov">Acting Provincial Assessor</div>
            </div>
          </div>

          <div className="memoranda">
            MEMORANDA:<br />
            Date of Entry in the Record of Assessment ______ By: ____________
          </div>

          <div className="powered">Powered by: SPIDC</div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingFaasBackModal;