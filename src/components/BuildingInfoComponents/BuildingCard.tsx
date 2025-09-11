import React from "react";
import {
    IonCard,
    IonCardContent,
    IonLabel,
} from "@ionic/react";
import { BuildingData } from '../../utils/tablestorages/BuildingDataLocalStorage';
import '../../CSS/BuildingTable.css';

interface BuildingCardProps {
    buildingInfoId: string | null;
    buildingData: BuildingData | null;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ buildingInfoId, buildingData }) => {
    if (!buildingData) return null;

    return (
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
    );
};

export default BuildingCard;