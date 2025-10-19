// src/pages/NonAgriLandTable.tsx
import React from "react";
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
    IonText
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { useNonAgriLand } from './useNonAgriLand';
import { NonAgriLandUI } from './NonAgriLandUI';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import "../../CSS/Forms.css";

const NonAgriLandTable: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();

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
        hasCornerInfluence,
        hasStripping,
        getStrippingInfo,
        getStrippingAdjustment,
        showReverseDeleteWarning,
        setShowReverseDeleteWarning,
        reverseDeleteWarningMessage,
        canSubmit,
        
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
                    
                    {/* Submit Button on the right side */}
                    <IonButtons slot="end">
                        <div style={{ position: 'relative' }}>
                            <SubmitButton
                                label="Submit Form"
                                onClick={onSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting || !canSubmit}
                                className="header-submit-button"
                            />
                            {!canSubmit && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#333',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    zIndex: 1000,
                                    marginTop: '4px'
                                }}>
                                    Complete all stripping adjustments first
                                </div>
                            )}
                        </div>
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

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => showToastMessage('', 'success')}
                    message={toastMessage}
                    position="middle"
                    color={toastColor}
                    duration={3000}
                />
            </IonContent>
        </IonPage>
    );
};

export default NonAgriLandTable;