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
import { MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';

interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

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
}) => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onBack}>
            <IonIcon slot="start" icon={arrowBack} />
            Back
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