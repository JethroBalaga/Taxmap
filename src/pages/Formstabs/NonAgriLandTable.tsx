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
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonAlert
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import { useNonAgriLand } from './hooks/useNonAgriLand';
import { NonAgriLandUI } from './components/NonAgriLandUI';
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
        selectedAdjustmentType,
        description,
        adjustmentFactor,
        selectedAdjustmentForUpdate,
        showDeleteAlert,
        adjustmentToDelete,
        selectedRow,
        landAdjustments,
        isLoadingAdjustments,
        currentAdjustments,
        visibleIcons,
        
        // Handlers
        handleBack,
        onSubmit,
        handleIconClick,
        handleUpdateIconClick,
        handleModalDismiss,
        handleUpdateModalDismiss,
        handleRowClick,
        handleDeleteConfirm,
        showToastMessage,
        setDescription,
        setAdjustmentFactor,
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
                    selectedAdjustmentType={selectedAdjustmentType}
                    description={description}
                    adjustmentFactor={adjustmentFactor}
                    selectedAdjustmentForUpdate={selectedAdjustmentForUpdate}
                    showDeleteAlert={showDeleteAlert}
                    adjustmentToDelete={adjustmentToDelete}
                    valueInfoId={valueInfoId}
                    showToast={showToast}
                    toastMessage={toastMessage}
                    toastColor={toastColor}
                    
                    // Handlers
                    onSubmit={onSubmit}
                    handleIconClick={handleIconClick}
                    handleUpdateIconClick={handleUpdateIconClick}
                    handleModalDismiss={handleModalDismiss}
                    handleUpdateModalDismiss={handleUpdateModalDismiss}
                    handleRowClick={handleRowClick}
                    handleDeleteConfirm={handleDeleteConfirm}
                    setDescription={setDescription}
                    setAdjustmentFactor={setAdjustmentFactor}
                    setShowDeleteAlert={setShowDeleteAlert}
                    setAdjustmentToDelete={setAdjustmentToDelete}
                    showToastMessage={showToastMessage}
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