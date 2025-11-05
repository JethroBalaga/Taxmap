import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonAlert
} from '@ionic/react';
import { arrowBack, leaf, trendingUp, calculator, arrowUpCircleOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useAgriculturalData } from './useAgriculturalData';
import { useAgriculturalSubmission } from './useAgriculturalSubmission';
import AgricultureLandUpdateModal from '../../components/Modals/AgricultureLandUpdateModal';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { agriculturalUtils } from './agriculturalUtils';
import '../../CSS/Forms.css';
import '../../CSS/AgriculturalCard.css';

const AgriculturalAdjustmentTable: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const history = useHistory();

  const {
    formData,
    agriculturalData,
    valueInfoId,
    isLoading,
    isValidForm,
    showUpdateModal,
    subclassRates,
    isLoadingRates,
    formContext,
    loadData,
    setShowUpdateModal,
    isFormUploaded
  } = useAgriculturalData(formId);

  const {
    isSubmitting,
    showToast,
    toastMessage,
    toastColor,
    showConfirmation,
    onSubmit,
    submitForm,
    handleToastDismiss,
    handleConfirmationDismiss
  } = useAgriculturalSubmission(formId);

  const {
    totalAdjustment,
    adjustedMarketValuePercentage,
    displayableFormData,
    tableData
  } = agriculturalUtils(formData, agriculturalData, subclassRates);

  const handleBack = () => {
    history.push('/menu/forms');
  };

  const handleUpdateClick = () => {
    setShowUpdateModal(true);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading agricultural data...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isValidForm) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBack}>
                <IonIcon icon={arrowBack} slot="start" />
                Back
              </IonButton>
            </IonButtons>
            <IonTitle>Invalid Form</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="no-data">
            <IonText>
              <h3>Invalid Form Type</h3>
              <p>This page is only accessible for Land forms (kind 1) with AGRICULTURAL classification (A).</p>
              <IonButton onClick={handleBack} color="primary">
                Return to Forms
              </IonButton>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} slot="start" />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>Agricultural Adjustments - Form {formId}</IonTitle>
          <IonButtons slot="end">
            <SubmitButton
              label={isFormUploaded ? "Form Already Submitted" : "Submit Form"}
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={!agriculturalData || isSubmitting || isFormUploaded}
              className="header-submit-button"
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="forms-container">
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <IonCard className="form-summary-card">
                  <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                      {Object.entries(displayableFormData).map(([key, value], index, array) => {
                        if (index % 4 === 0) {
                          const rowItems = array.slice(index, index + 4);
                          return (
                            <IonRow key={`row-${index}`} style={{ marginBottom: '4px' }}>
                              {rowItems.map(([itemKey, itemValue], colIndex) => (
                                <IonCol key={itemKey} size="3" style={{ padding: '4px' }}>
                                  <IonText>
                                    <strong>
                                      {itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1')}:
                                    </strong> {itemValue !== null && itemValue !== undefined ? itemValue.toString() : 'N/A'}
                                  </IonText>
                                </IonCol>
                              ))}
                              {rowItems.length < 4 &&
                                Array.from({ length: 4 - rowItems.length }).map((_, emptyIndex) => (
                                  <IonCol key={`empty-${emptyIndex}`} size="3" style={{ padding: '4px' }}></IonCol>
                                ))
                              }
                            </IonRow>
                          );
                        }
                        return null;
                      })}
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {formContext && (
              <IonRow>
                <IonCol size="12">
                  <IonCard className="info-card">
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6" size-md="6">
                            <IonText>
                              <strong>District:</strong> {formContext.districtName}
                            </IonText>
                          </IonCol>
                          <IonCol size="6" size-md="6">
                            <IonText>
                              <strong>Declarant:</strong> {formContext.declarantName}
                            </IonText>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            )}

            {formData?.subclass && (
              <IonRow>
                <IonCol size="12">
                  <div style={{ marginBottom: '20px' }}>
                    <IonText>
                      <h3 style={{ margin: '0 0 16px 0', padding: '0 16px' }}>
                        Agricultural Land Information with Assessment Levels
                      </h3>
                    </IonText>
                    {isLoadingRates ? (
                      <div className="loading-container">
                        <IonSpinner name="crescent" />
                        <IonText>Loading subclass rates and assessment levels...</IonText>
                      </div>
                    ) : tableData.length > 0 ? (
                      <DynamicTable
                        data={tableData}
                        keyField="value_info_id"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText color="medium">
                          <p>No subclass rates found for the provided subclass IDs.</p>
                        </IonText>
                      </div>
                    )}
                  </div>
                </IonCol>
              </IonRow>
            )}

            {agriculturalData && (
              <IonRow>
                <IonCol size="12">
                  <IonCard className="agricultural-card">
                    <IonCardHeader>
                      <div className="card-header-with-update">
                        <IonCardTitle className="agricultural-title">
                          <IonIcon icon={leaf} className="agricultural-title-icon" />
                          Agricultural Adjustment Data
                        </IonCardTitle>
                        <IonButton
                          fill="clear"
                          className="icon-blue update-button"
                          onClick={handleUpdateClick}
                        >
                          <IonIcon icon={arrowUpCircleOutline} className="update-icon" />
                          <span className="update-text">Update Agricultural Data</span>
                        </IonButton>
                      </div>
                    </IonCardHeader>

                    <IonCardContent>
                      <div className="agricultural-section">
                        <IonText className="agricultural-section-title">
                          <IonIcon icon={trendingUp} className="agricultural-section-icon" />
                          <h4>Adjustment Factors</h4>
                        </IonText>
                        <div className="agricultural-grid">
                          <div className="agricultural-item">
                            <label>Frontage</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.frontage || 'N/A'}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Weather Road</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.weather_road || 'N/A'}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Market</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.market || 'N/A'}
                            </IonText>
                          </div>
                        </div>
                      </div>

                      <div className="agricultural-section">
                        <IonText className="agricultural-section-title">
                          <IonIcon icon={calculator} className="agricultural-section-icon" />
                          <h4>Calculations</h4>
                        </IonText>
                        <div className="agricultural-grid">
                          <div className="agricultural-item">
                            <label>Total Adjustment</label>
                            <IonText className="agricultural-value total-adjustment">
                              {totalAdjustment}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Adjusted Market Value %</label>
                            <IonText className="agricultural-value adjusted-market-value">
                              {adjustedMarketValuePercentage}%
                            </IonText>
                          </div>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            )}

            {!agriculturalData && (
              <IonRow>
                <IonCol size="12">
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <IonText>
                      <h2>No Agricultural Data Found</h2>
                      <p style={{ marginTop: '20px', color: 'var(--ion-color-medium)' }}>
                        No agricultural adjustment data has been submitted for this form yet.
                      </p>
                    </IonText>
                  </div>
                </IonCol>
              </IonRow>
            )}
          </IonGrid>
        </div>

        {agriculturalData && (
          <AgricultureLandUpdateModal
            isOpen={showUpdateModal}
            onDismiss={() => setShowUpdateModal(false)}
            onSuccess={(updatedData) => {
              console.log('Agricultural data updated successfully:', updatedData);
              setShowUpdateModal(false);
              loadData();
              window.dispatchEvent(new CustomEvent('agriculturalDataUpdated', {
                detail: { formId, valueInfoId }
              }));
            }}
            valueInfoId={valueInfoId || ''}
            currentData={agriculturalData}
          />
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={handleToastDismiss}
          message={toastMessage}
          position="middle"
          color={toastColor}
          duration={3000}
        />

        <IonAlert
          isOpen={showConfirmation}
          onDidDismiss={handleConfirmationDismiss}
          header={'Confirm Submission'}
          message={'Are you sure you want to submit this agricultural form? This action cannot be undone.'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Submit',
              role: 'confirm',
              handler: submitForm
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AgriculturalAdjustmentTable;