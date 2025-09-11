import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonText,
    IonSearchbar,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent
} from "@ionic/react";
import { arrowBack, informationCircle } from "ionicons/icons";
import { ValueInfoLocalStorage, ValueInfo } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage, BuildingData } from '../../utils/tablestorages/BuildingDataLocalStorage';
import '../../CSS/BuildingTable.css';

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
    kind: string | number;
    classification: string;
    area: number; // Changed to number
}

const BuildingTable: React.FC<BuildingTableProps> = ({ form_id, onBack, kind, classification, area }) => {
    const [buildingInfoIds, setBuildingInfoIds] = useState<string[]>([]);
    const [buildingDataList, setBuildingDataList] = useState<Map<string, BuildingData>>(new Map());
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBuildingData();
    }, [form_id]);

    const loadBuildingData = () => {
        setLoading(true);
        try {
            // Get all ValueInfo and filter by formDataId
            const allInfos = ValueInfoLocalStorage.getAllValueInfo();
            const infos = allInfos.filter(info => info.formDataId === form_id);
            
            const ids = infos.map(info => info.id);
            setBuildingInfoIds(ids);
            
            const buildingDataMap = new Map<string, BuildingData>();
            ids.forEach(id => {
                const data = BuildingDataLocalStorage.getBuildingData(id);
                if (data) {
                    buildingDataMap.set(id, data);
                }
            });
            setBuildingDataList(buildingDataMap);
        } catch (error) {
            console.error('Error loading building data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: CustomEvent) => {
        setSearchTerm(e.detail.value || '');
    };

    const handleViewDetails = (buildingId: string) => {
        setSelectedBuildingId(buildingId === selectedBuildingId ? null : buildingId);
    };

    const filteredBuildingIds = buildingInfoIds.filter(id => {
        if (!searchTerm) return true;
        
        const buildingData = buildingDataList.get(id);
        if (!buildingData) return false;
        
        // Search through all building data properties
        return Object.values(buildingData).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const selectedBuildingData = selectedBuildingId ? buildingDataList.get(selectedBuildingId) : null;

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
                    <IonTitle>Building Information - Form ID: {form_id}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
                {/* Form Information Summary */}
                <IonCard className="form-summary-card">
                    <IonCardContent>
                        <IonGrid>
                            <IonRow>
                                <IonCol size="4">
                                    <strong>Kind:</strong> {kind}
                                </IonCol>
                                <IonCol size="4">
                                    <strong>Classification:</strong> {classification}
                                </IonCol>
                                <IonCol size="4">
                                    <strong>Area:</strong> {area ? `${area.toLocaleString()} sq ft` : 'N/A'}
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonCardContent>
                </IonCard>

                {/* Search Bar */}
                <div className="search-container">
                    <IonSearchbar
                        placeholder="Search building information..."
                        value={searchTerm}
                        onIonInput={handleSearch}
                        className="forms-searchbar"
                    />
                </div>

                {loading ? (
                    <IonText>Loading building information...</IonText>
                ) : buildingInfoIds.length > 0 ? (
                    <>
                        {/* Building List */}
                        <IonGrid>
                            <IonRow className="table-header">
                                <IonCol size="2">Building ID</IonCol>
                                <IonCol size="2">Kind</IonCol>
                                <IonCol size="2">Classification</IonCol>
                                <IonCol size="2">Area (sq ft)</IonCol> {/* Updated header */}
                                <IonCol size="2">Building Code</IonCol>
                                <IonCol size="2">Actions</IonCol>
                            </IonRow>
                            
                            {filteredBuildingIds.map((id) => {
                                const buildingData = buildingDataList.get(id);
                                const isSelected = id === selectedBuildingId;
                                
                                return (
                                    <React.Fragment key={id}>
                                        <IonRow 
                                            className={`table-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleViewDetails(id)}
                                        >
                                            <IonCol size="2">{id}</IonCol>
                                            <IonCol size="2">{kind || 'N/A'}</IonCol>
                                            <IonCol size="2">{classification || 'N/A'}</IonCol>
                                            <IonCol size="2">{area ? area.toLocaleString() : 'N/A'}</IonCol> {/* Updated display */}
                                            <IonCol size="2">{buildingData?.buildingCode || 'N/A'}</IonCol>
                                            <IonCol size="2">
                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(id);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <IonIcon 
                                                        icon={informationCircle} 
                                                        className={isSelected ? "icon-blue" : "icon-blue icon-disabled"} 
                                                    />
                                                </IonButton>
                                            </IonCol>
                                        </IonRow>
                                        
                                        {/* Details Card */}
                                        {isSelected && buildingData && (
                                            <IonRow>
                                                <IonCol size="12">
                                                    <IonCard className="details-card">
                                                        <IonCardContent>
                                                            <div className="building-details-grid">
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Kind:</span>
                                                                    <span className="detail-value">{kind || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Classification:</span>
                                                                    <span className="detail-value">{classification || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Area:</span>
                                                                    <span className="detail-value">{area ? `${area.toLocaleString()} sq ft` : 'N/A'}</span> {/* Updated display */}
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Structure Type:</span>
                                                                    <span className="detail-value">{buildingData.structureType || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Code:</span>
                                                                    <span className="detail-value">{buildingData.buildingCode || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Storey:</span>
                                                                    <span className="detail-value">{buildingData.storey || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Floor Order:</span>
                                                                    <span className="detail-value">{buildingData.floorOrder || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Age:</span>
                                                                    <span className="detail-value">{buildingData.buildingAge || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Permit:</span>
                                                                    <span className="detail-value">{buildingData.buildingPermit || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Construction %:</span>
                                                                    <span className="detail-value">{buildingData.constructionPercent !== null ? `${buildingData.constructionPercent}%` : 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Depreciation Rate:</span>
                                                                    <span className="detail-value">{buildingData.depreciationRate !== null ? `${buildingData.depreciationRate}%` : 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Constructed:</span>
                                                                    <span className="detail-value">{buildingData.dateConstructed || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Occupied:</span>
                                                                    <span className="detail-value">{buildingData.dateOccupied || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Completed:</span>
                                                                    <span className="detail-value">{buildingData.dateCompleted || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </IonCardContent>
                                                    </IonCard>
                                                </IonCol>
                                            </IonRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </IonGrid>

                        {/* Show message if no results */}
                        {filteredBuildingIds.length === 0 && (
                            <div className="no-results">
                                <IonText>No building information found matching your search.</IonText>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-data">
                        <IonText>No building information available for this form.</IonText>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;