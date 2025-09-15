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
    area?: number; // Add area as optional prop
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData,
    area = 1 // Default to 1 if not provided
}) => {
    // Calculate market value: area x rate
    const marketValue = subcomponentData && typeof subcomponentData.rate === 'number'
        ? area * subcomponentData.rate
        : 0;
    
    // Calculate adjusted market value: market value x completion percent
    const adjustedMarketValue = subcomponentData && 
                               typeof subcomponentData.completion_percent === 'number'
        ? marketValue * (subcomponentData.completion_percent / 100)
        : 0;

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

    const completionPercent = subcomponentData && 
                             typeof subcomponentData.completion_percent === 'number'
        ? `${subcomponentData.completion_percent}%`
        : 'N/A';

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
                                    <IonCol>
                                        {formattedMarketValue}
                                        <IonText color="medium">
                                            <small> (Area × Rate)</small>
                                        </IonText>
                                    </IonCol>
                                </IonRow>
                                <IonRow>
                                    <IonCol size="4"><strong>Completion %:</strong></IonCol>
                                    <IonCol>{completionPercent}</IonCol>
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