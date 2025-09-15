// src/components/Modals/BuildingSubcomponentModal.tsx
import React from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';

interface BuildingSubcomponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    subcomponentData: BuildingSubcomponentData | null;
    area: number;
    completionPercent: string;
    depreciation: string;
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData,
    area,
    completionPercent,
    depreciation
}) => {
    // Convert string values to numbers, using a robust check for validity
    const completionPercentValue = parseFloat(completionPercent);
    const validCompletionPercent = !isNaN(completionPercentValue) ? completionPercentValue : 0;

    // Check if depreciation is provided and valid
    const hasDepreciation = depreciation && depreciation.trim() !== '';
    const depreciationAsNumber = parseFloat(depreciation);
    const validDepreciation = !isNaN(depreciationAsNumber) ? depreciationAsNumber : 0;

    // Calculate market value: area x rate
    const marketValue = subcomponentData && typeof subcomponentData.rate === 'number'
        ? area * subcomponentData.rate
        : 0;

    // Calculate value after applying completion percent
    const valueAfterCompletion = marketValue * (validCompletionPercent / 100);
    
    // Calculate the depreciation amount based on the value after completion
    // Only apply depreciation if it's provided and valid
    const depreciationAmount = hasDepreciation ? valueAfterCompletion * (validDepreciation / 100) : 0;

    // Calculate final adjusted market value
    const finalAdjustedMarketValue = hasDepreciation 
        ? valueAfterCompletion - depreciationAmount 
        : valueAfterCompletion;

    const formattedRate = subcomponentData && typeof subcomponentData.rate === 'number'
        ? `₱${subcomponentData.rate.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
        : 'N/A';

    const formattedMarketValue = `₱${marketValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedValueAfterCompletion = `₱${valueAfterCompletion.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    // Format depreciation display
    const formattedDepreciation = hasDepreciation ? `${validDepreciation}%` : 'N/A';
    const formattedDepreciationAmount = hasDepreciation 
        ? `₱${depreciationAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
        : 'N/A';

    const formattedFinalAdjustedMarketValue = `₱${finalAdjustedMarketValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const completionPercentDisplay = completionPercent ? `${completionPercent}%` : 'N/A';

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Building Subcomponent Details</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                {subcomponentData ? (
                    <IonCard>
                        <IonCardContent>
                            <IonGrid>
                                <IonRow>
                                    <IonCol size="4"><strong>ID:</strong></IonCol>
                                    <IonCol>{subcomponentData.building_subcom_id}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Description:</strong></IonCol>
                                    <IonCol>{subcomponentData.description}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Rate:</strong></IonCol>
                                    <IonCol>{formattedRate}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Area:</strong></IonCol>
                                    <IonCol>{area.toLocaleString()} m²</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Market Value:</strong></IonCol>
                                    <IonCol>{formattedMarketValue}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Completion %:</strong></IonCol>
                                    <IonCol>{completionPercentDisplay}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Value after Completion:</strong></IonCol>
                                    <IonCol>
                                        {formattedValueAfterCompletion}
                                        <IonText color="medium">
                                            <small> (Market Value × Completion %)</small>
                                        </IonText>
                                    </IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Depreciation (%):</strong></IonCol>
                                    <IonCol>{formattedDepreciation}</IonCol>
                                </IonRow>
                                {hasDepreciation && (
                                    <IonRow>
                                        <IonCol size="4"><strong>Depreciation Amount:</strong></IonCol>
                                        <IonCol>{formattedDepreciationAmount}</IonCol>
                                    </IonRow>
                                )}
                                <IonRow>
                                    <IonCol size="4"><strong>Adjusted Market Value:</strong></IonCol>
                                    <IonCol>
                                        {formattedFinalAdjustedMarketValue}
                                        <IonText color="medium">
                                            <small> 
                                                {hasDepreciation 
                                                    ? " (Value after Completion - Depreciation Amount)"
                                                    : " (Value after Completion - no depreciation applied)"
                                                }
                                            </small>
                                        </IonText>
                                    </IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Component ID:</strong></IonCol>
                                    <IonCol>{subcomponentData.building_com_id}</IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonCardContent>
                    </IonCard>
                ) : (
                    <div className="no-data">
                        <IonText>No subcomponent data available.</IonText>
                    </div>
                )}
            </IonContent>
        </IonModal>
    );
};

export default BuildingSubcomponentModal;