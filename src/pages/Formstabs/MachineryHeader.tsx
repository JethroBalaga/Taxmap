// src/pages/MachineryTable/MachineryHeader.tsx
import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { arrowBack, location, person, business, hammer } from 'ionicons/icons';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { CalculatedMachineData } from './MachineryTable';

interface FormContextData {
  districtName: string;
  declarantName: string;
  classification: string;
  actualUse: string;
}

interface MachineryHeaderProps {
  formId: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  machineryData: { machineData: CalculatedMachineData; valueInfoId: string }[];
  formContext: FormContextData | null;
  isLoadingContext: boolean;
}

const MachineryHeader: React.FC<MachineryHeaderProps> = ({
  formId,
  onBack,
  onSubmit,
  isSubmitting,
  machineryData,
  formContext,
  isLoadingContext,
}) => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onBack}>
            <IonIcon slot="icon-only" icon={arrowBack} />
          </IonButton>
        </IonButtons>
        
        <div className="header-content">
          <IonTitle className="page-title">
            Machinery - Form {formId}
          </IonTitle>
          
          {formContext && !isLoadingContext && (
            <div className="form-context-info">
              <IonText color="medium" className="context-item">
                <IonIcon icon={location} className="context-icon" />
                <strong>District:</strong> {formContext.districtName}
              </IonText>
              <IonText color="medium" className="context-item">
                <IonIcon icon={person} className="context-icon" />
                <strong>Declarant:</strong> {formContext.declarantName}
              </IonText>
              <IonText color="medium" className="context-item">
                <IonIcon icon={business} className="context-icon" />
                <strong>Classification:</strong> {formContext.classification}
              </IonText>
              <IonText color="medium" className="context-item">
                <IonIcon icon={hammer} className="context-icon" />
                <strong>Actual Use:</strong> {formContext.actualUse}
              </IonText>
            </div>
          )}
          
          {isLoadingContext && (
            <div className="context-loading">
              <IonSpinner name="crescent" size="small" />
              <IonText color="medium">Loading form details...</IonText>
            </div>
          )}
        </div>

        <IonButtons slot="end">
          <SubmitButton
            label="Submit Form"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={machineryData.length === 0 || isSubmitting}
            className="header-submit-button"
          />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default MachineryHeader;