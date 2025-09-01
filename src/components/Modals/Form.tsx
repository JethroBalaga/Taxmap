// src/components/Modals/Form.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonList
} from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import Classification from '../FormComponents/Classification';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';
import { DeclarantData, getDeclarantData } from '../../utils/DeclarantLocalStorage';
import { KindData, getKindData } from '../../utils/kindLocalStorage'; // Import KindData and getKindData

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss, onSuccess }) => {
  const [district, setDistrict] = useState<number | null>(null);
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [declarants, setDeclarants] = useState<DeclarantData[]>([]);
  const [kinds, setKinds] = useState<KindData[]>([]); // Add state for kinds
  const [filteredDeclarants, setFilteredDeclarants] = useState<DeclarantData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showDeclarantSearch, setShowDeclarantSearch] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingDeclarants, setIsLoadingDeclarants] = useState(true);
  const [isLoadingKinds, setIsLoadingKinds] = useState(true); // Add loading state for kinds

  // Load districts, declarants, and kinds from local storage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingDistricts(true);
        setIsLoadingDeclarants(true);
        setIsLoadingKinds(true);
        
        const [districtData, declarantData, kindData] = await Promise.all([
          getDistrictData(),
          getDeclarantData(),
          getKindData() // Fetch kind data
        ]);
        
        if (districtData) {
          setDistricts(districtData);
        }
        
        if (declarantData) {
          setDeclarants(declarantData);
          setFilteredDeclarants(declarantData);
        }

        if (kindData) {
          setKinds(kindData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingDistricts(false);
        setIsLoadingDeclarants(false);
        setIsLoadingKinds(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Filter declarants based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredDeclarants(declarants);
    } else {
      const filtered = declarants.filter(declarant => {
        const fullName = `${declarant.firstname} ${declarant.lastname}`.toLowerCase();
        return fullName.includes(searchText.toLowerCase());
      });
      setFilteredDeclarants(filtered);
    }
  }, [searchText, declarants]);

  // Check form validity whenever any field changes
  useEffect(() => {
    setIsFormValid(
      district !== null &&
      declarant.trim() !== '' &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      area > 0
    );
  }, [district, declarant, kind, classification, area]);

  const handleNextClick = () => {
    if (!isFormValid) return;
    // Directly call onSuccess since we removed the ActualUsedModal
    console.log('Form data:', { district, declarant, kind, classification, area });
    onSuccess();
  };

  const handleSelectDeclarant = (declarantId: number) => {
    setDeclarant(declarantId.toString());
    setShowDeclarantSearch(false);
    setSearchText('');
  };

  const getSelectedDeclarantName = () => {
    if (!declarant) return 'Select Declarant';
    const selected = declarants.find(d => d.declarant_id.toString() === declarant);
    return selected ? `${selected.firstname} ${selected.lastname}` : 'Select Declarant';
  };

  const resetForm = () => {
    setDistrict(null);
    setDeclarant('');
    setKind('');
    setClassification('');
    setArea(0);
    setSearchText('');
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>GeoTag Form</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleDismiss}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* District Dropdown */}
          <IonItem>
            <IonLabel position="stacked">District</IonLabel>
            <IonSelect
              value={district}
              placeholder="Select District"
              onIonChange={(e) => setDistrict(e.detail.value)}
              interface="popover"
            >
              {isLoadingDistricts ? (
                <IonSelectOption value={null} disabled>
                  Loading districts...
                </IonSelectOption>
              ) : (
                districts.map((district) => (
                  <IonSelectOption 
                    key={district.district_id} 
                    value={district.district_id}
                  >
                    {district.district_name}
                  </IonSelectOption>
                ))
              )}
            </IonSelect>
          </IonItem>

          {/* Declarant Dropdown with Search */}
          <IonItem button onClick={() => setShowDeclarantSearch(true)}>
            <IonLabel position="stacked">Declarant</IonLabel>
            <IonLabel>{getSelectedDeclarantName()}</IonLabel>
            <IonIcon icon={searchOutline} slot="end" />
          </IonItem>

          {/* Kind Dropdown */}
          <IonItem>
            <IonLabel position="stacked">Kind</IonLabel>
            <IonSelect
              value={kind}
              placeholder="Select Kind"
              onIonChange={(e) => setKind(e.detail.value)}
              interface="popover"
            >
              {isLoadingKinds ? (
                <IonSelectOption value="" disabled>
                  Loading kinds...
                </IonSelectOption>
              ) : (
                kinds.map((kindItem) => (
                  <IonSelectOption 
                    key={kindItem.kind_id} 
                    value={kindItem.kind_id.toString()}
                  >
                    {kindItem.description}
                  </IonSelectOption>
                ))
              )}
            </IonSelect>
          </IonItem>

          <Classification value={classification} onChange={setClassification} />
          <Area value={area} onChange={setArea} />
          <Next onClick={handleNextClick} disabled={!isFormValid} />
        </IonContent>
      </IonModal>

      {/* Declarant Search Modal */}
      <IonModal isOpen={showDeclarantSearch} onDidDismiss={() => setShowDeclarantSearch(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Select Declarant</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDeclarantSearch(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search declarants..."
            animated
          />
          
          {isLoadingDeclarants ? (
            <IonItem>
              <IonLabel>Loading declarants...</IonLabel>
            </IonItem>
          ) : filteredDeclarants.length === 0 ? (
            <IonItem>
              <IonLabel>
                {searchText ? 'No matching declarants found' : 'No declarants available'}
              </IonLabel>
            </IonItem>
          ) : (
            <IonList>
              {filteredDeclarants.map((declarant) => (
                <IonItem 
                  key={declarant.declarant_id} 
                  button 
                  onClick={() => handleSelectDeclarant(declarant.declarant_id)}
                >
                  <IonLabel>
                    <h2>{declarant.firstname} {declarant.lastname}</h2>
                    <p>ID: {declarant.declarant_id}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default Form;