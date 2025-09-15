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
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData
}) => {
    const formattedRate = subcomponentData && typeof subcomponentData.rate === 'number'
        ? `₱${subcomponentData.rate.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
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