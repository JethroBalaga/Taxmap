import React, { useState } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonToast,
    IonTitle,
    IonSpinner,
    IonText,
    IonAlert,
    IonRow,
    IonCol,
    IonGrid
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { useNonAgriLand } from './useNonAgriLand';
import { NonAgriLandUI } from './NonAgriLandUI';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import LandFaasBackModal from '../../components/PropertyDetail/LandFaasBackModal';
import "../../CSS/Forms.css";

const NonAgriLandTable: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();

    // State for Land Faas Modal
    const [showLandFaasModal, setShowLandFaasModal] = useState(false);

    const {
        // State
        formData,
        valueInfoId,
        isLoading,
        showToast,
        toastMessage,
        toastColor,
        isSubmitting,
        showAdjustmentModal,
        showUpdateAdjustmentModal,
        showStrippingModal,
        showInfoModal,
        setShowInfoModal,
        selectedAdjustmentType,
        description,
        adjustmentFactor,
        additionalFactor,
        selectedAdjustmentForUpdate,
        showDeleteAlert,
        adjustmentToDelete,
        selectedRow,
        landAdjustments,
        isLoadingAdjustments,
        currentAdjustments,
        visibleIcons,
        subclassRates,
        isLoadingRates,
        hasStripping,
        getStrippingInfo,
        getStrippingAdjustment,
        showReverseDeleteWarning,
        setShowReverseDeleteWarning,
        reverseDeleteWarningMessage,
        submitDisabledInfo,
        isFormUploaded,
        
        // New confirmation states
        showConfirmation,
        submitForm,
        handleConfirmationDismiss,
        
        // Handlers
        handleBack,
        onSubmit,
        handleIconClick,
        handleUpdateIconClick,
        handleModalDismiss,
        handleUpdateModalDismiss,
        handleStrippingModalDismiss,
        handleRowClick,
        handleDeleteConfirm,
        showToastMessage,
        setDescription,
        setAdjustmentFactor,
        setAdditionalFactor,
        setShowDeleteAlert,
        setAdjustmentToDelete
    } = useNonAgriLand(formId);

    // Handlers for Land Faas Modal
    const handleOpenLandFaas = () => {
        setShowLandFaasModal(true);
    };

    const handleCloseLandFaas = () => {
        setShowLandFaasModal(false);
    };

    // Calculation functions for modal data
    const calculateBaseMarketValue = () => {
        if (!subclassRates || subclassRates.length === 0) return 0;
        
        return subclassRates.reduce((total, rate) => {
            const baseValue = parseFloat(rate.base_market_value) || 0;
            return total + baseValue;
        }, 0);
    };

    const calculateAdjustedMarketValue = () => {
        if (!subclassRates || subclassRates.length === 0) return 0;
        
        return subclassRates.reduce((total, rate) => {
            const adjustedValue = parseFloat(rate.adjustment_market_value) || 0;
            return total + adjustedValue;
        }, 0);
    };

    const getAssessmentLevel = () => {
        if (!subclassRates || subclassRates.length === 0) return null;
        
        const firstRate = subclassRates[0];
        if (firstRate && firstRate.assessment_level) {
            return {
                rate_percent: firstRate.assessment_level
            };
        }
        return null;
    };

    const calculateAssessedValue = () => {
        const adjustedMarketValue = calculateAdjustedMarketValue();
        const assessmentLevel = getAssessmentLevel();
        
        if (!assessmentLevel || !assessmentLevel.rate_percent) return 0;
        
        const ratePercent = parseFloat(assessmentLevel.rate_percent.replace('%', '')) || 0;
        const assessmentRate = ratePercent / 100;
        
        return adjustedMarketValue * assessmentRate;
    };

    if (isLoading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleBack}>
                                <IonIcon icon={arrowBack} />
                                Back
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Non-Agricultural Land</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonSpinner name="crescent" />
                        <p>Loading form data...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!formData) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleBack}>
                                <IonIcon icon={arrowBack} />
                                Back
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Non-Agricultural Land</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText>Form not found</IonText>
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
                            <IonIcon icon={arrowBack} />
                            Back
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Non-Agricultural Land - Form {formData.id}</IonTitle>
                    
                    <IonButtons slot="end">
                        <SubmitButton
                            label={isFormUploaded ? "Form Already Submitted" : "Submit Form"}
                            onClick={onSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting || submitDisabledInfo.disabled || isFormUploaded}
                            className="header-submit-button"
                        />
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="forms-container">
                <NonAgriLandUI
                    formData={formData}
                    currentAdjustments={currentAdjustments}
                    visibleIcons={visibleIcons}
                    selectedRow={selectedRow}
                    landAdjustments={landAdjustments}
                    isLoadingAdjustments={isLoadingAdjustments}
                    isSubmitting={isSubmitting}
                    showAdjustmentModal={showAdjustmentModal}
                    showUpdateAdjustmentModal={showUpdateAdjustmentModal}
                    showStrippingModal={showStrippingModal}
                    showInfoModal={showInfoModal}
                    setShowInfoModal={setShowInfoModal}
                    selectedAdjustmentType={selectedAdjustmentType}
                    description={description}
                    adjustmentFactor={adjustmentFactor}
                    additionalFactor={additionalFactor}
                    selectedAdjustmentForUpdate={selectedAdjustmentForUpdate}
                    showDeleteAlert={showDeleteAlert}
                    adjustmentToDelete={adjustmentToDelete}
                    valueInfoId={valueInfoId}
                    subclassRates={subclassRates}
                    isLoadingRates={isLoadingRates}
                    getStrippingInfo={getStrippingInfo}
                    getStrippingAdjustment={getStrippingAdjustment}
                    showReverseDeleteWarning={showReverseDeleteWarning}
                    setShowReverseDeleteWarning={setShowReverseDeleteWarning}
                    reverseDeleteWarningMessage={reverseDeleteWarningMessage}
                    submitDisabledInfo={submitDisabledInfo}
                    isFormUploaded={isFormUploaded}
                    handleOpenLandFaas={handleOpenLandFaas}
                    
                    // Handlers
                    onSubmit={onSubmit}
                    handleIconClick={handleIconClick}
                    handleUpdateIconClick={handleUpdateIconClick}
                    handleModalDismiss={handleModalDismiss}
                    handleUpdateModalDismiss={handleUpdateModalDismiss}
                    handleStrippingModalDismiss={handleStrippingModalDismiss}
                    handleRowClick={handleRowClick}
                    handleDeleteConfirm={handleDeleteConfirm}
                    setDescription={setDescription}
                    setAdjustmentFactor={setAdjustmentFactor}
                    setAdditionalFactor={setAdditionalFactor}
                    setShowDeleteAlert={setShowDeleteAlert}
                    setAdjustmentToDelete={setAdjustmentToDelete}
                />

                {/* View Property Assessment - SIMPLE TEXT LINK (Like Building Table) */}
                {!isLoading && formData && (
                    <div style={{
                        textAlign: 'center',
                        margin: '1.5rem 0',
                        padding: '0 1rem'
                    }}>
                        <span
                            onClick={handleOpenLandFaas}
                            style={{
                                color: '#3880ff',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'normal'
                            }}
                        >
                            View Property Assessment
                        </span>
                    </div>
                )}

                {/* Land Faas Back Modal */}
                <LandFaasBackModal
                    isOpen={showLandFaasModal}
                    onClose={handleCloseLandFaas}
                    formData={formData}
                    baseMarketValue={calculateBaseMarketValue()}
                    adjustedMarketValue={calculateAdjustedMarketValue()}
                    assessmentLevel={getAssessmentLevel()}
                    subclassRates={subclassRates}
                    landAdjustments={currentAdjustments}
                />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => showToastMessage('', 'success')}
                    message={toastMessage}
                    position="middle"
                    color={toastColor}
                    duration={3000}
                />

                <IonAlert
                    isOpen={showConfirmation}
                    onDidDismiss={handleConfirmationDismiss}
                    header={'Confirm Submission'}
                    message={'Are you sure you want to submit this non-agricultural land form? This action cannot be undone.'}
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            cssClass: 'secondary'
                        },
                        {
                            text: 'Submit',
                            role: 'confirm',
                            handler: () => submitForm(showToastMessage)
                        }
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default NonAgriLandTable;