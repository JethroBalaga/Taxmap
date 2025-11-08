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
import html2pdf from "html2pdf.js";
import { getLandAdjustmentData, LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
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
  baseMarketValue,
  landAdjustments = [],
  adjustedMarketValue,
  assessmentLevel,
  agriculturalData,
  subclassRates = []
}) => {
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [superseded, setSuperseded] = useState<Record<string, string>>({});
  const [landAdjustmentData, setLandAdjustmentData] = useState<LandAdjustmentData[]>([]);
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [memoranda, setMemoranda] = useState<Record<string, string>>({
    dateOfEntry: "",
    enteredBy: ""
  });

  // Get current quarter and year - ALWAYS SET QUARTER TO 1
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setCurrentQuarter("1");
    setCurrentYear(year.toString());
  }, []);

  // Load land adjustment data
  useEffect(() => {
    const loadLandAdjustmentData = async () => {
      const data = await getLandAdjustmentData();
      if (data) {
        setLandAdjustmentData(data);
      }
    };
    loadLandAdjustmentData();
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

  const generatePdf = async () => {
    const element = document.getElementById("land-faas-back-sheet");
    if (!element) return;

    const opt: any = {
      margin: [4, 6, 4, 6],
      filename: "LandFaasBack.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        letterRendering: true
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const worker = (html2pdf as any)().set(opt).from(element);
      const blob: Blob = await worker.outputPdf("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("PDF generation failed — check console.");
    }
  };

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
      totalBaseValue += rate.baseMarketValue || 0;
      totalAdjustedValue += rate.adjustedMarketValue || 0;
      
      const ratePercent = rate.assessmentLevel?.rate_percent || '0';
      const assessmentRate = parseFloat(ratePercent.replace('%', '')) / 100;
      const assessedValue = rate.adjustedMarketValue ? rate.adjustedMarketValue * assessmentRate : 0;
      totalAssessedValue += assessedValue;
    });

    return { totalBaseValue, totalAdjustedValue, totalAssessedValue };
  };

  // Format currency values
  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
  const marketValue = adjustedMarketValue || baseMarketValue || 0;
  const { totalAdjustment, adjustments: agriculturalAdjustments } = calculateAgriculturalAdjustments();
  const { totalBaseValue, totalAdjustedValue, totalAssessedValue } = calculateSubclassTotals();

  // Calculate assessment value
  const assessmentValue = totalAssessedValue > 0 ? totalAssessedValue : 
    (assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent.replace('%', '')) / 100) : 0);

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
            <IonButton onClick={generatePdf} className="generate-pdf-btn">
              <IonIcon icon={documentOutline} /> &nbsp; Generate PDF
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
                    return (
                      <tr key={index}>
                        <td>
                          <input
                            value={adjustment[`subclass_desc_${index}`] || rate.subclass_description || rate.subclass_id}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_desc_${index}`]: e.target.value }))}
                            placeholder={rate.subclass_description || rate.subclass_id}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_rate_${index}`] || rate.rate?.toFixed(4) || '0.0000'}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_rate_${index}`]: e.target.value }))}
                            placeholder={rate.rate?.toFixed(4) || '0.0000'}
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
                            value={adjustment[`subclass_base_${index}`] || formatCurrency(rate.baseMarketValue || 0)}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_base_${index}`]: e.target.value }))}
                            placeholder={formatCurrency(rate.baseMarketValue || 0)}
                          />
                        </td>
                        <td>
                          <input
                            value={adjustment[`subclass_adjusted_${index}`] || formatCurrency(rate.adjustedMarketValue || 0)}
                            onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_adjusted_${index}`]: e.target.value }))}
                            placeholder={formatCurrency(rate.adjustedMarketValue || 0)}
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

          {/* VALUE ADJUSTMENT */}
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
              {agriculturalAdjustments.map((adj, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={adjustment[`base_value_${index}`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`base_value_${index}`]: e.target.value }))}
                      placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`factor_${index}`] || adj.description}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`factor_${index}`]: e.target.value }))}
                      placeholder={adj.description}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`percent_${index}`] || `${adj.value}%`}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`percent_${index}`]: e.target.value }))}
                      placeholder={`${adj.value}%`}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`value_adj_${index}`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`value_adj_${index}`]: e.target.value }))}
                      placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                    />
                  </td>
                  <td>
                    <input
                      value={adjustment[`market_${index}`] || formatCurrency(totalAdjustedValue || marketValue)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, [`market_${index}`]: e.target.value }))}
                      placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                    />
                  </td>
                </tr>
              ))}
              
              {/* Empty rows if needed */}
              {agriculturalAdjustments.length < 3 && 
                Array.from({ length: 3 - agriculturalAdjustments.length }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td>
                      <input 
                        value={adjustment[`empty_base_${index}`] || ""} 
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_base_${index}`]: e.target.value }))} 
                        placeholder="Enter base value"
                      />
                    </td>
                    <td>
                      <input 
                        value={adjustment[`empty_factor_${index}`] || ""} 
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_factor_${index}`]: e.target.value }))} 
                        placeholder="Enter factor"
                      />
                    </td>
                    <td>
                      <input 
                        value={adjustment[`empty_percent_${index}`] || ""} 
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_percent_${index}`]: e.target.value }))} 
                        placeholder="Enter percent"
                      />
                    </td>
                    <td>
                      <input 
                        value={adjustment[`empty_value_${index}`] || ""} 
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_value_${index}`]: e.target.value }))} 
                        placeholder="Enter value adjustment"
                      />
                    </td>
                    <td>
                      <input 
                        value={adjustment[`empty_market_${index}`] || ""} 
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_market_${index}`]: e.target.value }))} 
                        placeholder="Enter market value"
                      />
                    </td>
                  </tr>
                ))
              }
              
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
                    value={adjustment[`total_adjustment_percent`] || `${totalAdjustment}%`}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_adjustment_percent: e.target.value }))}
                    placeholder={`${totalAdjustment}%`}
                    style={{ textAlign: 'center', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                  />
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <input
                    value={adjustment[`total_value_adjustment`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * (totalAdjustment / 100))}
                    onChange={(e) => setAdjustment((p) => ({ ...p, total_value_adjustment: e.target.value }))}
                    placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * (totalAdjustment / 100))}
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