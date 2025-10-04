import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { EquipmentData, getEquipmentData } from '../../utils/equipmentLocalStorage';
import EquipmentForm from './EquipmentForm';
import '../../CSS/modal.css';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (machineData: MachineData) => void;
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

export interface MachineData {
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
  numberOfUnits: string;
  originalCost: string;
  freight: string;
  insurance: string;
  installation: string;
  others: string;
  depreciation: string;
}

const MachineModal: React.FC<MachineModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    selectedEquipment: '',
    serialNo: '',
    machineDescription: '',
    brandModel: '',
    condition: '',
    machineDetails: '',
    purchaseType: '',
    dateAcquired: '',
    dateInstalled: '',
    dateOperated: '',
    yearsUsed: '',
    estimatedLife: '',
    remainingLife: '',
    numberOfUnits: '',
    originalCost: '',
    freight: '',
    insurance: '',
    installation: '',
    others: '',
    totalCost: '',
    depreciation: '',
    adjustedMarketValue: ''
  });

  // Fetch equipment data when modal opens
  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const equipmentData = await getEquipmentData();
        if (equipmentData) {
          setEquipmentOptions(equipmentData);
        } else {
          setError('No equipment data available');
        }
      } catch (err) {
        console.error('Error fetching equipment data:', err);
        setError('Failed to load equipment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipmentData();
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        selectedEquipment: '',
        serialNo: '',
        machineDescription: '',
        brandModel: '',
        condition: '',
        machineDetails: '',
        purchaseType: '',
        dateAcquired: '',
        dateInstalled: '',
        dateOperated: '',
        yearsUsed: '',
        estimatedLife: '',
        remainingLife: '',
        numberOfUnits: '',
        originalCost: '',
        freight: '',
        insurance: '',
        installation: '',
        others: '',
        totalCost: '',
        depreciation: '',
        adjustedMarketValue: ''
      });
      setError(null);
    }
  }, [isOpen]);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextClick = () => {
    if (!isFormValid) return;

    const machineData: MachineData = {
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

    console.log('Machine data to pass to PhotoModal:', machineData);
    
    if (onSuccess) {
      onSuccess(machineData);
    }
  };

  const isFormValid = formData.selectedEquipment.trim() !== '' && formData.serialNo.trim() !== '';

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="custom-wide-modal"
    >
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-machine" style={{ marginRight: '10px' }}></i>
            Equipment Information
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <EquipmentForm
          formData={formData}
          onFormChange={handleFormChange}
          equipmentOptions={equipmentOptions}
          isLoading={isLoading}
          error={error}
          onNextClick={handleNextClick}
          isFormValid={isFormValid}
        />
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;