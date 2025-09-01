// src/components/Modals/Form.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Declarant from '../FormComponents/Declarant';
import Kind from '../FormComponents/Kind';
import Classification from '../FormComponents/Classification';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';
import ActualUsedModal from './ActualUsedModal';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss, onSuccess }) => {
  const [district, setDistrict] = useState<number | null>(null);
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [showActualUsedModal, setShowActualUsedModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);

  // Load districts from local storage
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setIsLoadingDistricts(true);
        const districtData = await getDistrictData();
        if (districtData) {
          setDistricts(districtData);
        }
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    if (isOpen) {
      loadDistricts();
    }
  }, [isOpen]);

  // Check form validity whenever any field changes
  useEffect(() => {
    setIsFormValid(
      district !== null &&
      declarant.trim() !== '' &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      area > 0
    );
  }, [district, declarant, kind, classification, area]);

  const handleNextClick = () => {
    if (!isFormValid) return; // Prevent proceeding if form isn't valid
    setShowActualUsedModal(true);
  };

  const handleActualUsedSubmit = (formData: {
    actualUse: string;
    group: string;
    location: string;
    subclass: string;
  }) => {
    console.log('Form data:', { district, declarant, kind, classification, area });
    console.log('Actual Used data:', formData);
    setShowActualUsedModal(false);
    onSuccess(); // Call the success callback
  };

  const resetForm = () => {
    setDistrict(null);
    setDeclarant('');
    setKind('');
    setClassification('');
    setArea(0);
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>GeoTag Form</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleDismiss}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* District Dropdown */}
          <IonItem>
            <IonLabel position="stacked">District</IonLabel>
            <IonSelect
              value={district}
              placeholder="Select District"
              onIonChange={(e) => setDistrict(e.detail.value)}
              interface="popover"
            >
              {isLoadingDistricts ? (
                <IonSelectOption value={null} disabled>
                  Loading districts...
                </IonSelectOption>
              ) : (
                districts.map((district) => (
                  <IonSelectOption 
                    key={district.district_id} 
                    value={district.district_id}
                  >
                    {district.district_name}
                  </IonSelectOption>
                ))
              )}
            </IonSelect>
          </IonItem>

          <Declarant value={declarant} onChange={setDeclarant} />
          <Kind value={kind} onChange={setKind} />
          <Classification value={classification} onChange={setClassification} />
          <Area value={area} onChange={setArea} />
          <Next onClick={handleNextClick} disabled={!isFormValid} />
        </IonContent>
      </IonModal>

      <ActualUsedModal
        isOpen={showActualUsedModal}
        onClose={() => setShowActualUsedModal(false)}
        onNext={handleActualUsedSubmit}
        declarant={declarant.toUpperCase()}
        kind={kind}
        classification={classification}
        area={area}
      />
    </>
  );
};

export default Form;