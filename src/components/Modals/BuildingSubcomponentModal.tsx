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
    // Add the new prop here
    completionPercent: string;
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData,
    area,
    completionPercent
}) => {
    // Parse completion_percent from string to number using the new prop
    const completionPercentValue = parseFloat(completionPercent) || 0;

    // Calculate market value: area x rate
    const marketValue = subcomponentData && typeof subcomponentData.rate === 'number'
        ? area * subcomponentData.rate
        : 0;
    
    // Calculate adjusted market value: market value x completion percent
    const adjustedMarketValue = marketValue * (completionPercentValue / 100);

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

    const formattedAdjustedMarketValue = `₱${adjustedMarketValue.toLocaleString(undefined, {
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
                                    <IonCol size="4"><strong>Completion %:</strong></IonCol>
                                    <IonCol>{completionPercentDisplay}</IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Adjusted Market Value:</strong></IonCol>
                                    <IonCol>
                                        {formattedAdjustedMarketValue}
                                        <IonText color="medium">
                                            <small> (Market Value × Completion %)</small>
                                        </IonText>
                                    </IonCol>
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