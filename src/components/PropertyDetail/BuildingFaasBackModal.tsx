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

  // Get current quarter and year - ALWAYS SET QUARTER TO 1
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
              
              // Get component description
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

  const generatePdf = async () => {
    const element = document.getElementById("faas-back-sheet");
    if (!element) return;

    const opt: any = {
      margin: [4, 6, 4, 6],
      filename: "BuildingFaasBack.pdf",
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
      // Force a small delay to ensure styles are loaded
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

  // Calculate number of storeys
  const numberOfStoreys = buildingData?.storey ? parseInt(buildingData.storey) : 1;
  const areaValue = formData?.area ? parseFloat(formData.area) : 0;
  const depreciationRate = buildingData?.depreciationRate !== null && buildingData?.depreciationRate !== undefined 
    ? buildingData.depreciationRate 
    : 0;
  const constructionPercent = buildingData?.constructionPercent !== null && buildingData?.constructionPercent !== undefined 
    ? buildingData.constructionPercent 
    : 100;
  const actualUse = formData?.actualUse || buildingData?.actual_use || 'N/A';

  // Calculate values per storey for Table 1
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

  // Calculate total values for Table 1
  const storeyBaseValue = baseMarketValue ? baseMarketValue / numberOfStoreys : 0;
  const storeyValues = calculateStoreyValues(storeyBaseValue);
  
  const totalDepreciationCost = storeyValues.depreciationCost * numberOfStoreys;
  const totalMarketValue = storeyValues.marketValue * numberOfStoreys;

  // Calculate totals for Table 2 (Additional Items)
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

  // Calculate combined totals (Table 1 + Table 2)
  const combinedTotalArea = areaValue + additionalItemsTotals.totalArea;
  const combinedTotalBaseValue = (baseMarketValue || 0) + additionalItemsTotals.totalBaseValue;
  const combinedTotalDepreciationCost = totalDepreciationCost + additionalItemsTotals.totalDepreciationCost;
  const combinedTotalMarketValue = totalMarketValue + additionalItemsTotals.totalMarketValue;

  // Calculate assessment value
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

  // Format currency values
  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Create array for storey rows
  const storeyRows = Array.from({ length: numberOfStoreys }, (_, index) => index + 1);

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
        <div id="faas-back-sheet" className="sheet">
          {/* PROPERTY APPRAISAL - TABLE 1 */}
          <div className="section-header">PROPERTY APPRAISAL</div>

          <table className="table appraisal-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Area (sq.m.)</th>
                <th>Unit Value</th>
                <th>% Completion (BUCC)</th>
                <th>Base Market Value (₱)</th>
                <th>% Depn.</th>
                <th>Depreciation Cost (₱)</th>
                <th>Market Value (₱)</th>
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
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Sub-total
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {areaValue.toFixed(2)} sq ft
                </td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(baseMarketValue || 0)}
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(totalDepreciationCost)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(totalMarketValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ADDITIONAL ITEMS - TABLE 2 */}
          <div className="section-header">ADDITIONAL ITEMS:</div>

          <table className="table items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Area (sq.m.)</th>
                <th>Unit Value</th>
                <th>% Completion (BUCC)</th>
                <th>Base Market Value (₱)</th>
                <th>% Depn.</th>
                <th>Depreciation Cost (₱)</th>
                <th>Market Value (₱)</th>
              </tr>
            </thead>
            <tbody>
              {buildingAdjustments.map((adjustment, index) => {
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

                return (
                  <tr key={index}>
                    <td>
                      <input
                        value={addItems[`adj${index}_desc`] || componentDescription}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_desc`]: e.target.value }))}
                        placeholder={componentDescription}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_type`] || subcom?.description || ""}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_type`]: e.target.value }))}
                        placeholder={subcom?.description}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_area`] || area.toString()}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_area`]: e.target.value }))}
                        placeholder={area.toString()}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_unit`] || unitValue.toString()}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_unit`]: e.target.value }))}
                        placeholder={unitValue.toString()}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_bucc`] || completionPercent}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_bucc`]: e.target.value }))}
                        placeholder={completionPercent}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_base`] || formatCurrency(baseValue)}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_base`]: e.target.value }))}
                        placeholder={formatCurrency(baseValue)}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_depn`] || depreciation}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn`]: e.target.value }))}
                        placeholder={depreciation}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_depn_cost`] || formatCurrency(depreciationCost)}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn_cost`]: e.target.value }))}
                        placeholder={formatCurrency(depreciationCost)}
                      />
                    </td>
                    <td>
                      <input
                        value={addItems[`adj${index}_market`] || formatCurrency(marketValue)}
                        onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_market`]: e.target.value }))}
                        placeholder={formatCurrency(marketValue)}
                      />
                    </td>
                  </tr>
                );
              })}
              
              {buildingAdjustments.length < ROW_ITEMS && 
                [...Array(ROW_ITEMS - buildingAdjustments.length)].map((_, index) => (
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
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Sub-total
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {additionalItemsTotals.totalArea.toFixed(2)} sq ft
                </td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(additionalItemsTotals.totalBaseValue)}
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(additionalItemsTotals.totalDepreciationCost)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(additionalItemsTotals.totalMarketValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* COMBINED TOTALS */}
          <div className="section-header">COMBINED TOTALS</div>

          <table className="table combined-totals-table">
            <tbody>
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL AREA
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {combinedTotalArea.toFixed(2)} sq ft
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL BASE MARKET VALUE
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(combinedTotalBaseValue)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL DEPRECIATION
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(combinedTotalDepreciationCost)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  GRAND TOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(combinedTotalMarketValue)}
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
                    value={assessment[`adjusted_market_value`] || formatCurrency(combinedTotalMarketValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, adjusted_market_value: e.target.value }))}
                    placeholder={formatCurrency(combinedTotalMarketValue)}
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

export default BuildingFaasBackModal;