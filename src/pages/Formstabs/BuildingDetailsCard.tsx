// src/components/Building/BuildingDetailsCard.tsx
import React from "react";
import { IonCard, IonCardContent, IonButton, IonIcon } from "@ionic/react";
import { create } from "ionicons/icons";
import "../../CSS/BuildingResponsive.css";

interface BuildingDetailsCardProps {
    buildingData: any;
    buildingRate?: number;
}

const BuildingDetailsCard: React.FC<BuildingDetailsCardProps> = ({
    buildingData,
    buildingRate
}) => {
    // You can define an empty function for the button's onClick handler for now
    const handleUpdate = () => {
        console.log('Update button clicked (no functionality yet)');
    };

    const buildingDetailItems = [
        { label: "Structure Type", value: buildingData.structureType || 'N/A' },
        { label: "Building Code", value: buildingData.buildingCode || 'N/A' },
        ...(buildingRate !== undefined && buildingRate !== null ?
            [{ label: "Building Code Rate", value: `₱${buildingRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] :
            []
        ),
        { label: "Storey", value: buildingData.storey || 'N/A' },
        { label: "Floor Order", value: buildingData.floorOrder || 'N/A' },
        { label: "Building Age", value: buildingData.buildingAge || 'N/A' },
        { label: "Building Permit", value: buildingData.buildingPermit || 'N/A' },
        { label: "Construction %", value: buildingData.constructionPercent !== null ? `${buildingData.constructionPercent}%` : 'N/A' },
        { label: "Depreciation Rate", value: buildingData.depreciationRate !== null ? `${buildingData.depreciationRate}%` : 'N/A' },
        { label: "Date Constructed", value: buildingData.dateConstructed || 'N/A' },
        { label: "Date Occupied", value: buildingData.dateOccupied || 'N/A' },
        { label: "Date Completed", value: buildingData.dateCompleted || 'N/A' }
    ];

    return (
        <IonCard className="details-card">
            <IonCardContent>
                <div className="building-details-grid">
                    {buildingDetailItems.map((item, index) => (
                        <div key={index} className="detail-item">
                            <span className="detail-label">{item.label}:</span>
                            <span className="detail-value">{item.value}</span>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                    <IonButton 
                        onClick={handleUpdate} 
                        color="primary"
                        fill="solid"
                    >
                        <IonIcon icon={create} slot="start" />
                        Update
                    </IonButton>
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default BuildingDetailsCard;