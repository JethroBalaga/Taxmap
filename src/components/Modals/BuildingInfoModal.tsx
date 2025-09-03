import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonInput,
  IonDatetime,
  IonButtons,
  IonText
} from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import './buildingmodal.css';

interface BuildingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuildingInfoModal: React.FC<BuildingInfoModalProps> = ({ isOpen, onClose }) => {
  const [adjustment, setAdjustment] = useState<string>('');
  const [assessmentLevel, setAssessmentLevel] = useState<string>('');
  const [declarant, setDeclarant] = useState<string>('');

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      className="custom-wide-modal"
    >
      <IonHeader className="fancy-header">
        <IonToolbar>
          <IonTitle className="fancy-title">Building Information</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} className="fancy-close-btn" fill="clear">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <IonGrid className="custom-grid">
          <IonRow>
            <IonCol className="custom-col">
              <div className="form-section">
                <h3 className="section-title">Building Details</h3>
                
                {/* Adjustment Dropdown */}
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">
                    Adjustment
                  </IonLabel>
                  <IonSelect
                    value={adjustment}
                    placeholder="Select Adjustment"
                    onIonChange={e => setAdjustment(e.detail.value!)}
                    interface="popover"
                  >
                    {/* Empty options for now */}
                    <IonSelectOption value="option1">Option 1</IonSelectOption>
                    <IonSelectOption value="option2">Option 2</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Assessment Level Dropdown */}
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">
                    Assessment Level
                  </IonLabel>
                  <IonSelect
                    value={assessmentLevel}
                    placeholder="Select Assessment Level"
                    onIonChange={e => setAssessmentLevel(e.detail.value!)}
                    interface="popover"
                  >
                    {/* Empty options for now */}
                    <IonSelectOption value="level1">Level 1</IonSelectOption>
                    <IonSelectOption value="level2">Level 2</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Declarant Field with Search Icon */}
                <IonItem className="custom-input" lines="none">
                  <div className="declarant-item-content">
                    <IonLabel position="stacked" className="input-label">
                      Declarant
                    </IonLabel>
                    <div className="declarant-value-container">
                      <IonInput
                        value={declarant}
                        placeholder="Select Declarant"
                        onIonInput={(e) => setDeclarant(e.detail.value!)}
                        className="declarant-value"
                      />
                      <IonIcon icon={searchOutline} className="declarant-search-icon" />
                    </div>
                  </div>
                </IonItem>

                {/* Add more form fields as needed */}
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Next Button Container */}
        <div className="next-btn-container">
          <IonButton expand="block" className="next-button">
            Next
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingInfoModal;