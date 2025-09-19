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
    IonSpinner
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import BuildingList from './BuildingList';
import BuildingAdjustmentsTable from './BuildingAdjustmentsTable';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";
import BuildingAdjustmentUpdateModal from "../../components/Modals/BuildingAdjustmentUpdateModal";
import BuildingSubcomponentModal from "../../components/Modals/BuildingSubcomponentModal";
import BuildingUpdateModal from "../../components/Modals/BuildingUpdateModal";
import {
    useBuildingTableLogic,
    AssessmentLevelInfo
} from './BuildingTableLogic';
import "../../CSS/BuildingResponsive.css";

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
    subclass
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
        handleSubmit
    } = useBuildingTableLogic(form_id, kind, classification, area, declarant, actual_use, district, subclass);

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
                    <IonTitle>Building Assessment</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={handleSubmit}
                            color="primary"
                            fill="solid"
                            disabled={isSubmitting}
                            style={{
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                padding: '0 16px',
                                height: '36px'
                            }}
                        >
                            {isSubmitting ? <IonSpinner name="crescent" /> : 'Submit'}
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
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
                />

                <BuildingAdjustmentsTable
                    buildingAdjustments={buildingAdjustments}
                    buildingInfoIds={buildingInfoIds}
                    onAdjustmentCreate={handleCreateAdjustment}
                    onAdjustmentUpdate={handleAdjustmentUpdate}
                    onAdjustmentsUpdate={() => {
                        loadBuildingAdjustments();
                        loadBuildingData();
                    }}
                    showToastMessage={showToastMessage}
                    onSubcomponentClick={handleSubcomponentRowClick}
                />

                {/* Building Adjustment Modal */}
                {showAdjustmentModal && selectedValueInfoId && (
                    <BuildingAdjustmentModal
                        isOpen={showAdjustmentModal}
                        onClose={() => {
                            setShowAdjustmentModal(false);
                            loadBuildingAdjustments();
                        }}
                        valueInfoId={selectedValueInfoId}
                        existingData={existingAdjustmentData}
                        initialArea={area}
                        onSaveSuccess={() => {
                            loadBuildingData();
                            loadBuildingAdjustments();
                        }}
                    />
                )}

                {/* Building Adjustment Update Modal */}
                {showUpdateAdjustmentModal && selectedAdjustmentForUpdate && (
                    <BuildingAdjustmentUpdateModal
                        isOpen={showUpdateAdjustmentModal}
                        onClose={() => {
                            setShowUpdateAdjustmentModal(false);
                            setSelectedAdjustmentForUpdate(null);
                            loadBuildingAdjustments();
                        }}
                        valueInfoId={selectedAdjustmentForUpdate.value_info_id}
                        existingData={selectedAdjustmentForUpdate}
                        onSaveSuccess={() => {
                            loadBuildingData();
                            loadBuildingAdjustments();
                            setShowUpdateAdjustmentModal(false);
                            setSelectedAdjustmentForUpdate(null);
                        }}
                    />
                )}

                {/* Building Subcomponent Modal */}
                <BuildingSubcomponentModal
                    isOpen={showSubcomponentModal}
                    onClose={() => setShowSubcomponentModal(false)}
                    subcomponentData={selectedSubcomponentData}
                    area={selectedAdjustmentArea}
                    completionPercent={selectedAdjustmentCompletion}
                    depreciation={selectedAdjustmentDepreciation}
                />

                {/* Building Update Modal */}
                {showUpdateModal && selectedBuildingId && selectedBuildingData && (
                    <BuildingUpdateModal
                        isOpen={showUpdateModal}
                        onDismiss={() => {
                            setShowUpdateModal(false);
                            setSelectedBuildingId('');
                            setSelectedBuildingData(null);
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
            </IonContent>
        </IonPage>
    );
};

export default BuildingTableContent;