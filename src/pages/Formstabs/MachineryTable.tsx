import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonIcon,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { construct, location, person } from 'ionicons/icons';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { getDistrictById } from '../../utils/districtLocalStorage';
import { getDeclarantById } from '../../utils/DeclarantLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import MachineUpdateModal from '../../components/Modals/MachineUpdateModal';
import MachineryHeader from './MachineryHeader';
import MachineryCard from './MachineryCard';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import { validateDate, validateNumber } from '../../utils/MachineryUtils';
import { 
  getAssessmentLevelData, 
  AssessmentLevelData 
} from '../../utils/assessmentLevelLocalStorage';
import '../../CSS/MachineryTable.css';

interface RouteParams {
  formId: string;
}

export interface FormContextData {
  districtName: string;
  declarantName: string;
  classification: string;
  actualUse: string;
  valueInfoTableData: Array<{
    value_info_id: string;
    classification: string;
    actual_used: string;
    base_market_value: string;
    adjusted_market_value: string;
    assessment_level: string;
    assessed_value: string;
  }>;
}

export interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

const FormInfoCards: React.FC<{ formContext: FormContextData }> = ({ formContext }) => {
  return (
    <div className="form-info-cards">
      <IonRow class="ion-justify-content-center">
        <IonCol size="12" size-md="6" size-lg="3">
          <IonCard className="info-card district-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={location} className="card-icon" />
                District
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="card-value">{formContext.districtName}</IonText>
            </IonCardContent>
          </IonCard>
        </IonCol>
        
        <IonCol size="12" size-md="6" size-lg="3">
          <IonCard className="info-card declarant-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} className="card-icon" />
                Declarant
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="card-value">{formContext.declarantName}</IonText>
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </div>
  );
};

const MachineryTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [machineryData, setMachineryData] = useState<{machineData: CalculatedMachineData, valueInfoId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formContext, setFormContext] = useState<FormContextData | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [assessmentLevels, setAssessmentLevels] = useState<AssessmentLevelData[]>([]);
  
  // State for update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState<MachineData | null>(null);
  const [selectedValueInfoId, setSelectedValueInfoId] = useState<string>('');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

  // Format number function - no currency symbol
  const formatNumber = (value: string): string => {
    if (!value || value === 'N/A') return 'N/A';
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  // Load assessment level data
  const loadAssessmentLevels = async () => {
    try {
      const data = await getAssessmentLevelData();
      if (data) {
        setAssessmentLevels(data);
      }
    } catch (error) {
      console.error('Error loading assessment levels:', error);
    }
  };

  // Get assessment level rate for a given adjusted market value, kind_id, and classification
  const getAssessmentLevelRate = (adjustedMarketValue: string, kindId: number, classification: string): { rate: string, rawRate: number } => {
    if (!adjustedMarketValue || adjustedMarketValue === 'N/A') return { rate: 'N/A', rawRate: 0 };
    
    const value = parseFloat(adjustedMarketValue);
    if (isNaN(value)) return { rate: 'N/A', rawRate: 0 };
    
    // Filter for the specific kind_id and class_id (classification)
    const relevantAssessmentLevels = assessmentLevels.filter(level => 
      level.kind_id === kindId && 
      level.class_id === classification
    );

    if (relevantAssessmentLevels.length === 0) {
      return { rate: 'N/A', rawRate: 0 };
    }

    // Find the assessment level where the value falls within range1 and range2
    const matchingLevel = relevantAssessmentLevels.find(level => 
      value >= level.range1 && value <= level.range2
    );

    // If no exact match found, use the first available assessment level for this kind/class
    if (!matchingLevel && relevantAssessmentLevels.length > 0) {
      const rate = relevantAssessmentLevels[0].rate_percent;
      const rawRate = parseFloat(rate.replace('%', '')) || 0;
      return { 
        rate: rate.includes('%') ? rate : `${rate}%`, 
        rawRate 
      };
    }

    if (matchingLevel) {
      const rate = matchingLevel.rate_percent;
      const rawRate = parseFloat(rate.replace('%', '')) || 0;
      return { 
        rate: rate.includes('%') ? rate : `${rate}%`, 
        rawRate 
      };
    }

    return { rate: 'N/A', rawRate: 0 };
  };

  // Calculate assessed value: Adjusted Market Value x Assessment Level Rate
  const calculateAssessedValue = (adjustedMarketValue: string, rawRate: number): string => {
    if (!adjustedMarketValue || adjustedMarketValue === 'N/A' || rawRate === 0) return 'N/A';
    
    const value = parseFloat(adjustedMarketValue);
    if (isNaN(value)) return 'N/A';
    
    const assessedValue = value * (rawRate / 100);
    return assessedValue.toFixed(2);
  };

  useEffect(() => {
    loadMachineryData();
    loadAssessmentLevels();
  }, [formId]);

  useEffect(() => {
    loadFormContext();
  }, [formId, machineryData, assessmentLevels]);

  const loadFormContext = async () => {
    if (!formId) return;
    
    try {
      const formData = FormDataLocalStorage.getFormData(formId);
      if (!formData) return;

      const districtData = formData.district ? await getDistrictById(formData.district) : null;
      const districtName = districtData?.district_name || 'Unknown District';

      const declarantData = formData.declarantId ? await getDeclarantById(formData.declarantId) : null;
      const declarantName = declarantData 
        ? `${declarantData.firstname} ${declarantData.lastname}`
        : 'Unknown Declarant';

      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      const tableData = formValueInfo.map(valueInfo => {
        const machineEntry = machineryData.find(item => item.valueInfoId === valueInfo.id);
        const adjustedMarketValue = machineEntry ? machineEntry.machineData.adjustedMarketValue : 'N/A';
        
        // Get the assessment level using kind_id and classification from formData
        const { rate: assessmentLevel, rawRate } = getAssessmentLevelRate(
          adjustedMarketValue, 
          parseInt(formData.kind) || 3,
          formData.classification || ''
        );

        // Calculate assessed value
        const assessedValue = calculateAssessedValue(adjustedMarketValue, rawRate);
        
        return {
          value_info_id: valueInfo.id,
          classification: formData.classification || 'Not specified',
          actual_used: formData.actualUse || 'Not specified',
          base_market_value: machineEntry ? formatNumber(machineEntry.machineData.totalCost) : 'N/A',
          adjusted_market_value: machineEntry ? formatNumber(adjustedMarketValue) : 'N/A',
          assessment_level: assessmentLevel,
          assessed_value: formatNumber(assessedValue)
        };
      });

      setFormContext({
        districtName,
        declarantName,
        classification: formData.classification || 'Not specified',
        actualUse: formData.actualUse || 'Not specified',
        valueInfoTableData: tableData
      });
    } catch (error) {
      console.error('Error loading form context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const calculateRemainingLife = (yearsUsed: string, estimatedLife: string): string => {
    if (!yearsUsed || !estimatedLife) return 'N/A';
    const years = parseFloat(yearsUsed);
    const life = parseFloat(estimatedLife);
    if (isNaN(years) || isNaN(life)) return 'N/A';
    const remaining = life - years;
    return remaining > 0 ? remaining.toFixed(1) : '0.0';
  };

  const calculateTotalCost = (
    originalCost: string,
    freight: string,
    insurance: string,
    installation: string,
    others: string
  ): string => {
    const cost = parseFloat(originalCost) || 0;
    const freightCost = parseFloat(freight) || 0;
    const insuranceCost = parseFloat(insurance) || 0;
    const installationCost = parseFloat(installation) || 0;
    const othersCost = parseFloat(others) || 0;

    const total = cost + freightCost + insuranceCost + installationCost + othersCost;
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const calculateAdjustedMarketValue = (totalCost: string, depreciation: string): string => {
    const total = parseFloat(totalCost) || 0;
    const depreciationPercent = parseFloat(depreciation) || 0;

    if (total > 0 && depreciationPercent > 0) {
      const depreciationAmount = total * (depreciationPercent / 100);
      const adjustedValue = total - depreciationAmount;
      return adjustedValue > 0 ? adjustedValue.toFixed(2) : '0.00';
    }
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const loadMachineryData = () => {
    setIsLoading(true);
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      const machineryWithCalculations: {machineData: CalculatedMachineData, valueInfoId: string}[] = [];
      
      formValueInfo.forEach(valueInfo => {
        const machineData = MachineDataLocalStorage.getMachineData(valueInfo.id);
        if (machineData) {
          const remainingLife = calculateRemainingLife(machineData.yearsUsed, machineData.estimatedLife);
          const totalCost = calculateTotalCost(
            machineData.originalCost,
            machineData.freight,
            machineData.insurance,
            machineData.installation,
            machineData.others
          );
          const adjustedMarketValue = calculateAdjustedMarketValue(totalCost, machineData.depreciation);

          const calculatedMachineData: CalculatedMachineData = {
            ...machineData,
            remainingLife,
            totalCost,
            adjustedMarketValue
          };

          machineryWithCalculations.push({
            machineData: calculatedMachineData,
            valueInfoId: valueInfo.id
          });
        }
      });
      
      setMachineryData(machineryWithCalculations);
    } catch (error) {
      console.error('Error loading machinery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const handleUpdateClick = (machineData: CalculatedMachineData, valueInfoId: string) => {
    const baseMachineData: MachineData = {
      valueInfoId: machineData.valueInfoId,
      selectedEquipment: machineData.selectedEquipment,
      serialNo: machineData.serialNo,
      machineDescription: machineData.machineDescription,
      brandModel: machineData.brandModel,
      condition: machineData.condition,
      machineDetails: machineData.machineDetails,
      purchaseType: machineData.purchaseType,
      dateAcquired: machineData.dateAcquired,
      dateInstalled: machineData.dateInstalled,
      dateOperated: machineData.dateOperated,
      yearsUsed: machineData.yearsUsed,
      estimatedLife: machineData.estimatedLife,
      numberOfUnits: machineData.numberOfUnits,
      originalCost: machineData.originalCost,
      freight: machineData.freight,
      insurance: machineData.insurance,
      installation: machineData.installation,
      others: machineData.others,
      depreciation: machineData.depreciation
    };
    
    setSelectedMachineData(baseMachineData);
    setSelectedValueInfoId(valueInfoId);
    setUpdateModalOpen(true);
  };

  const handleMachineUpdate = async (updatedData: MachineData, valueInfoId: string) => {
    try {
      const success = MachineDataLocalStorage.updateMachineData(valueInfoId, updatedData);
      
      if (success) {
        console.log('Machine data updated successfully');
        setUpdateModalOpen(false);
        loadMachineryData();
      } else {
        console.error('Failed to update machine data');
      }
    } catch (error) {
      console.error('Error updating machine data:', error);
    }
  };

  const getPhotoFile = async (photoTag: any): Promise<Blob | null> => {
    try {
      const photoPath = `phototags/${photoTag.photoName}`;
      
      if (Capacitor.isNativePlatform()) {
        const file = await Filesystem.readFile({
          path: photoPath,
          directory: Directory.Data
        });
        
        const blob = await (await fetch(`data:image/jpeg;base64,${file.data}`)).blob();
        return blob;
      } else {
        const photoData = localStorage.getItem(photoTag.photoName);
        if (photoData && photoData.startsWith('data:')) {
          return await (await fetch(photoData)).blob();
        }
        
        if (photoTag.photoData) {
          return await (await fetch(photoTag.photoData)).blob();
        }
        
        if (photoTag.photoName && photoTag.photoName.startsWith('data:image')) {
          return await (await fetch(photoTag.photoName)).blob();
        }
      }

      console.warn('Photo not found for upload in any storage location', photoTag);
      return null;
    } catch (error) {
      console.error('Error getting photo file:', error);
      return null;
    }
  };

  const cleanupLocalPhotos = async (photoTag: any) => {
    try {
      const photoPath = `phototags/${photoTag.photoName}`;
      
      if (Capacitor.isNativePlatform()) {
        await Filesystem.deleteFile({
          path: photoPath,
          directory: Directory.Data
        });
        console.log('Local photo cleaned up successfully');
      } else {
        localStorage.removeItem(photoTag.photoName);
      }
    } catch (error) {
      console.warn('Could not clean up local photo:', error);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    showToastMessage('Starting machinery upload process...', 'warning');

    try {
      const formData = FormDataLocalStorage.getFormData(formId);
      if (!formData) throw new Error('Form data not found');
      if (formData.uploaded) throw new Error('Form already uploaded');

      for (const { machineData, valueInfoId } of machineryData) {
        const valueInfo = ValueInfoLocalStorage.getValueInfo(valueInfoId);
        if (!valueInfo) throw new Error(`ValueInfo not found for ${valueInfoId}`);

        const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
        if (!photoTag) throw new Error('Photo tag not found');

        const databaseTagId = await supabaseApi.insertPhoto({
          photo: photoTag.photoName,
          longitude: photoTag.longitude,
          latitude: photoTag.latitude,
          date_taken: validateDate(photoTag.timestamp ? photoTag.timestamp.toISOString().split('T')[0] : null)
        });
        if (!databaseTagId) throw new Error('Failed to insert photo record');

        const photoFile = await getPhotoFile(photoTag);
        if (photoFile) {
          const folderPath = `${databaseTagId}/${photoTag.photoName}`;
          const { error: uploadError } = await supabase.storage.from('tag-photos').upload(folderPath, photoFile, {
            contentType: 'image/jpeg',
            upsert: false
          });
          if (uploadError) {
            console.warn('Photo upload failed', uploadError);
            showToastMessage('Form submitted but photo upload failed', 'warning');
          } else {
            await cleanupLocalPhotos(photoTag);
          }
        } else {
          showToastMessage('Form submitted but could not retrieve photo', 'warning');
        }

        let databaseFormId = formData.synced_id;
        if (!databaseFormId) {
          databaseFormId = await supabaseApi.insertForm({
            declarant_id: formData.declarantId || 0,
            kind_id: parseInt(formData.kind),
            class_id: formData.classification,
            area: formData.area.toString(),
            district_id: formData.district,
            actual_used_id: formData.actualUse,
            subclass_id: formData.subclass || null,
            status: 'New'
          });
          if (!databaseFormId) throw new Error('Failed to insert form');
        }

        const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

        await supabaseApi.insertMachineData(databaseValueInfoId, {
          selected_equipment: machineData.selectedEquipment || null,
          serial_no: machineData.serialNo || null,
          machine_description: machineData.machineDescription || null,
          brand_model: machineData.brandModel || null,
          condition: machineData.condition || null,
          machine_details: machineData.machineDetails || null,
          purchase_type: machineData.purchaseType || null,
          date_acquired: validateDate(machineData.dateAcquired),
          date_installed: validateDate(machineData.dateInstalled),
          date_operated: validateDate(machineData.dateOperated),
          years_used: validateNumber(machineData.yearsUsed),
          estimated_life: validateNumber(machineData.estimatedLife),
          number_of_units: validateNumber(machineData.numberOfUnits),
          original_cost: validateNumber(machineData.originalCost),
          freight: validateNumber(machineData.freight),
          insurance: validateNumber(machineData.insurance),
          installation: validateNumber(machineData.installation),
          others: validateNumber(machineData.others),
          depreciation: validateNumber(machineData.depreciation)
        });

        if (!formData.synced_id) {
          FormDataLocalStorage.markFormAsUploaded(formId, databaseFormId);
        }
      }

      showToastMessage('Machinery data submitted successfully! All data synchronized with server.', 'success');

    } catch (error: any) {
      console.error('Machinery upload failed:', error);
      showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <MachineryHeader 
          formId={formId}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          machineryData={machineryData}
          formContext={formContext}
          isLoadingContext={isLoadingContext}
        />
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading machinery equipment...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <MachineryHeader 
        formId={formId}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        machineryData={machineryData}
        formContext={formContext}
        isLoadingContext={isLoadingContext}
      />
      
      <IonContent fullscreen>
        <div className="machinery-container">
          {formContext && !isLoadingContext && (
            <FormInfoCards formContext={formContext} />
          )}
          
          {formContext && !isLoadingContext && formContext.valueInfoTableData.length > 0 && (
            <div className="form-details-section">
              <DynamicTable
                data={formContext.valueInfoTableData}
                keyField="value_info_id"
              />
            </div>
          )}
          
          {formContext && !isLoadingContext && formContext.valueInfoTableData.length === 0 && (
            <div className="no-value-info">
              <IonText color="medium">
                <p>No Value Info entries found for this form.</p>
              </IonText>
            </div>
          )}
          
          {isLoadingContext && (
            <div className="context-loading-full">
              <IonSpinner name="crescent" />
              <IonText>Loading form details...</IonText>
            </div>
          )}

          {machineryData.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={construct} size="large" />
              <IonText>
                <h3>No Machinery Equipment Found</h3>
                <p>No machinery has been added to Form {formId} yet.</p>
              </IonText>
            </div>
          ) : (
            <IonGrid>
              <IonRow class="ion-justify-content-center">
                {machineryData.map(({ machineData, valueInfoId }, index) => (
                  <MachineryCard
                    key={valueInfoId}
                    machineData={machineData}
                    valueInfoId={valueInfoId}
                    index={index}
                    onUpdateClick={handleUpdateClick}
                  />
                ))}
              </IonRow>
            </IonGrid>
          )}
        </div>

        <MachineUpdateModal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          onUpdate={handleMachineUpdate}
          existingData={selectedMachineData || undefined}
          valueInfoId={selectedValueInfoId}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          position="middle"
          color={toastColor}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default MachineryTable;