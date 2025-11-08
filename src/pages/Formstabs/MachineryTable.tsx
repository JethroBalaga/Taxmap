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
  IonAlert,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { construct, locationOutline, person, close } from 'ionicons/icons';
import { useMachineryData } from './useMachineryData';
import { useMachinerySubmission } from './useMachinerySubmission';
import { useMachineUpdate } from './useMachineUpdate';
import MachineUpdateModal from '../../components/Modals/MachineUpdateModal';
import MachineryHeader from './MachineryHeader';
import MachineryCard from './MachineryCard';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import '../../CSS/MachineryTable.css';
import MachineFaasBackModal from '../../components/PropertyDetail/MachineFaasBackModal';

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
    isFormUploaded,
    handleBack,
    loadMachineryData
  } = useMachineryData();

  const {
    isSubmitting,
    showToast: submissionShowToast,
    toastMessage: submissionToastMessage,
    toastColor: submissionToastColor,
    showConfirmation,
    handleSubmit,
    submitForm,
    handleConfirmationDismiss,
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

  // State for FaasBack modal
  const [showFaasBackModal, setShowFaasBackModal] = React.useState(false);
  const [selectedMachineForFaas, setSelectedMachineForFaas] = React.useState<any>(null);

  // Handle opening FaasBack modal
  const handleOpenFaasBack = () => {
    if (machineryData.length > 0) {
      const firstMachine = machineryData[0];
      setSelectedMachineForFaas(firstMachine.machineData);
      setShowFaasBackModal(true);
    }
  };

  // Handle closing FaasBack modal
  const handleCloseFaasBack = () => {
    setShowFaasBackModal(false);
    setSelectedMachineForFaas(null);
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
          formContext={formContext}
          isLoadingContext={isLoadingContext}
          isFormUploaded={isFormUploaded}
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
        formContext={formContext}
        isLoadingContext={isLoadingContext}
        isFormUploaded={isFormUploaded}
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
            <>
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

              {/* View Property Assessment Button - MOVED OUTSIDE GRID WITH NEGATIVE MARGIN */}
              <div style={{
                textAlign: 'center',
                margin: '-25px 0 5px 0',  // Negative top margin to pull it upward
                padding: '0 1rem'
              }}>
                <span
                  onClick={handleOpenFaasBack}
                  style={{
                    color: '#3880ff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal',
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(56, 128, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  View Property Assessment
                </span>
              </div>
            </>
          )}
        </div>

        {/* Machine Update Modal */}
        <MachineUpdateModal
          isOpen={updateModalOpen}
          onClose={setUpdateModalOpen}
          onUpdate={handleMachineUpdate}
          existingData={selectedMachineData || undefined}
          valueInfoId={selectedValueInfoId}
        />

        {/* Machine FaasBack Modal */}
        <IonModal
          isOpen={showFaasBackModal}
          onDidDismiss={handleCloseFaasBack}
          style={{ '--width': '95%', '--height': '95%' }}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Property Assessment</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleCloseFaasBack}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <MachineFaasBackModal
              isOpen={showFaasBackModal}
              onClose={handleCloseFaasBack}
              machineData={selectedMachineForFaas}
              formData={formContext}
              baseMarketValue={parseFloat(selectedMachineForFaas?.totalCost) || 0}
              machineAdjustments={[]}
              adjustedMarketValue={parseFloat(selectedMachineForFaas?.adjustedMarketValue) || 0}
              assessmentLevel={formContext?.valueInfoTableData[0]?.assessment_level || '0%'}
            />
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={submissionShowToast}
          onDidDismiss={() => setSubmissionShowToast(false)}
          message={submissionToastMessage}
          position="middle"
          color={submissionToastColor}
          duration={3000}
        />

        <IonAlert
          isOpen={showConfirmation}
          onDidDismiss={handleConfirmationDismiss}
          header={'Confirm Submission'}
          message={'Are you sure you want to submit this machinery form? This action cannot be undone.'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Submit',
              role: 'confirm',
              handler: () => submitForm(formId, machineryData)
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default MachineryTable;