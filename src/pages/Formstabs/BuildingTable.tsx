import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonText
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { ValueInfoLocalStorage, ValueInfo } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage, BuildingData } from '../../utils/tablestorages/BuildingDataLocalStorage';
import '../../CSS/BuildingTable.css';

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ form_id, onBack }) => {
    const [buildingInfoId, setBuildingInfoId] = useState<string | null>(null);
    const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBuildingData();
    }, [form_id]);

    const loadBuildingData = () => {
        setLoading(true);
        try {
            const info = ValueInfoLocalStorage.getValueInfoByFormDataId(form_id);
            setBuildingInfoId(info ? info.id : null);
            
            if (info?.id) {
                const data = BuildingDataLocalStorage.getBuildingData(info.id);
                setBuildingData(data);
            }
        } catch (error) {
            console.error('Error loading building data:', error);
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

            <IonContent className="building-content">
                {loading ? (
                    <IonText>Loading building information...</IonText>
                ) : buildingData ? (
                    <div className="building-card-container">
                        <IonCard className="building-data-card">
                            <IonCardContent>
                                <div className="building-data-section">
                                    <IonLabel className="building-info-id">
                                        Building Info ID: {buildingInfoId}
                                    </IonLabel>
                                    
                                    <div className="building-details">
                                        <div className="building-detail-row">
                                            <span className="detail-label">Structure Type:</span>
                                            <span className="detail-value">{buildingData.structureType || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Building Code:</span>
                                            <span className="detail-value">{buildingData.buildingCode || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Storey:</span>
                                            <span className="detail-value">{buildingData.storey || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Floor Order:</span>
                                            <span className="detail-value">{buildingData.floorOrder || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Building Age:</span>
                                            <span className="detail-value">{buildingData.buildingAge || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Building Permit:</span>
                                            <span className="detail-value">{buildingData.buildingPermit || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Construction %:</span>
                                            <span className="detail-value">{buildingData.constructionPercent !== null ? `${buildingData.constructionPercent}%` : 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Depreciation Rate:</span>
                                            <span className="detail-value">{buildingData.depreciationRate !== null ? `${buildingData.depreciationRate}%` : 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Date Constructed:</span>
                                            <span className="detail-value">{buildingData.dateConstructed || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Date Occupied:</span>
                                            <span className="detail-value">{buildingData.dateOccupied || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="building-detail-row">
                                            <span className="detail-label">Date Completed:</span>
                                            <span className="detail-value">{buildingData.dateCompleted || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </div>
                ) : null}
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;