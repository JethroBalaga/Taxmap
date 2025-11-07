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
    IonAlert
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import BuildingList from './BuildingList';
import BuildingAdjustmentsTable from './BuildingAdjustmentsTable';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";
import BuildingAdjustmentUpdateModal from "../../components/Modals/BuildingAdjustmentUpdateModal";
import BuildingSubcomponentModal from "../../components/Modals/BuildingSubcomponentModal";
import BuildingUpdateModal from "../../components/Modals/BuildingUpdateModal";
import { useBuildingTableLogic } from './BuildingTableLogic';
import "../../CSS/BuildingResponsive.css";
import SubmitButton from "../../components/GlobalComponent/SubmitButton";

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
    kind: string | number;
    classification: string;
    area: number;
    declarant: string;
    actual_use: string;
    district?: number | null;
    subclass?: string;
    formData?: any;
}

const BuildingTableContent: React.FC<BuildingTableProps> = ({
    form_id,
    onBack,
    kind,
    area,
    declarant,
    actual_use,
    district,
    classification,
    subclass,
    formData
}) => {
    const {
        buildingInfoIds,
        buildingDataList,
        buildingCodeRates,
        baseMarketValues,
        adjustedMarketValues,
        assessmentLevels,
        buildingAdjustments,
        totalAdjustments,
        loading,
        isSubmitting,
        isFormUploaded,
        showConfirmation,
        showAdjustmentModal,
        selectedValueInfoId,
        existingAdjustmentData,
        showUpdateAdjustmentModal,
        selectedAdjustmentForUpdate,
        showSubcomponentModal,
        selectedSubcomponentData,
        selectedAdjustmentArea,
        selectedAdjustmentCompletion,
        selectedAdjustmentDepreciation,
        selectedBaseMarketValue, // Get the selected base market value
        showUpdateModal,
        selectedBuildingId,
        selectedBuildingData,
        showToast,
        toastMessage,
        toastColor,
        loadBuildingData,
        loadBuildingAdjustments,
        handleViewDetails,
        handleCreateAdjustment,
        handleAdjustmentUpdate,
        handleSubcomponentRowClick,
        handleBuildingUpdate,
        handleUpdateClick,
        showToastMessage,
        handleSubmit,
        submitForm,
        handleConfirmationDismiss,
        setShowAdjustmentModal,
        setSelectedAdjustmentForUpdate,
        setShowUpdateAdjustmentModal,
        setShowSubcomponentModal,
        setShowUpdateModal,
        setSelectedBuildingId,
        setSelectedBuildingData,
        setShowToast
    } = useBuildingTableLogic(form_id, kind, classification, area, declarant, actual_use, district, subclass);

    console.log('BuildingTableContent rendering with:', {
        form_id,
        buildingInfoIds: buildingInfoIds.length,
        buildingAdjustments: buildingAdjustments.length,
        loading,
        formData: formData?.id
    });

    // Function to refresh all data
    const refreshAllData = React.useCallback(() => {
        console.log('Refreshing all building data...');
        loadBuildingData();
        loadBuildingAdjustments();
    }, [loadBuildingData, loadBuildingAdjustments]);

    // Handle modal close with refresh
    const handleAdjustmentModalClose = React.useCallback(() => {
        console.log('Closing adjustment modal and refreshing data...');
        setShowAdjustmentModal(false);
        // Small delay to ensure modal is fully closed before refresh
        setTimeout(() => {
            refreshAllData();
        }, 100);
    }, [setShowAdjustmentModal, refreshAllData]);

    // Handle modal save success with refresh
    const handleAdjustmentSaveSuccess = React.useCallback(() => {
        console.log('Adjustment saved successfully, refreshing data...');
        refreshAllData();
        setShowAdjustmentModal(false);
        showToastMessage('Building adjustment saved successfully!', 'success');
    }, [refreshAllData, setShowAdjustmentModal, showToastMessage]);

    // Handle update modal close with refresh
    const handleUpdateAdjustmentModalClose = React.useCallback(() => {
        console.log('Closing update adjustment modal and refreshing data...');
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        setTimeout(() => {
            refreshAllData();
        }, 100);
    }, [setShowUpdateAdjustmentModal, setSelectedAdjustmentForUpdate, refreshAllData]);

    // Handle update modal save success with refresh
    const handleUpdateAdjustmentSaveSuccess = React.useCallback(() => {
        console.log('Adjustment updated successfully, refreshing data...');
        refreshAllData();
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        showToastMessage('Building adjustment updated successfully!', 'success');
    }, [refreshAllData, setShowUpdateAdjustmentModal, setSelectedAdjustmentForUpdate, showToastMessage]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={onBack}>
                            <IonIcon icon={arrowBack} />
                            Back
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Building Assessment - Form {formData?.id || form_id}</IonTitle>
                    <IonButtons slot="end">
                        <SubmitButton
                            label={isFormUploaded ? "Form Already Submitted" : "Submit"}
                            onClick={handleSubmit}
                            disabled={isSubmitting || isFormUploaded || buildingAdjustments.length === 0}
                            loading={isSubmitting}
                            className="header-submit-button"
                        />
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonSpinner name="crescent" />
                        <p>Loading building data...</p>
                    </div>
                ) : (
                    <>
                        <BuildingList
                            form_id={form_id}
                            district={district}
                            declarant={declarant}
                            kind={kind}
                            classification={classification}
                            subclass={subclass}
                            actual_use={actual_use}
                            area={area}
                            loading={loading}
                            buildingInfoIds={buildingInfoIds}
                            buildingDataList={buildingDataList}
                            baseMarketValues={baseMarketValues}
                            adjustedMarketValues={adjustedMarketValues}
                            assessmentLevels={assessmentLevels}
                            buildingCodeRates={buildingCodeRates}
                            totalAdjustments={totalAdjustments}
                            onViewDetails={handleViewDetails}
                            onUpdateClick={handleUpdateClick}
                            formData={formData}
                        />

                        <BuildingAdjustmentsTable
                            buildingAdjustments={buildingAdjustments}
                            buildingInfoIds={buildingInfoIds}
                            baseMarketValues={baseMarketValues} // Pass base market values
                            onAdjustmentCreate={handleCreateAdjustment}
                            onAdjustmentUpdate={handleAdjustmentUpdate}
                            onAdjustmentsUpdate={refreshAllData}
                            showToastMessage={showToastMessage}
                            onSubcomponentClick={(rowData, baseMarketValue) => {
                                // Pass base market value to the modal
                                handleSubcomponentRowClick(rowData, baseMarketValue);
                            }}
                        />
                    </>
                )}

                {/* Building Adjustment Modal */}
                {showAdjustmentModal && selectedValueInfoId && (
                    <BuildingAdjustmentModal
                        isOpen={showAdjustmentModal}
                        onClose={handleAdjustmentModalClose}
                        valueInfoId={selectedValueInfoId}
                        existingData={existingAdjustmentData}
                        initialArea={area}
                        onSaveSuccess={handleAdjustmentSaveSuccess}
                    />
                )}

                {/* Building Adjustment Update Modal */}
                {showUpdateAdjustmentModal && selectedAdjustmentForUpdate && (
                    <BuildingAdjustmentUpdateModal
                        isOpen={showUpdateAdjustmentModal}
                        onClose={handleUpdateAdjustmentModalClose}
                        valueInfoId={selectedAdjustmentForUpdate.value_info_id}
                        existingData={selectedAdjustmentForUpdate}
                        onSaveSuccess={handleUpdateAdjustmentSaveSuccess}
                    />
                )}

                {/* Building Subcomponent Modal - UPDATED with baseMarketValue */}
                <BuildingSubcomponentModal
                    isOpen={showSubcomponentModal}
                    onClose={() => setShowSubcomponentModal(false)}
                    subcomponentData={selectedSubcomponentData}
                    area={selectedAdjustmentArea}
                    completionPercent={selectedAdjustmentCompletion}
                    depreciation={selectedAdjustmentDepreciation}
                    baseMarketValue={selectedBaseMarketValue} // Pass the base market value
                />

                {/* Building Update Modal */}
                {showUpdateModal && selectedBuildingId && selectedBuildingData && (
                    <BuildingUpdateModal
                        isOpen={showUpdateModal}
                        onDismiss={() => {
                            setShowUpdateModal(false);
                            setSelectedBuildingId('');
                            setSelectedBuildingData(null);
                            refreshAllData();
                        }}
                        onUpdate={handleBuildingUpdate}
                        buildingId={selectedBuildingId}
                        initialBuildingData={selectedBuildingData}
                    />
                )}

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    position="middle"
                    color={toastColor}
                    duration={3000}
                />

                <IonAlert
                    isOpen={showConfirmation}
                    onDidDismiss={handleConfirmationDismiss}
                    header={'Confirm Submission'}
                    message={'Are you sure you want to submit this building form? This action cannot be undone.'}
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

export default BuildingTableContent;