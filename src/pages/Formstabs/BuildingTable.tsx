import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonList,
    IonText,
    IonButton,
    IonButtons,
    IonIcon
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { ValueInfoLocalStorage, ValueInfo } from '../../utils/tablestorages/ValueInfoLocalStorage';

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ form_id, onBack }) => {
    const [buildingInfoId, setBuildingInfoId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBuildingInfoId();
    }, [form_id]);

    const loadBuildingInfoId = () => {
        setLoading(true);
        try {
            const info = ValueInfoLocalStorage.getValueInfoByFormDataId(form_id);
            setBuildingInfoId(info ? info.id : null);
        } catch (error) {
            console.error('Error loading building info:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={onBack}>
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Form ID: {form_id}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {loading ? (
                    <IonText>Loading building information...</IonText>
                ) : buildingInfoId ? (
                    <IonLabel>
                        Building Info ID: {buildingInfoId}
                    </IonLabel>
                ) : null}
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;