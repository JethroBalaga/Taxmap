import React, { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { EquipmentData, getEquipmentData } from '../../utils/equipmentLocalStorage';
import EquipmentUpdateForm from './EquipmentUpdateForm';
import { MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import '../../CSS/modal.css';

interface MachineUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (machineData: MachineData, valueInfoId: string) => void;
  existingData?: MachineData;
  valueInfoId?: string;
}

export interface FormData {
  selectedEquipment: string;
  serialNo: string;
  machineDescription: string;
  brandModel: string;
  condition: string;
  machineDetails: string;
  purchaseType: string;
  dateAcquired: string;
  dateInstalled: string;
  dateOperated: string;
  yearsUsed: string;
  estimatedLife: string;
  remainingLife: string;
  numberOfUnits: string;
  originalCost: string;
  freight: string;
  insurance: string;
  installation: string;
  others: string;
  totalCost: string;
  depreciation: string;
  adjustedMarketValue: string;
}

const MachineUpdateModal: React.FC<MachineUpdateModalProps> = ({ 
  isOpen, onClose, onUpdate, existingData, valueInfoId 
}) => {
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    selectedEquipment: '', serialNo: '', machineDescription: '', brandModel: '',
    condition: '', machineDetails: '', purchaseType: '', dateAcquired: '',
    dateInstalled: '', dateOperated: '', yearsUsed: '', estimatedLife: '',
    remainingLife: '', numberOfUnits: '', originalCost: '', freight: '',
    insurance: '', installation: '', others: '', totalCost: '',
    depreciation: '', adjustedMarketValue: ''
  });

  // Load existing data when modal opens
  useEffect(() => {
    if (isOpen && existingData) {
      setFormData(prev => ({
        ...prev,
        ...existingData,
        remainingLife: '',
        totalCost: '',
        adjustedMarketValue: ''
      }));
    }
  }, [isOpen, existingData]);

  // Fetch equipment data
  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      setError(null);
      try {
        const equipmentData = await getEquipmentData();
        setEquipmentOptions(equipmentData || []);
      } catch (err) {
        setError('Failed to load equipment data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEquipmentData();
  }, [isOpen]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateClick = () => {
    if (!isFormValid || !valueInfoId) return;

    // Extract only MachineData fields (exclude calculated fields)
    const machineData: MachineData = {
      valueInfoId: valueInfoId, // ✅ Added the missing required property
      selectedEquipment: formData.selectedEquipment,
      serialNo: formData.serialNo,
      machineDescription: formData.machineDescription,
      brandModel: formData.brandModel,
      condition: formData.condition,
      machineDetails: formData.machineDetails,
      purchaseType: formData.purchaseType,
      dateAcquired: formData.dateAcquired,
      dateInstalled: formData.dateInstalled,
      dateOperated: formData.dateOperated,
      yearsUsed: formData.yearsUsed,
      estimatedLife: formData.estimatedLife,
      numberOfUnits: formData.numberOfUnits,
      originalCost: formData.originalCost,
      freight: formData.freight,
      insurance: formData.insurance,
      installation: formData.installation,
      others: formData.others,
      depreciation: formData.depreciation
    };

    onUpdate(machineData, valueInfoId);
  };

  const isFormValid = formData.selectedEquipment.trim() !== '' && 
                     formData.serialNo.trim() !== '' && 
                     formData.originalCost.trim() !== '';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-machine" style={{ marginRight: '10px' }}></i>
            Update Equipment Information
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="modal-content">
        <EquipmentUpdateForm
          formData={formData}
          onFormChange={handleFormChange}
          equipmentOptions={equipmentOptions}
          isLoading={isLoading}
          error={error}
          onUpdateClick={handleUpdateClick}
          isFormValid={isFormValid}
        />
      </IonContent>
    </IonModal>
  );
};

export default MachineUpdateModal;