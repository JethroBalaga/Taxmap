import React, { useState, useEffect } from "react";
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
import html2canvas from 'html2canvas';
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

  // Android-compatible PDF generation
  const generatePdf = async () => {
    const element = document.getElementById("machine-faas-back-sheet");
    if (!element) {
      console.error("PDF element not found");
      return;
    }

    try {
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: function(clonedDoc) {
          // Ensure all inputs show their values in the cloned document
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(input => {
            input.style.backgroundColor = 'transparent';
            input.style.border = 'none';
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // For Android devices
      if ((window as any).cordova || (window as any).Capacitor?.isNativePlatform()) {
        // For Android - open in system viewer
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Try to open in a new window/system viewer
        const newWindow = window.open(pdfUrl, '_blank');
        if (!newWindow) {
          // Fallback: trigger download
          pdf.save('MachineFaasBack.pdf');
        }
      } else {
        // For web browsers - direct download
        pdf.save('MachineFaasBack.pdf');
      }
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("PDF generation failed. Please try again.");
    }
  };

  // Get machine description
  const machineDescription = machineData?.machineDescription || machineData?.selectedEquipment || 'N/A';
  
  // Format currency values
  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₱0.00';
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate values from machine data
  const totalBaseValue = baseMarketValue || 0;
  const depreciationRate = parseFloat(machineData?.depreciation) || 0;
  const depreciationCost = totalBaseValue * (depreciationRate / 100);
  const marketValue = adjustedMarketValue || (totalBaseValue - depreciationCost);

  // Calculate assessment value
  const calculateAssessmentValue = (marketValue: number, assessmentRate: string): number => {
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
  };

  const assessmentValue = calculateAssessmentValue(marketValue, assessmentLevel || '0%');

  // Get actual use from form data
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
            <IonButton onClick={generatePdf} className="generate-pdf-btn">
              <IonIcon icon={documentOutline} slot="start" />
              Generate PDF
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