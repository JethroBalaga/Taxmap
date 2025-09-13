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
  IonCardContent,
  IonSpinner,
  IonBadge
} from "@ionic/react";
import { 
  arrowBack, 
  informationCircle, 
  createOutline, 
  arrowUpCircleOutline, 
  trashOutline 
} from "ionicons/icons";
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";

// Mock data storage functions (replace with your actual implementations)
const ValueInfoLocalStorage = {
  getAllValueInfo: () => [
    { id: "bldg_001", formDataId: "form_123" },
    { id: "bldg_002", formDataId: "form_123" },
    { id: "bldg_003", formDataId: "form_123" }
  ]
};

const BuildingDataLocalStorage = {
  getBuildingData: (id: string) => {
    const data: Record<string, any> = {
      "bldg_001": {
        structureType: "Commercial",
        buildingCode: "COM-001",
        storey: "5",
        floorOrder: "3",
        buildingAge: "10",
        buildingPermit: "BP-2023-001",
        constructionPercent: "85",
        depreciationRate: "15",
        dateConstructed: "2013-05-15",
        dateOccupied: "2014-02-20",
        dateCompleted: "2014-01-10"
      },
      "bldg_002": {
        structureType: "Residential",
        buildingCode: "RES-002",
        storey: "2",
        floorOrder: "1",
        buildingAge: "5",
        buildingPermit: "BP-2018-045",
        constructionPercent: "95",
        depreciationRate: "5",
        dateConstructed: "2018-08-10",
        dateOccupied: "2019-01-15",
        dateCompleted: "2018-12-20"
      },
      "bldg_003": {
        structureType: "Industrial",
        buildingCode: "IND-003",
        storey: "1",
        floorOrder: "1",
        buildingAge: "15",
        buildingPermit: "BP-2008-123",
        constructionPercent: "75",
        depreciationRate: "25",
        dateConstructed: "2008-11-30",
        dateOccupied: "2009-06-15",
        dateCompleted: "2009-04-10"
      }
    };
    return data[id] || null;
  }
};

const getBuildingCodeByCode = async (code: string) => {
  const rates: Record<string, number> = {
    "COM-001": 25000,
    "RES-002": 18000,
    "IND-003": 32000
  };
  return { rate: rates[code] || 15000 };
};

const getAssessmentLevelData = async () => [
  { kind_id: 2, class_id: "1", rate_percent: "10%", range1: 0, range2: 5000000 },
  { kind_id: 2, class_id: "2", rate_percent: "15%", range1: 5000001, range2: 10000000 },
  { kind_id: 2, class_id: "3", rate_percent: "20%", range1: 10000001, range2: 20000000 }
];

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

interface AssessmentLevelInfo {
  rate_percent: string;
  range1: number;
  range2: number;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ 
  form_id, 
  onBack, 
  kind, 
  classification, 
  area, 
  declarant, 
  actual_use,
  district,
  subclass 
}) => {
  const [buildingInfoIds, setBuildingInfoIds] = useState<string[]>([]);
  const [buildingDataList, setBuildingDataList] = useState<Map<string, any>>(new Map());
  const [buildingCodeRates, setBuildingCodeRates] = useState<Map<string, number>>(new Map());
  const [baseMarketValues, setBaseMarketValues] = useState<Map<string, number>>(new Map());
  const [adjustedMarketValues, setAdjustedMarketValues] = useState<Map<string, number>>(new Map());
  const [assessmentLevels, setAssessmentLevels] = useState<Map<string, AssessmentLevelInfo>>(new Map());
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [kindId, setKindId] = useState<number>(2);
  
  // Modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    console.log('BuildingTable props:', { form_id, kind, classification, area, declarant, actual_use, district, subclass });
    setKindId(2);
    loadBuildingData();
  }, [form_id, kind, classification, area, declarant, actual_use, district, subclass]);

  const calculateMarketValues = (buildingCodeRate: number, depreciationRate: number | null, area: number): { base: number, adjusted: number } => {
    const baseMarketValue = buildingCodeRate * area;
    let adjustedMarketValue = baseMarketValue;
    
    if (depreciationRate !== null && depreciationRate !== undefined) {
      const depreciationDecimal = depreciationRate / 100;
      adjustedMarketValue = baseMarketValue * (1 - depreciationDecimal);
    }
    
    return { base: baseMarketValue, adjusted: adjustedMarketValue };
  };

  const getAssessmentLevelForBuilding = async (adjustedValue: number): Promise<AssessmentLevelInfo | null> => {
    try {
      const numericValue = Math.floor(adjustedValue);
      
      const allAssessmentLevels = await getAssessmentLevelData();
      
      if (allAssessmentLevels && allAssessmentLevels.length > 0) {
        const matchingLevel = allAssessmentLevels.find(level => {
          const matchesKind = level.kind_id === kindId;
          const matchesClass = level.class_id.toString() === classification.toString();
          const inRange = numericValue >= level.range1 && numericValue <= level.range2;
          return matchesKind && matchesClass && inRange;
        });
        
        if (matchingLevel) {
          return {
            rate_percent: matchingLevel.rate_percent,
            range1: matchingLevel.range1,
            range2: matchingLevel.range2
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting assessment level:', error);
      return null;
    }
  };

  const loadBuildingData = async () => {
    setLoading(true);
    try {
      const allInfos = ValueInfoLocalStorage.getAllValueInfo();
      const infos = allInfos.filter((info: any) => info.formDataId === form_id);
      const ids = infos.map((info: any) => info.id);
      setBuildingInfoIds(ids);
      
      const buildingDataMap = new Map<string, any>();
      const ratesMap = new Map<string, number>();
      const baseMarketValuesMap = new Map<string, number>();
      const adjustedMarketValuesMap = new Map<string, number>();
      const assessmentLevelsMap = new Map<string, AssessmentLevelInfo>();
      
      for (const id of ids) {
        const data = BuildingDataLocalStorage.getBuildingData(id);
        if (data) {
          buildingDataMap.set(id, data);
          
          if (data.buildingCode) {
            const buildingCodeData = await getBuildingCodeByCode(data.buildingCode);
            if (buildingCodeData) {
              ratesMap.set(id, buildingCodeData.rate);
              const marketValues = calculateMarketValues(
                buildingCodeData.rate, 
                data.depreciationRate, 
                area
              );
              baseMarketValuesMap.set(id, marketValues.base);
              adjustedMarketValuesMap.set(id, marketValues.adjusted);
              const assessmentLevel = await getAssessmentLevelForBuilding(marketValues.adjusted);
              if (assessmentLevel) {
                assessmentLevelsMap.set(id, assessmentLevel);
              }
            }
          }
        }
      }
      
      setBuildingDataList(buildingDataMap);
      setBuildingCodeRates(ratesMap);
      setBaseMarketValues(baseMarketValuesMap);
      setAdjustedMarketValues(adjustedMarketValuesMap);
      setAssessmentLevels(assessmentLevelsMap);
    } catch (error) {
      console.error('Error loading building data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: any) => {
    setSearchTerm(e.detail.value || '');
  };

  const handleViewDetails = (buildingId: string) => {
    setSelectedBuildingId(buildingId === selectedBuildingId ? null : buildingId);
  };

  const handleCreateAdjustment = (buildingId: string) => {
    setCurrentBuildingId(buildingId);
    setModalAction('create');
    setShowAdjustmentModal(true);
  };

  const handleEditAdjustment = (buildingId: string) => {
    setCurrentBuildingId(buildingId);
    setModalAction('edit');
    setShowAdjustmentModal(true);
  };

  const handleSaveSuccess = () => {
    // Refresh data after successful save
    loadBuildingData();
  };

  const filteredBuildingIds = buildingInfoIds.filter(id => {
    if (!searchTerm) return true;
    const buildingData = buildingDataList.get(id);
    if (!buildingData) return false;
    return Object.values(buildingData).some((value: any) => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedBuildingData = selectedBuildingId ? buildingDataList.get(selectedBuildingId) : null;
  const selectedBuildingRate = selectedBuildingId ? buildingCodeRates.get(selectedBuildingId) : null;
  const selectedBaseMarketValue = selectedBuildingId ? baseMarketValues.get(selectedBuildingId) : null;
  const selectedAdjustedMarketValue = selectedBuildingId ? adjustedMarketValues.get(selectedBuildingId) : null;
  const selectedAssessmentLevel = selectedBuildingId ? assessmentLevels.get(selectedBuildingId) : null;

  const buildingDetailItems = selectedBuildingData ? [
    { label: "Structure Type", value: selectedBuildingData.structureType || 'N/A' },
    { label: "Building Code", value: selectedBuildingData.buildingCode || 'N/A' },
    ...(selectedBuildingRate !== undefined && selectedBuildingRate !== null ? 
      [{ label: "Building Code Rate", value: `₱${selectedBuildingRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
    { label: "Storey", value: selectedBuildingData.storey || 'N/A' },
    { label: "Floor Order", value: selectedBuildingData.floorOrder || 'N/A' },
    { label: "Building Age", value: selectedBuildingData.buildingAge || 'N/A' },
    { label: "Building Permit", value: selectedBuildingData.buildingPermit || 'N/A' },
    { label: "Construction %", value: selectedBuildingData.constructionPercent !== null ? `${selectedBuildingData.constructionPercent}%` : 'N/A' },
    { label: "Depreciation Rate", value: selectedBuildingData.depreciationRate !== null ? `${selectedBuildingData.depreciationRate}%` : 'N/A' },
    { label: "Date Constructed", value: selectedBuildingData.dateConstructed || 'N/A' },
    { label: "Date Occupied", value: selectedBuildingData.dateOccupied || 'N/A' },
    { label: "Date Completed", value: selectedBuildingData.dateCompleted || 'N/A' }
  ] : [];

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
        {/* Form Summary Section */}
        <IonCard className="form-summary-card">
          <IonCardContent>
            <IonGrid style={{ margin: '0', padding: '0' }}>
              <IonRow style={{ marginBottom: '4px' }}>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Form ID:</strong> {form_id}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>District:</strong> {district || 'N/A'}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Declarant ID:</strong> {declarant || 'N/A'}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Kind:</strong> {kind || 'N/A'}</IonText></IonCol>
              </IonRow>
              <IonRow style={{ marginBottom: '4px' }}>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Classification:</strong> {classification || 'N/A'}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Subclass:</strong> {subclass || 'N/A'}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Actual Use:</strong> {actual_use || 'N/A'}</IonText></IonCol>
                <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Area:</strong> {area ? `${area.toLocaleString()} sq ft` : 'N/A'}</IonText></IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading building information...</IonText>
          </div>
        ) : buildingInfoIds.length > 0 ? (
          <>
            {/* Building Table */}
            <IonGrid>
              <IonRow className="table-header">
                <IonCol size="2">Building ID</IonCol>
                <IonCol size="2">Structure Type</IonCol>
                <IonCol size="2">Base Market Value</IonCol>
                <IonCol size="2">Adjusted Market Value</IonCol>
                <IonCol size="2">Assessment Level</IonCol>
                <IonCol size="2">Actions</IonCol>
              </IonRow>
              
              {filteredBuildingIds.map((id) => {
                const buildingData = buildingDataList.get(id);
                const baseMarketValue = baseMarketValues.get(id);
                const adjustedMarketValue = adjustedMarketValues.get(id);
                const assessmentLevel = assessmentLevels.get(id);
                const isSelected = id === selectedBuildingId;
                
                return (
                  <React.Fragment key={id}>
                    <IonRow className={`table-row ${isSelected ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
                      <IonCol size="2" onClick={() => handleViewDetails(id)}>{id}</IonCol>
                      <IonCol size="2" onClick={() => handleViewDetails(id)}>{buildingData?.structureType || 'N/A'}</IonCol>
                      <IonCol size="2" onClick={() => handleViewDetails(id)}>
                        {baseMarketValue !== undefined ? `₱${baseMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                      </IonCol>
                      <IonCol size="2" onClick={() => handleViewDetails(id)}>
                        {adjustedMarketValue !== undefined ? `₱${adjustedMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                      </IonCol>
                      <IonCol size="2" onClick={() => handleViewDetails(id)}>
                        {assessmentLevel ? `${assessmentLevel.rate_percent}` : 'N/A'}
                      </IonCol>
                      <IonCol size="2">
                        <IonButton 
                          size="small" 
                          fill="clear"
                          onClick={() => handleCreateAdjustment(id)}
                          title="Add Adjustment"
                        >
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        <IonButton 
                          size="small" 
                          fill="clear"
                          onClick={() => handleEditAdjustment(id)}
                          title="Edit Adjustment"
                        >
                          <IonIcon icon={arrowUpCircleOutline} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                    
                    {/* Expanded Details */}
                    {isSelected && buildingData && (
                      <IonRow>
                        <IonCol size="12">
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
                            </IonCardContent>
                          </IonCard>
                        </IonCol>
                      </IonRow>
                    )}
                  </React.Fragment>
                );
              })}
            </IonGrid>

            {/* Search and Actions Section */}
            <div className="search-container" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', marginTop: '16px' }}>
              <IonSearchbar 
                placeholder="Search buildings..." 
                value={searchTerm} 
                onIonInput={handleSearch} 
                className="forms-searchbar" 
              />
              
              <IonBadge color="primary">
                {filteredBuildingIds.length} building(s) found
              </IonBadge>
            </div>

            {/* No Search Results */}
            {filteredBuildingIds.length === 0 && searchTerm && (
              <div className="no-results">
                <IonText>No building information found matching your search.</IonText>
              </div>
            )}
          </>
        ) : (
          /* No Data State */
          <div className="no-data">
            <IonText>No building information available for this form.</IonText>
          </div>
        )}
      </IonContent>

      {/* Building Adjustment Modal */}
      <BuildingAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        valueInfoId={currentBuildingId || ''}
        onSaveSuccess={handleSaveSuccess}
        modalAction={modalAction}
      />
    </IonPage>
  );
};

export default BuildingTable;