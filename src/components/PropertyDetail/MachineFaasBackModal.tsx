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

  // Get current quarter and year - ALWAYS SET QUARTER TO 1
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
        const fileName = `MachineFAAS_${timestamp}.pdf`;

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
        downloadLink.download = `MachineFAAS_${new Date().getTime()}.pdf`;
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
        downloadLink.download = `MachineFAAS_${new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    }
  };

  // Pure jsPDF generation - FIXED VERSION
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Get all the data from your component state
      const machineDescription = machineData?.machineDescription || machineData?.selectedEquipment || 'N/A';
      const totalBaseValue = baseMarketValue || 0;
      const depreciationRate = parseFloat(machineData?.depreciation) || 0;
      const depreciationCost = totalBaseValue * (depreciationRate / 100);
      const marketValue = adjustedMarketValue || (totalBaseValue - depreciationCost);
      const actualUse = formData?.actualUse || 'N/A';
      const assessmentValue = calculateAssessmentValue(marketValue, assessmentLevel || '0%');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;

      // PROPERTY APPRAISAL SECTION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROPERTY APPRAISAL', 20, yPosition);
      yPosition += 8;

      // Table headers - Smaller fonts to prevent cramping
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Desc', 'Type', 'Units', 'Unit Val', 'Base Mkt Val', '% Depn', 'Depn Cost', 'Mkt Val'];
      
      let xPosition = 10;
      const columnWidths = [30, 20, 15, 20, 25, 15, 25, 25];
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 5;

      // Machine row
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      
      const rowData = [
        machineDescription.substring(0, 25),
        'Machinery',
        machineData?.numberOfUnits || '1',
        Math.round(totalBaseValue).toLocaleString(),
        Math.round(totalBaseValue).toLocaleString(),
        depreciationRate.toString(),
        Math.round(depreciationCost).toLocaleString(),
        Math.round(marketValue).toLocaleString()
      ];

      xPosition = 10;
      rowData.forEach((data, index) => {
        const maxLength = [25, 10, 5, 10, 12, 4, 12, 12][index];
        const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
        pdf.text(text, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 5;

      // Empty rows to maintain structure
      for (let i = 0; i < 5; i++) {
        xPosition = 10;
        headers.forEach((_, index) => {
          pdf.text('', xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 5;
      }

      // Subtotal
      yPosition += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub-total', 10, yPosition);
      pdf.text(`${machineData?.numberOfUnits || '1'} units`, 10 + 30 + 20, yPosition);
      pdf.text(Math.round(totalBaseValue).toLocaleString(), 10 + 30 + 20 + 15 + 20, yPosition);
      pdf.text(Math.round(depreciationCost).toLocaleString(), 10 + 30 + 20 + 15 + 20 + 25 + 15, yPosition);
      pdf.text(Math.round(marketValue).toLocaleString(), 10 + 30 + 20 + 15 + 20 + 25 + 15 + 25, yPosition);

      yPosition += 20;

      // COMBINED TOTALS SECTION - Smaller fonts
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMBINED TOTALS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(6);
      pdf.text('TOTAL UNITS', 20, yPosition);
      pdf.text(`${machineData?.numberOfUnits || '1'} units`, 45, yPosition);
      
      pdf.text('TOTAL BASE MARKET VALUE', 80, yPosition);
      pdf.text(Math.round(totalBaseValue).toLocaleString(), 135, yPosition);
      
      pdf.text('TOTAL DEP', 160, yPosition); // Changed from 'TOTAL DEPRECIATION'
      pdf.text(Math.round(depreciationCost).toLocaleString(), 190, yPosition, { align: 'right' });
      yPosition += 4;

      pdf.text('GRAND TOTAL', 160, yPosition);
      pdf.text(Math.round(marketValue).toLocaleString(), 190, yPosition, { align: 'right' });

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
        Math.round(marketValue).toLocaleString(),
        assessmentLevel || '0%',
        Math.round(assessmentValue).toLocaleString()
      ];

      xPosition = 20;
      assessmentData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += 42;
      });

      // Empty assessment rows
      for (let i = 0; i < 3; i++) {
        yPosition += 5;
        xPosition = 20;
        assessmentHeaders.forEach(() => {
          pdf.text('', xPosition, yPosition);
          xPosition += 42;
        });
      }

      yPosition += 15;

      // TAXABLE/EXEMPT SECTION - Fix special characters
      pdf.setFontSize(8);
      pdf.text(`Taxable: ${isTaxable ? '[X]' : '[ ]'}`, 20, yPosition);
      pdf.text(`Exempt: ${isExempt ? '[X]' : '[ ]'}`, 60, yPosition);
      pdf.text(`Effectivity: ${currentQuarter} Qtr. ${currentYear} Yr.`, 100, yPosition);

      yPosition += 12;

      // SIGNATURE SECTION
      pdf.text('Appraised by:', 20, yPosition);
      pdf.text('Approved by:', 130, yPosition);
      yPosition += 12;

      pdf.line(20, yPosition, 100, yPosition);
      pdf.line(130, yPosition, 190, yPosition);
      yPosition += 6;

      pdf.setFontSize(6);
      pdf.text('Acting Provincial Assessor', 160, yPosition, { align: 'center' });

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
    isGeneratingPdf, machineData, formData, baseMarketValue, adjustedMarketValue, 
    assessmentLevel, isTaxable, isExempt, currentQuarter, currentYear
  ]);

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
    
    const assessedValue = marketValue * rateDecimal;
    return Math.round(assessedValue);
  }, []);

  // Format currency values
  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate values from machine data
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
        <div id="machine-faas-back-sheet" className="sheet">
          {/* PROPERTY APPRAISAL - TABLE 1 */}
          <div className="section-header">PROPERTY APPRAISAL</div>

          <table className="table appraisal-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Units</th>
                <th>Unit Value</th>
                <th>Base Market Value (₱)</th>
                <th>% Depn.</th>
                <th>Depreciation Cost (₱)</th>
                <th>Market Value (₱)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    value={appraisal[`machine_desc`] || machineDescription}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_desc: e.target.value }))}
                    placeholder={machineDescription}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_type`] || "Machinery"}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_type: e.target.value }))}
                    placeholder="Machinery"
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_units`] || (machineData?.numberOfUnits || '1')}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_units: e.target.value }))}
                    placeholder={machineData?.numberOfUnits || '1'}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_unit_value`] || formatCurrency(totalBaseValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_unit_value: e.target.value }))}
                    placeholder={formatCurrency(totalBaseValue)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_base`] || formatCurrency(totalBaseValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_base: e.target.value }))}
                    placeholder={formatCurrency(totalBaseValue)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_depn`] || depreciationRate.toString()}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_depn: e.target.value }))}
                    placeholder={depreciationRate.toString()}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_depn_cost`] || formatCurrency(depreciationCost)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_depn_cost: e.target.value }))}
                    placeholder={formatCurrency(depreciationCost)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_market`] || formatCurrency(marketValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_market: e.target.value }))}
                    placeholder={formatCurrency(marketValue)}
                  />
                </td>
              </tr>
              
              {/* Empty rows to maintain table structure */}
              {[...Array(5)].map((_, index) => (
                <tr key={`empty-${index}`}>
                  {[...Array(8)].map((_, c) => (
                    <td key={c}>
                      <input
                        value={appraisal[`empty${index}_c${c}`] || ""}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`empty${index}_c${c}`]: e.target.value }))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Table 1 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Sub-total
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {machineData?.numberOfUnits || '1'} units
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(totalBaseValue)}
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(depreciationCost)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(marketValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* COMBINED TOTALS (Same as Table 1 totals for machinery) */}
          <div className="section-header">COMBINED TOTALS</div>

          <table className="table combined-totals-table">
            <tbody>
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL UNITS
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {machineData?.numberOfUnits || '1'} units
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL BASE MARKET VALUE
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(totalBaseValue)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL DEPRECIATION
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(depreciationCost)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  GRAND TOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(marketValue)}
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
                <th>Adjusted Market Value</th>
                <th>Assessment Level (%)</th>
                <th>Assessment Value</th>
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
                    value={assessment[`adjusted_market_value`] || formatCurrency(marketValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, adjusted_market_value: e.target.value }))}
                    placeholder={formatCurrency(marketValue)}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessment_level`] || assessmentLevel || '0%'}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessment_level: e.target.value }))}
                    placeholder={assessmentLevel || '0%'}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessment_value`] || formatCurrency(assessmentValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessment_value: e.target.value }))}
                    placeholder={formatCurrency(assessmentValue)}
                  />
                </td>
              </tr>
              
              {/* Empty rows to maintain 4 rows total */}
              {[...Array(ROW_ASSESSMENT - 1)].map((_, r) => (
                <tr key={`empty-assess-${r}`}>
                  {[...Array(4)].map((_, c) => (
                    <td key={c}>
                      <input
                        value={assessment[`empty${r}_c${c}`] || ""}
                        onChange={(e) => setAssessment((p) => ({ ...p, [`empty${r}_c${c}`]: e.target.value }))}
                      />
                    </td>
                  ))}
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

export default MachineFaasBackModal;