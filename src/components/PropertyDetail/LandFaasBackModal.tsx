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
import { getLandAdjustmentData, LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { getSubclassById, SubclassData } from '../../utils/subclassLocalStorage';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
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
  const [memoranda, setMemoranda] = useState<Record<string, string>>({
    dateOfEntry: "",
    enteredBy: ""
  });
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
        // Load land adjustments
        const adjustments = await getLandAdjustmentData();
        if (adjustments) {
          setLandAdjustmentData(adjustments);
        }

        // Load subclass data using the subclass ID from formData
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

  // Universal PDF handling for both native and web - FIXED VERSION
  const saveAndOpenPdf = async (pdfBlob: Blob) => {
    try {
      // Check if we're in a native Capacitor environment
      const isNative = (window as any).Capacitor?.isNativePlatform();
      
      if (isNative) {
        // NATIVE MOBILE: Use Filesystem and FileOpener
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(pdfBlob);
        });

        const timestamp = new Date().getTime();
        const fileName = `LandFAAS_${timestamp}.pdf`;

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
          // Show success message even if we can't auto-open
          alert(`PDF saved successfully to: ${result.uri}\nYou can find it in your Documents folder.`);
        }
      } else {
        // WEB: Use download approach instead of window.open
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `LandFAAS_${new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up URL
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    } catch (error) {
      console.error('Error in saveAndOpenPdf:', error);
      
      // Ultimate fallback for both platforms
      alert('PDF generated successfully. If download did not start automatically, please check your downloads folder.');
      
      // Fallback download for web
      if (!(window as any).Capacitor?.isNativePlatform()) {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `LandFAAS_${new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    }
  };

  // Pure jsPDF generation for Land FAAS - FIXED VERSION
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Get all the data from your component
      const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
      const marketValue = adjustedMarketValue || baseMarketValue || 0;
      const { totalAdjustment: agriculturalTotalAdjustment, adjustments: agriculturalAdjustments } = calculateAgriculturalAdjustments();
      const { totalBaseValue, totalAdjustedValue, totalAssessedValue } = calculateSubclassTotals();

      // Calculate assessment value
      const assessmentValue = totalAssessedValue > 0 ? totalAssessedValue :
        (assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;

      // SUBCLASS BREAKDOWN SECTION
      if (subclassRates && subclassRates.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SUBCLASS BREAKDOWN', 20, yPosition);
        yPosition += 8;

        // Table headers - Smaller fonts
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        const headers = ['Subclass Desc', 'Rate (/sqm)', 'Area (sqm)', 'Base Mkt Val', 'Adj Mkt Val'];
        
        let xPosition = 10;
        const columnWidths = [35, 20, 20, 30, 30];
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 5;

        // Subclass rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        subclassRates.forEach((rate, index) => {
          const area = formData?.area || 0;
          const baseMarketValue = parseFloat(rate.base_market_value) || 0;
          const adjustedMarketValue = parseFloat(rate.adjustment_market_value) || 0;

          const rowData = [
            (subclassData?.subclass || rate.subclass_description || rate.subclass_id || 'N/A').substring(0, 25),
            formatRate(rate.rate),
            area.toLocaleString(),
            Math.round(baseMarketValue).toLocaleString(),
            Math.round(adjustedMarketValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [25, 8, 8, 12, 12][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += columnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });

        // Subclass totals
        yPosition += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Total', 10, yPosition);
        pdf.text(Math.round(totalBaseValue).toLocaleString(), 10 + 35 + 20 + 20, yPosition);
        pdf.text(Math.round(totalAdjustedValue).toLocaleString(), 10 + 35 + 20 + 20 + 30, yPosition);

        yPosition += 15;
      }

      // VALUE ADJUSTMENT SECTION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VALUE ADJUSTMENT', 20, yPosition);
      yPosition += 8;

      // Table headers - Smaller fonts
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const adjustmentHeaders = ['Base Mkt Val', 'Adj Factor', 'Adj %', 'Value Adj', 'Mkt Val'];
      
      let xPosition = 10;
      const adjColumnWidths = [25, 25, 15, 25, 25];
      adjustmentHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += adjColumnWidths[index];
      });
      yPosition += 5;

      // Agricultural Adjustments
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      if (agriculturalAdjustments && agriculturalAdjustments.length > 0) {
        agriculturalAdjustments.forEach((adj, index) => {
          const rowData = [
            Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(),
            (adj.description || 'N/A').substring(0, 15),
            `${adj.value}%`,
            Math.round((totalBaseValue || baseMarketValue || 0) * (adj.value / 100)).toLocaleString(),
            Math.round(totalAdjustedValue || marketValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [10, 15, 5, 10, 10][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += adjColumnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }

      // Non-Agricultural Adjustments
      if (landAdjustments && landAdjustments.length > 0) {
        landAdjustments.forEach((adj, index) => {
          const rowData = [
            Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(),
            (adj.adjustment_type || 'N/A').substring(0, 15),
            formatAdjustmentFactor(adj.adjustment_factor).substring(0, 5),
            Math.round(parseFloat(adj.value_adjustment) || 0).toLocaleString(),
            Math.round(totalAdjustedValue || marketValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [10, 15, 5, 10, 10][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += adjColumnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }

      // Adjustment totals
      yPosition += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text(Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(), 10, yPosition);
      pdf.text('Total', 10 + 25, yPosition);
      pdf.text(`${agriculturalTotalAdjustment}%`, 10 + 25 + 25, yPosition);
      pdf.text(Math.round((totalBaseValue || baseMarketValue || 0) * (agriculturalTotalAdjustment / 100)).toLocaleString(), 10 + 25 + 25 + 15, yPosition);
      pdf.text(Math.round(totalAdjustedValue || marketValue).toLocaleString(), 10 + 25 + 25 + 15 + 25, yPosition);

      yPosition += 15;

      // PROPERTY ASSESSMENT SECTION
      pdf.setFontSize(10);
      pdf.text('PROPERTY ASSESSMENT', 20, yPosition);
      yPosition += 8;

      // Assessment table
      pdf.setFontSize(7);
      const assessmentHeaders = ['Actual Use', 'Adj Mkt Val', 'Assess Level %', 'Assess Value'];
      
      xPosition = 20;
      assessmentHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += 42;
      });
      yPosition += 5;

      // Assessment data - Use plain numbers
      pdf.setFont('helvetica', 'normal');
      const assessmentData = [
        actualUse.substring(0, 15),
        Math.round(totalAdjustedValue || marketValue).toLocaleString(),
        assessmentLevel?.rate_percent || '0%',
        Math.round(assessmentValue).toLocaleString()
      ];

      xPosition = 20;
      assessmentData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += 42;
      });

      yPosition += 15;

      // TAXABLE/EXEMPT SECTION - Fix special characters
      pdf.setFontSize(8);
      pdf.text(`Taxable: ${isTaxable ? '[X]' : '[ ]'}`, 20, yPosition);
      pdf.text(`Exempt: ${isExempt ? '[X]' : '[ ]'}`, 60, yPosition);
      pdf.text(`Effectivity: ${currentQuarter} Qtr. ${currentYear} Yr.`, 100, yPosition);

      yPosition += 12;

      // SIGNATURE SECTION
      pdf.text('Approved by:', 20, yPosition);
      yPosition += 12;

      pdf.line(20, yPosition, 100, yPosition);
      yPosition += 6;

      pdf.setFontSize(6);
      pdf.text('Municipal Assessor', 60, yPosition, { align: 'center' });

      yPosition += 12;

      // MEMORANDA
      pdf.setFontSize(7);
      pdf.text('MEMORANDA:', 20, yPosition);
      yPosition += 4;
      pdf.text('Date of Entry in the Record of Assessment ______ By: ____________', 20, yPosition);

      // POWERED BY
      yPosition += 8;
      pdf.setFontSize(5);
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
    isGeneratingPdf, landData, formData, baseMarketValue, landAdjustments, 
    adjustedMarketValue, assessmentLevel, agriculturalData, subclassRates,
    subclassData, isTaxable, isExempt, currentQuarter, currentYear
  ]);

  // Calculate agricultural adjustments
  const calculateAgriculturalAdjustments = () => {
    if (!agriculturalData) return { totalAdjustment: 0, adjustments: [] };

    const frontage = parseFloat(agriculturalData.frontage) || 0;
    const weatherRoad = parseFloat(agriculturalData.weather_road) || 0;
    const market = parseFloat(agriculturalData.market) || 0;

    const totalAdjustment = frontage + weatherRoad + market;

    const adjustments = [
      { description: "Frontage", value: frontage },
      { description: "Weather Road", value: weatherRoad },
      { description: "Market", value: market }
    ].filter(adj => adj.value !== 0);

    return { totalAdjustment, adjustments };
  };

  // Calculate subclass totals
  const calculateSubclassTotals = () => {
    let totalBaseValue = 0;
    let totalAdjustedValue = 0;
    let totalAssessedValue = 0;

    subclassRates.forEach(rate => {
      totalBaseValue += parseFloat(rate.base_market_value) || 0;
      totalAdjustedValue += parseFloat(rate.adjustment_market_value) || 0;

      const ratePercent = rate.assessment_level || '0';
      const assessmentRate = parseFloat(ratePercent.replace('%', '')) / 100;
      const assessedValue = (parseFloat(rate.adjustment_market_value) || 0) * assessmentRate;
      totalAssessedValue += assessedValue;
    });

    return { totalBaseValue, totalAdjustedValue, totalAssessedValue };
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₱0.00';
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safe number formatting for rates
  const formatRate = (rate: any) => {
    if (!rate) return '0.0000';

    try {
      const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
      if (isNaN(numRate)) return '0.0000';
      return numRate.toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  };

  // Function to properly format adjustment factor without double percent signs
  const formatAdjustmentFactor = (factor: any) => {
    if (!factor) return '0%';

    try {
      const factorStr = String(factor);
      // If it already ends with %, return as is
      if (factorStr.endsWith('%')) {
        return factorStr;
      }
      // Otherwise, add % sign
      return `${factorStr}%`;
    } catch (error) {
      return '0%';
    }
  };

  const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
  const marketValue = adjustedMarketValue || baseMarketValue || 0;
  const { totalAdjustment: agriculturalTotalAdjustment, adjustments: agriculturalAdjustments } = calculateAgriculturalAdjustments();
  const { totalBaseValue, totalAdjustedValue, totalAssessedValue } = calculateSubclassTotals();

  // Calculate assessment value
  const assessmentValue = totalAssessedValue > 0 ? totalAssessedValue :
    (assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0);

  // Calculate total rows needed for VALUE ADJUSTMENT section
  const totalAdjustmentRows = Math.max(
    (landAdjustments?.length || 0) + (agriculturalAdjustments?.length || 0),
    5 // Minimum 5 rows
  );

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
              className="generate-pdf-btn"
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
        <div id="land-faas-back-sheet" className="sheet">
          {/* SUBCLASS BREAKDOWN */}
          {subclassRates && subclassRates.length > 0 && (
            <>
              <div className="section-header">SUBCLASS BREAKDOWN</div>
              <table className="table subclass-table">
                <thead>
                  <tr>
                    <th>Subclass Description</th>
                    <th>Rate (₱/sqm)</th>
                    <th>Area (sqm)</th>
                    <th>Base Market Value (₱)</th>
                    <th>Adjusted Market Value (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {subclassRates.map((rate, index) => {
                    const area = formData?.area || 0;
                    const baseMarketValue = parseFloat(rate.base_market_value) || 0;
                    const adjustedMarketValue = parseFloat(rate.adjustment_market_value) || 0;

                    return (
                      <tr key={index}>
                        <td>
                          <input
                            value={adjustment[`subclass_desc_${index}`] || subclassData?.subclass || rate.subclass_description || rate.subclass_id || 'N/A'}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_desc_${index}`]: e.target.value }))}
                            placeholder={subclassData?.subclass || rate.subclass_description || rate.subclass_id || 'N/A'}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_rate_${index}`] || formatRate(rate.rate)}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_rate_${index}`]: e.target.value }))}
                            placeholder={formatRate(rate.rate)}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_area_${index}`] || area.toLocaleString()}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_area_${index}`]: e.target.value }))}
                            placeholder={area.toLocaleString()}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_base_${index}`] || formatCurrency(baseMarketValue)}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_base_${index}`]: e.target.value }))}
                            placeholder={formatCurrency(baseMarketValue)}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_adjusted_${index}`] || formatCurrency(adjustedMarketValue)}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_adjusted_${index}`]: e.target.value }))}
                            placeholder={formatCurrency(adjustedMarketValue)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="subtotal-row">
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }} colSpan={3}>
                      Total
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      <input
                        value={adjustment[`total_base_value`] || formatCurrency(totalBaseValue)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, total_base_value: e.target.value }))}
                        placeholder={formatCurrency(totalBaseValue)}
                        style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      <input
                        value={adjustment[`total_adjusted_value`] || formatCurrency(totalAdjustedValue)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, total_adjusted_value: e.target.value }))}
                        placeholder={formatCurrency(totalAdjustedValue)}
                        style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* VALUE ADJUSTMENT - INCLUDES BOTH AGRICULTURAL AND NON-AGRICULTURAL ADJUSTMENTS */}
          <div className="section-header">VALUE ADJUSTMENT</div>
          <table className="table adjustment-table">
            <thead>
              <tr>
                <th>Base Market Value (₱)</th>
                <th>Adjustment Factor</th>
                <th>Adjustment Percent</th>
                <th>Value Adjustment (₱)</th>
                <th>Market Value (₱)</th>
              </tr>
            </thead>
            <tbody>
              {/* Agricultural Adjustments */}
              {agriculturalAdjustments && agriculturalAdjustments.map((adj, index) => (
                <tr key={`agri-${index}`}>
                  <td>
                    <input
                      value={adjustment[`agri_base_value_${index}`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_base_value_${index}`]: e.target.value }))}
                      placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`agri_factor_${index}`] || adj.description || 'N/A'}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_factor_${index}`]: e.target.value }))}
                      placeholder={adj.description || 'N/A'}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`agri_percent_${index}`] || `${adj.value}%`}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_percent_${index}`]: e.target.value }))}
                      placeholder={`${adj.value}%`}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`agri_value_adj_${index}`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_value_adj_${index}`]: e.target.value }))}
                      placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`agri_market_${index}`] || formatCurrency(totalAdjustedValue || marketValue)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_market_${index}`]: e.target.value }))}
                      placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                    />
                  </td>
                </tr>
              ))}

              {/* Non-Agricultural Adjustments */}
              {landAdjustments && landAdjustments.map((adj, index) => {
                const adjustedIndex = index + (agriculturalAdjustments?.length || 0);
                return (
                  <tr key={`nonagri-${index}`}>
                    <td>
                      <input
                        value={adjustment[`base_value_${adjustedIndex}`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`base_value_${adjustedIndex}`]: e.target.value }))}
                        placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`factor_${adjustedIndex}`] || adj.adjustment_type || 'N/A'}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`factor_${adjustedIndex}`]: e.target.value }))}
                        placeholder={adj.adjustment_type || 'N/A'}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`percent_${adjustedIndex}`] || formatAdjustmentFactor(adj.adjustment_factor)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`percent_${adjustedIndex}`]: e.target.value }))}
                        placeholder={formatAdjustmentFactor(adj.adjustment_factor)}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`value_adj_${adjustedIndex}`] || formatCurrency(parseFloat(adj.value_adjustment) || 0)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`value_adj_${adjustedIndex}`]: e.target.value }))}
                        placeholder={formatCurrency(parseFloat(adj.value_adjustment) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`market_${adjustedIndex}`] || formatCurrency(totalAdjustedValue || marketValue)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`market_${adjustedIndex}`]: e.target.value }))}
                        placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Empty rows to ensure minimum 5 rows total */}
              {Array.from({ length: Math.max(0, totalAdjustmentRows - ((landAdjustments?.length || 0) + (agriculturalAdjustments?.length || 0))) }).map((_, index) => {
                const emptyIndex = index + (landAdjustments?.length || 0) + (agriculturalAdjustments?.length || 0);
                return (
                  <tr key={`empty-${emptyIndex}`}>
                    <td>
                      <input
                        value={adjustment[`empty_base_${emptyIndex}`] || ""}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_base_${emptyIndex}`]: e.target.value }))}
                        placeholder="Enter base value"
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`empty_factor_${emptyIndex}`] || ""}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_factor_${emptyIndex}`]: e.target.value }))}
                        placeholder="Enter factor"
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`empty_percent_${emptyIndex}`] || ""}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_percent_${emptyIndex}`]: e.target.value }))}
                        placeholder="Enter percent"
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`empty_value_${emptyIndex}`] || ""}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_value_${emptyIndex}`]: e.target.value }))}
                        placeholder="Enter value adjustment"
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`empty_market_${emptyIndex}`] || ""}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_market_${emptyIndex}`]: e.target.value }))}
                        placeholder="Enter market value"
                      />
                    </td>
                  </tr>
                );
              })}

              <tr className="subtotal-row">
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={adjustment[`total_base_final`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_base_final: e.target.value }))}
                    placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                    style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  Total
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <input
                    value={adjustment[`total_adjustment_percent`] || `${agriculturalTotalAdjustment}%`}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_adjustment_percent: e.target.value }))}
                    placeholder={`${agriculturalTotalAdjustment}%`}
                    style={{ textAlign: 'center', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={adjustment[`total_value_adjustment`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * (agriculturalTotalAdjustment / 100))}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_value_adjustment: e.target.value }))}
                    placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * (agriculturalTotalAdjustment / 100))}
                    style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={adjustment[`total_market_value`] || formatCurrency(totalAdjustedValue || marketValue)}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_market_value: e.target.value }))}
                    placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                    style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* PROPERTY ASSESSMENT */}
          <div className="section-header">PROPERTY ASSESSMENT</div>
          <table className="table assessment-table">
            <thead>
              <tr>
                <th>Actual Use</th>
                <th>Adjusted Market Value (₱)</th>
                <th>Assessment Level</th>
                <th>Assessed Value (₱)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    value={assessment[`actual_use`] || actualUse}
                    onChange={(e) => setAssessment((p) => ({ ...p, actual_use: e.target.value }))}
                    placeholder={actualUse}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`adjusted_market_value`] || formatCurrency(totalAdjustedValue || marketValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, adjusted_market_value: e.target.value }))}
                    placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessment_level`] || assessmentLevel?.rate_percent || '0%'}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessment_level: e.target.value }))}
                    placeholder={assessmentLevel?.rate_percent || '0%'}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessed_value`] || formatCurrency(assessmentValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessed_value: e.target.value }))}
                    placeholder={formatCurrency(assessmentValue)}
                  />
                </td>
              </tr>
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Total
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={assessment[`total_adjusted_market`] || formatCurrency(totalAdjustedValue || marketValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, total_adjusted_market: e.target.value }))}
                    placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                    style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={assessment[`total_assessed_value`] || formatCurrency(assessmentValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, total_assessed_value: e.target.value }))}
                    placeholder={formatCurrency(assessmentValue)}
                    style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
              </tr>
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
              Effectivity of Assessment:
              <input
                value={assessment[`current_quarter`] || currentQuarter}
                onChange={(e) => setAssessment((p) => ({ ...p, current_quarter: e.target.value }))}
                placeholder={currentQuarter}
                style={{ width: '20px', margin: '0 5px', textAlign: 'center' }}
              />
              Qtr.
              <input
                value={assessment[`current_year`] || currentYear}
                onChange={(e) => setAssessment((p) => ({ ...p, current_year: e.target.value }))}
                placeholder={currentYear}
                style={{ width: '40px', margin: '0 5px', textAlign: 'center' }}
              />
              Yr.
            </div>
          </div>

          {/* APPROVAL SIGNATURE */}
          <div className="signature-container">
            <div>
              <div>Approved by:</div>
              <div className="sig-line">
                <input
                  value={assessment[`approver_name`] || ""}
                  onChange={(e) => setAssessment((p) => ({ ...p, approver_name: e.target.value }))}
                  placeholder="Enter approver name"
                  style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }}
                />
              </div>
              <div className="prov">
                <input
                  value={assessment[`approver_title`] || "Municipal Assessor"}
                  onChange={(e) => setAssessment((p) => ({ ...p, approver_title: e.target.value }))}
                  placeholder="Municipal Assessor"
                  style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }}
                />
              </div>
              <div className="sig-line">
                <input
                  value={assessment[`approval_date`] || ""}
                  onChange={(e) => setAssessment((p) => ({ ...p, approval_date: e.target.value }))}
                  placeholder="Enter date"
                  style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }}
                />
              </div>
              <div>Date</div>
            </div>
          </div>

          {/* MEMORANDA */}
          <div className="memoranda">
            MEMORANDA:<br />
            Date of Entry in the Record of Assessment
            <input
              value={memoranda.dateOfEntry}
              onChange={(e) => setMemoranda((p) => ({ ...p, dateOfEntry: e.target.value }))}
              placeholder="______"
              style={{ width: '80px', margin: '0 5px', textAlign: 'center' }}
            />
            By:
            <input
              value={memoranda.enteredBy}
              onChange={(e) => setMemoranda((p) => ({ ...p, enteredBy: e.target.value }))}
              placeholder="____________"
              style={{ width: '100px', margin: '0 5px', textAlign: 'center' }}
            />
          </div>

          {/* RECORD OF SUPERSEDED ASSESSMENT */}
          <div className="section-header">RECORD OF SUPERSEDED ASSESSMENT</div>
          <table className="table superseded-table">
            <tbody>
              <tr>
                <td>PIN:</td>
                <td>
                  <input
                    value={superseded.pin || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, pin: e.target.value }))}
                    placeholder="Enter PIN"
                  />
                </td>
                <td>TD No.:</td>
                <td>
                  <input
                    value={superseded.tdNo || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, tdNo: e.target.value }))}
                    placeholder="Enter TD No."
                  />
                </td>
              </tr>
              <tr>
                <td>ARP No.:</td>
                <td>
                  <input
                    value={superseded.arpNo || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, arpNo: e.target.value }))}
                    placeholder="Enter ARP No."
                  />
                </td>
                <td>Previous Market Value:</td>
                <td>
                  <input
                    value={superseded.previousMarketValue || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, previousMarketValue: e.target.value }))}
                    placeholder="Enter previous market value"
                  />
                </td>
              </tr>
              <tr>
                <td>Previous Assessed Value:</td>
                <td>
                  <input
                    value={superseded.previousAssessedValue || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, previousAssessedValue: e.target.value }))}
                    placeholder="Enter previous assessed value"
                  />
                </td>
                <td>Previous Area:</td>
                <td>
                  <input
                    value={superseded.previousArea || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, previousArea: e.target.value }))}
                    placeholder="Enter previous area"
                  />
                </td>
              </tr>
              <tr>
                <td>Previous Owner:</td>
                <td colSpan={3}>
                  <input
                    value={superseded.previousOwner || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, previousOwner: e.target.value }))}
                    placeholder="Enter previous owner"
                    style={{ width: '100%' }}
                  />
                </td>
              </tr>
              <tr>
                <td>Previous Admin:</td>
                <td colSpan={3}>
                  <input
                    value={superseded.previousAdmin || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, previousAdmin: e.target.value }))}
                    placeholder="Enter previous admin"
                    style={{ width: '100%' }}
                  />
                </td>
              </tr>
              <tr>
                <td>Effectivity of Assessment:</td>
                <td>
                  <input
                    value={superseded.effectivity || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, effectivity: e.target.value }))}
                    placeholder="Enter effectivity"
                  />
                </td>
                <td>AR Page No.:</td>
                <td>
                  <input
                    value={superseded.arPageNo || ""}
                    onChange={(e) => setSuperseded((p) => ({ ...p, arPageNo: e.target.value }))}
                    placeholder="Enter AR Page No."
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="powered">
            Powered by:
            <input
              value={assessment[`powered_by`] || "SPIDC"}
              onChange={(e) => setAssessment((p) => ({ ...p, powered_by: e.target.value }))}
              placeholder="SPIDC"
              style={{ border: 'none', background: 'transparent', fontWeight: 'bold' }}
            />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LandFaasBackModal;