import React, { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonButton,
  IonList, IonLabel, IonItem, IonText, IonNote
} from '@ionic/react';
import ActualUsed from '../ActualUsedComponent/ActualUsed';
import Group from '../ActualUsedComponent/Group';
import Location from '../ActualUsedComponent/Location';
import Subclass from '../ActualUsedComponent/Subclass';
import actualUsedData from '../DB/ActualUsed.json';
import { GroupData, RatingClassification, RatingSubclass } from '../ActualUsedComponent/types';
import Next from '../GlobalComponent/Next';
import CalculationModal from './CalculationModal';

interface ActualUsedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (formData: {
    actualUse: string;
    group: string;
    location: string;
    subclass: string;
    rating: number;
  }) => void;
  // Add these new props to receive values from Form
  declarant: string;
  kind: string;
  classification: string;
  area: number;
}

const ActualUsedModal: React.FC<ActualUsedModalProps> = ({
  isOpen,
  onClose,
  onNext,
  declarant,
  kind,
  classification,
  area
}) => {
  const [formData, setFormData] = useState({
    actualUse: '',
    group: '',
    location: '',
    subclass: '',
    rating: 0
  });
  const [showCalculationdModal, setShowCalculationModal] = useState(false);
  const handleInputChange = (field: keyof typeof formData) => (value: string) => {
    const updates: Partial<typeof formData> = {
      [field]: value,
      rating: 0 // Reset rating on any change
    };

    // Cascade resets
    if (field === 'actualUse') {
      updates.subclass = '';
    } else if (field === 'group') {
      updates.location = '';
      updates.subclass = '';
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Calculate rating whenever relevant fields change
  useEffect(() => {
    const calculateRating = () => {
      const { actualUse, group, subclass } = formData;
      if (!actualUse || !group || !subclass) return;

      const selectedGroup = actualUsedData.find(g => g.Group === group) as GroupData | undefined;
      if (!selectedGroup) return;

      const useType = actualUse.toUpperCase() as RatingClassification;
      const ratingsForType = selectedGroup.RATINGS[useType];

      if (!ratingsForType) return;

      const rating = (ratingsForType as Record<string, number>)[subclass] || 0;
      setFormData(prev => ({ ...prev, rating }));
    };

    calculateRating();
  }, [formData.actualUse, formData.group, formData.subclass]);

  const handleNextClick = () => {
    if (!isFormValid) return; // Prevent proceeding if form isn't valid

    setShowCalculationModal(true);
  };

  const isFormValid = !!formData.actualUse &&
    !!formData.group &&
    !!formData.location &&
    !!formData.subclass;

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Property Details</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <ActualUsed
              value={formData.actualUse}
              onChange={handleInputChange('actualUse')}
            />

            <Group
              value={formData.group}
              onChange={handleInputChange('group')}
            />

            {formData.group && (
              <Location
                value={formData.location}
                onChange={handleInputChange('location')}
                group={formData.group}
              />
            )}

            {formData.actualUse && (
              <Subclass
                value={formData.subclass}
                onChange={handleInputChange('subclass')}
                actualUse={formData.actualUse}
              />
            )}

            <IonItem>
              <IonLabel>Rating:</IonLabel>
              <IonText color="primary">
                {formData.rating > 0 ? (
                  `₱${formData.rating.toLocaleString()}`
                ) : (
                  <span style={{ color: '#999' }}>Select all fields</span>
                )}
              </IonText>
            </IonItem>
          </IonList>

          <div className="ion-padding">
            <Next onClick={handleNextClick} disabled={!isFormValid} />
          </div>
        </IonContent>
      </IonModal>
      <CalculationModal
        isOpen={showCalculationdModal}
        onClose={() => setShowCalculationModal(false)}
        // Pass all the required props
        declarant={declarant}
        kind={kind}
        classification={classification}
        area={area}
        actualUse={formData.actualUse}
        group={formData.group}
        location={formData.location}
        subclass={formData.subclass}
        rating={formData.rating}
      />
    </>
  );
};

export default ActualUsedModal;