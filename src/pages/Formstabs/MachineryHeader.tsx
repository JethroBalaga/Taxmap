import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { CalculatedMachineData } from './MachineryTable';

interface MachineryHeaderProps {
  formId: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  machineryData: { machineData: CalculatedMachineData; valueInfoId: string }[];
}

const MachineryHeader: React.FC<MachineryHeaderProps> = ({
  formId,
  onBack,
  onSubmit,
  isSubmitting,
  machineryData,
}) => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onBack}>
            <IonIcon slot="icon-only" icon={arrowBack} />
          </IonButton>
        </IonButtons>
        
        <IonTitle>Machinery - Form {formId}</IonTitle>
        
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