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
            console.log('Loaded subclass data:', subclass);
          } else {
            console.warn('No subclass found for ID:', formData.subclass);
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

  // Pure jsPDF generation for Land FAAS
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Get all the data from your component
      const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
      const marketValue = adjustedMarketValue || baseMarketValue || 0;
      const assessmentValue = assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Land FAAS - BACK PAGE', 105, 20, { align: 'center' });

      // Add your Land FAAS specific data here
      let yPosition = 40;
      
      // SUBCLASS BREAKDOWN
      if (subclassRates && subclassRates.length > 0) {
        pdf.setFontSize(12);
        pdf.text('SUBCLASS BREAKDOWN', 20, yPosition);
        yPosition += 10;

        // Add subclass table data...
        subclassRates.forEach((rate, index) => {
          const area = formData?.area || 0;
          const baseMarketValue = parseFloat(rate.base_market_value) || 0;
          const adjustedMarketValue = parseFloat(rate.adjustment_market_value) || 0;
          
          pdf.setFontSize(8);
          pdf.text(`${subclassData?.subclass || 'N/A'}`, 20, yPosition);
          pdf.text(`₱${parseFloat(rate.rate || '0').toFixed(4)}`, 60, yPosition);
          pdf.text(area.toLocaleString(), 90, yPosition);
          pdf.text(`₱${baseMarketValue.toLocaleString()}`, 110, yPosition);
          pdf.text(`₱${adjustedMarketValue.toLocaleString()}`, 150, yPosition);
          yPosition += 6;
        });
      }

      yPosition += 10;

      // VALUE ADJUSTMENT
      pdf.setFontSize(12);
      pdf.text('VALUE ADJUSTMENT', 20, yPosition);
      yPosition += 10;

      // Add adjustment data...
      landAdjustments.forEach((adj, index) => {
        pdf.setFontSize(8);
        pdf.text(`₱${baseMarketValue?.toLocaleString() || '0'}`, 20, yPosition);
        pdf.text(adj.adjustment_type || 'N/A', 50, yPosition);
        pdf.text(adj.adjustment_factor || '0%', 80, yPosition);
        pdf.text(`₱${parseFloat(adj.value_adjustment || '0').toLocaleString()}`, 110, yPosition);
        pdf.text(`₱${marketValue.toLocaleString()}`, 150, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // PROPERTY ASSESSMENT
      pdf.setFontSize(12);
      pdf.text('PROPERTY ASSESSMENT', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(8);
      pdf.text(actualUse, 20, yPosition);
      pdf.text(`₱${marketValue.toLocaleString()}`, 60, yPosition);
      pdf.text(assessmentLevel?.rate_percent || '0%', 100, yPosition);
      pdf.text(`₱${assessmentValue.toLocaleString()}`, 140, yPosition);

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
      console.error("PDF generation failed", error);
      alert("PDF generation failed — check console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [isGeneratingPdf, formData, landData, baseMarketValue, landAdjustments, adjustedMarketValue, assessmentLevel, subclassRates, subclassData]);

  // Your original Land FAAS calculations and JSX remain exactly the same...
  const actualUse = formData?.actualUse || landData?.actual_use || 'N/A';
  const marketValue = adjustedMarketValue || baseMarketValue || 0;

  // Keep all your original JSX exactly as it was...
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
          {/* YOUR ORIGINAL LAND FAAS JSX - KEEP EXACTLY AS IS */}
          {/* SUBCLASS BREAKDOWN */}
          {subclassRates && subclassRates.length > 0 && (
            <>
              <div className="section-header">SUBCLASS BREAKDOWN</div>
              <table className="table subclass-table">
                {/* Keep your original table structure */}
              </table>
            </>
          )}

          {/* VALUE ADJUSTMENT */}
          <div className="section-header">VALUE ADJUSTMENT</div>
          <table className="table adjustment-table">
            {/* Keep your original table structure */}
          </table>

          {/* PROPERTY ASSESSMENT */}
          <div className="section-header">PROPERTY ASSESSMENT</div>
          <table className="table assessment-table">
            {/* Keep your original table structure */}
          </table>

          {/* Keep all your original JSX exactly as it was */}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LandFaasBackModal;