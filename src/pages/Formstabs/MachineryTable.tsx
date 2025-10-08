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
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { construct } from 'ionicons/icons';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import MachineUpdateModal from '../../components/Modals/MachineUpdateModal';
import MachineryHeader from './MachineryHeader';
import MachineryCard from './MachineryCard';
import '../../CSS/MachineryTable.css';

interface RouteParams {
  formId: string;
}

interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

// Helper function to validate and convert dates
const validateDate = (dateString: string | null): string | null => {
  if (dateString == null || dateString === '') return null;
  
  const dateToValidate = typeof dateString === 'string' ? dateString : String(dateString);
  
  try {
    const date = new Date(dateToValidate);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// Helper function to validate numbers
const validateNumber = (value: any): number | null => {
  if (value == null || value === '') return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }
  
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
};

const MachineryTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [machineryData, setMachineryData] = useState<{machineData: CalculatedMachineData, valueInfoId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState<MachineData | null>(null);
  const [selectedValueInfoId, setSelectedValueInfoId] = useState<string>('');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

  useEffect(() => {
    loadMachineryData();
  }, [formId]);

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

  // Enhanced photo handling function
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
        // For web - check multiple possible storage locations
        const photoData = localStorage.getItem(photoTag.photoName);
        if (photoData && photoData.startsWith('data:')) {
          return await (await fetch(photoData)).blob();
        }
        
        // Additional fallback: check if there's a base64 data field
        if (photoTag.photoData) {
          return await (await fetch(photoTag.photoData)).blob();
        }
        
        // Final fallback: check if photoName is actually a data URL
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

  // Main submit function with proper error handling
  const handleSubmit = async () => {
    setIsSubmitting(true);
    showToastMessage('Starting machinery upload process...', 'warning');

    try {
      const formData = FormDataLocalStorage.getFormData(formId);
      if (!formData) throw new Error('Form data not found');
      if (formData.uploaded) throw new Error('Form already uploaded');

      // Process each machinery item
      for (const { machineData, valueInfoId } of machineryData) {
        const valueInfo = ValueInfoLocalStorage.getValueInfo(valueInfoId);
        if (!valueInfo) throw new Error(`ValueInfo not found for ${valueInfoId}`);

        const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
        if (!photoTag) throw new Error('Photo tag not found');

        // Insert photo record into database
        const databaseTagId = await supabaseApi.insertPhoto({
          photo: photoTag.photoName,
          longitude: photoTag.longitude,
          latitude: photoTag.latitude,
          accuracy: photoTag.accuracy || null,
          altitude: photoTag.altitude || null,
          date_taken: validateDate(photoTag.timestamp ? photoTag.timestamp.toISOString().split('T')[0] : null)
        });
        if (!databaseTagId) throw new Error('Failed to insert photo record');

        // Upload the actual photo file
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

        // Insert form record (only once per form)
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

        // Insert value info
        const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

        // Insert machinery data with proper validation
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

        // Mark form as uploaded after first successful machinery item
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
      />
      
      <IonContent fullscreen>
        <div className="machinery-container">
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

        {/* Machine Update Modal */}
        <MachineUpdateModal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          onUpdate={handleMachineUpdate}
          existingData={selectedMachineData || undefined}
          valueInfoId={selectedValueInfoId}
        />

        {/* Toast Component */}
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