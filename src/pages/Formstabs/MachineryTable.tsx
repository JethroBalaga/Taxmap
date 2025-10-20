import React from 'react';
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
import { construct, locationOutline, person } from 'ionicons/icons';
import { useMachineryData } from './useMachineryData';
import { useMachinerySubmission } from './useMachinerySubmission';
import { useMachineUpdate } from './useMachineUpdate';
import MachineUpdateModal from '../../components/Modals/MachineUpdateModal';
import MachineryHeader from './MachineryHeader';
import MachineryCard from './MachineryCard';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import '../../CSS/MachineryTable.css';

interface RouteParams {
  formId: string;
}

const FormInfoCards: React.FC<{ formContext: any }> = ({ formContext }) => {
  return (
    <div className="form-info-cards">
      <IonRow class="ion-justify-content-center">
        <IonCol size="12" size-md="6" size-lg="3">
          <IonCard className="info-card district-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={locationOutline} className="card-icon" />
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
  
  // Use custom hooks for state management
  const {
    machineryData,
    isLoading,
    formContext,
    isLoadingContext,
    handleBack,
    loadMachineryData
  } = useMachineryData();

  const {
    isSubmitting,
    showToast: submissionShowToast,
    toastMessage: submissionToastMessage,
    toastColor: submissionToastColor,
    handleSubmit,
    setShowToast: setSubmissionShowToast
  } = useMachinerySubmission();

  const {
    updateModalOpen,
    selectedMachineData,
    selectedValueInfoId,
    handleUpdateClick,
    handleMachineUpdate,
    setUpdateModalOpen
  } = useMachineUpdate(loadMachineryData);

  if (isLoading) {
    return (
      <IonPage>
        <MachineryHeader 
          formId={formId}
          onBack={handleBack}
          onSubmit={() => handleSubmit(formId, machineryData)}
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
        onSubmit={() => handleSubmit(formId, machineryData)}
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
          
          {/* Value Info Table in Card */}
          {formContext && !isLoadingContext && formContext.valueInfoTableData.length > 0 && (
            <div className="form-details-section">
              <IonCard>
                <IonCardContent>
                  <DynamicTable
                    data={formContext.valueInfoTableData}
                    keyField="value_info_id"
                  />
                </IonCardContent>
              </IonCard>
            </div>
          )}
          
          {formContext && !isLoadingContext && formContext.valueInfoTableData.length === 0 && (
            <div className="no-value-info">
              <IonCard>
                <IonCardContent>
                  <IonText color="medium">
                    <p>No Value Info entries found for this form.</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
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
          isOpen={submissionShowToast}
          onDidDismiss={() => setSubmissionShowToast(false)}
          message={submissionToastMessage}
          position="middle"
          color={submissionToastColor}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default MachineryTable;