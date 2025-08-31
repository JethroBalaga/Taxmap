import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonLoading,
  IonToast
} from '@ionic/react';
import { useEffect, useState } from 'react';
import MapCon from '../components/MapCon';
import { getUserData } from '../utils/localStorage';
import { 
  getClassificationData, 
  storeClassificationData, 
  isClassificationDataFresh,
  ClassificationData 
} from '../utils/classificationLocalStorage';
import { 
  getSubclassData, 
  storeSubclassData, 
  isSubclassDataFresh,
  SubclassData 
} from '../utils/subclassLocalStorage';
import { 
  getSubclassRateData, 
  storeSubclassRateData, 
  isSubclassRateDataFresh,
  SubclassRateData
} from '../utils/subclassRateLocalStorage';
import { 
  getActualUsedData, 
  storeActualUsedData, 
  isActualUsedDataFresh,
  ActualUsedData
} from '../utils/actualUsedLocalStorage';
import { 
  getDistrictData, 
  storeDistrictData, 
  isDistrictDataFresh,
  DistrictData
} from '../utils/districtLocalStorage';
import { 
  getBarangayData, 
  storeBarangayData, 
  isBarangayDataFresh,
  BarangayData
} from '../utils/barangayLocalStorage';
import { 
  getTaxRateData, 
  storeTaxRateData, 
  isTaxRateDataFresh,
  TaxRateData
} from '../utils/taxRateLocalStorage';
import { supabase } from '../utils/supaBaseClient';
import '../CSS/Map.css';

const Map: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading data...');
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchUserAndData = async () => {
      // Get user data from localStorage
      const userData = getUserData();
      if (userData && userData.email) {
        setUsername(userData.email);
      }

      // Check if we already have fresh classification data
      const existingClassData = await getClassificationData();
      const isClassFresh = await isClassificationDataFresh();
      
      // Check if we already have fresh subclass data
      const existingSubclassData = await getSubclassData();
      const isSubclassFresh = await isSubclassDataFresh();
      
      // Check if we already have fresh subclass rate data
      const existingRateData = await getSubclassRateData();
      const isRateFresh = await isSubclassRateDataFresh();
      
      // Check if we already have fresh actual used data
      const existingActualUsedData = await getActualUsedData();
      const isActualUsedFresh = await isActualUsedDataFresh();
      
      // Check if we already have fresh district data
      const existingDistrictData = await getDistrictData();
      const isDistrictFresh = await isDistrictDataFresh();
      
      // Check if we already have fresh barangay data
      const existingBarangayData = await getBarangayData();
      const isBarangayFresh = await isBarangayDataFresh();
      
      // Check if we already have fresh tax rate data
      const existingTaxRateData = await getTaxRateData();
      const isTaxRateFresh = await isTaxRateDataFresh();
      
      // If all datasets are fresh, no need to fetch
      if (existingClassData && isClassFresh && 
          existingSubclassData && isSubclassFresh && 
          existingRateData && isRateFresh &&
          existingActualUsedData && isActualUsedFresh &&
          existingDistrictData && isDistrictFresh &&
          existingBarangayData && isBarangayFresh &&
          existingTaxRateData && isTaxRateFresh) {
        console.log('Using existing classification, subclass, rate, actual used, district, barangay, and tax rate data');
        return;
      }

      setLoading(true);
      
      // Fetch classification data if not fresh
      if (!existingClassData || !isClassFresh) {
        setLoadingMessage('Loading classification data...');
        try {
          const { data, error } = await supabase
            .from('classtbl')
            .select('class_id, classification')
            .order('class_id', { ascending: true });

          if (error) {
            console.error('Error fetching classification data:', error);
            setErrorMessage(`Classification data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeClassificationData(data);
            console.log('Classification data stored successfully');
          } else {
            console.log('No classification data found in classtbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching classification data:', error);
          setErrorMessage('Unexpected error fetching classification data');
          setShowError(true);
        }
      }

      // Fetch subclass data if not fresh
      if (!existingSubclassData || !isSubclassFresh) {
        setLoadingMessage('Loading subclass data...');
        try {
          const { data, error } = await supabase
            .from('subclasstbl')
            .select('subclass_id, barangay_id, subclass, class_id')
            .order('subclass_id', { ascending: true });

          if (error) {
            console.error('Error fetching subclass data:', error);
            setErrorMessage(`Subclass data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeSubclassData(data);
            console.log('Subclass data stored successfully');
          } else {
            console.log('No subclass data found in subclasstbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching subclass data:', error);
          setErrorMessage('Unexpected error fetching subclass data');
          setShowError(true);
        }
      }

      // Fetch subclass rate data if not fresh
      if (!existingRateData || !isRateFresh) {
        setLoadingMessage('Loading rate data...');
        try {
          const currentYear = new Date().getFullYear();
          const { data, error } = await supabase
            .from('subclassratetbl')
            .select('subclasrate_id, subclass_id, eff_year, rate')
            .eq('eff_year', currentYear)
            .order('subclass_id', { ascending: true });
          
          if (error) {
            console.error('Error fetching subclass rate data:', error);
            setErrorMessage(`Rate data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeSubclassRateData(data, currentYear);
            console.log('Subclass rate data stored successfully for year:', currentYear);
          } else {
            console.log(`No subclass rate data found for year ${currentYear}`);
          }
        } catch (error) {
          console.error('Unexpected error fetching subclass rate data:', error);
          setErrorMessage('Unexpected error fetching rate data');
          setShowError(true);
        }
      }

      // Fetch actual used data if not fresh
      if (!existingActualUsedData || !isActualUsedFresh) {
        setLoadingMessage('Loading actual usage data...');
        try {
          const { data, error } = await supabase
            .from('actual_usedtbl')
            .select('actual_used_id, description, class_id')
            .order('actual_used_id', { ascending: true });

          if (error) {
            console.error('Error fetching actual used data:', error);
            setErrorMessage(`Actual used data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeActualUsedData(data);
            console.log('Actual used data stored successfully');
          } else {
            console.log('No actual used data found in actual_usedtbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching actual used data:', error);
          setErrorMessage('Unexpected error fetching actual usage data');
          setShowError(true);
        }
      }

      // Fetch district data if not fresh
      if (!existingDistrictData || !isDistrictFresh) {
        setLoadingMessage('Loading district data...');
        try {
          const { data, error } = await supabase
            .from('districttbl')
            .select('district_id, district_name, founded')
            .order('district_id', { ascending: true });

          if (error) {
            console.error('Error fetching district data:', error);
            setErrorMessage(`District data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeDistrictData(data);
            console.log('District data stored successfully');
          } else {
            console.log('No district data found in districttbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching district data:', error);
          setErrorMessage('Unexpected error fetching district data');
          setShowError(true);
        }
      }

      // Fetch barangay data if not fresh
      if (!existingBarangayData || !isBarangayFresh) {
        setLoadingMessage('Loading barangay data...');
        try {
          const { data, error } = await supabase
            .from('barangaytbl')
            .select('barangay_id, district_id, barangay')
            .order('barangay', { ascending: true });

          if (error) {
            console.error('Error fetching barangay data:', error);
            setErrorMessage(`Barangay data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeBarangayData(data);
            console.log('Barangay data stored successfully');
          } else {
            console.log('No barangay data found in barangaytbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching barangay data:', error);
          setErrorMessage('Unexpected error fetching barangay data');
          setShowError(true);
        }
      }

      // Fetch tax rate data if not fresh
      if (!existingTaxRateData || !isTaxRateFresh) {
        setLoadingMessage('Loading tax rate data...');
        try {
          const currentYear = new Date().getFullYear().toString();
          const { data, error } = await supabase
            .from('taxratetbl')
            .select('tax_rate_id, eff_year, rate_percent, district_id')
            .eq('eff_year', currentYear)
            .order('district_id', { ascending: true });
          
          if (error) {
            console.error('Error fetching tax rate data:', error);
            setErrorMessage(`Tax rate data error: ${error.message}`);
            setShowError(true);
          } else if (data && data.length > 0) {
            await storeTaxRateData(data, currentYear);
            console.log('Tax rate data stored successfully for year:', currentYear);
          } else {
            console.log(`No tax rate data found for year ${currentYear}`);
          }
        } catch (error) {
          console.error('Unexpected error fetching tax rate data:', error);
          setErrorMessage('Unexpected error fetching tax rate data');
          setShowError(true);
        }
      }
      
      setLoading(false);
    };

    fetchUserAndData();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="map-content">
        <IonLoading isOpen={loading} message={loadingMessage} />
        
        <IonToast
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          message={errorMessage}
          duration={5000}
          color="danger"
          position="top"
        />
        
        {username && (
          <div className="username-below-header">
            <IonCard className="username-card">
              <IonCardHeader>
                <IonCardSubtitle>Welcome back,</IonCardSubtitle>
                <IonCardTitle className="username-title">{username}</IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </div>
        )}

        <IonCard className="map-card">
          <MapCon/>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Map;