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
      const existingClassData = getClassificationData();
      const isClassFresh = isClassificationDataFresh();
      
      // Check if we already have fresh subclass data
      const existingSubclassData = getSubclassData();
      const isSubclassFresh = isSubclassDataFresh();
      
      // Check if we already have fresh subclass rate data for current year
      const existingRateData = getSubclassRateData();
      const isRateFresh = isSubclassRateDataFresh();
      
      // If all datasets are fresh, no need to fetch
      if (existingClassData && isClassFresh && 
          existingSubclassData && isSubclassFresh && 
          existingRateData && isRateFresh) {
        console.log('Using existing classification, subclass, and rate data');
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
            // Store in classification localStorage
            storeClassificationData(data);
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
            // Store in subclass localStorage
            storeSubclassData(data);
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

      // Fetch subclass rate data for current year if not fresh
      if (!existingRateData || !isRateFresh) {
        setLoadingMessage('Loading rate data...');
        try {
          const currentYear = new Date().getFullYear();
          console.log('Fetching rate data for year:', currentYear);
          
          // Let's try a simpler query first to debug
          let query = supabase
            .from('subclassratetbl')
            .select('*');
          
          // Add filter for current year if the table has this column
          query = query.eq('eff_year', currentYear);
          
          // Add ordering
          query = query.order('subclass_id', { ascending: true });
          
          const { data, error } = await query;
          
          // Log the full error details for debugging
          if (error) {
            console.error('Full error details:', error);
            console.error('Error fetching subclass rate data:', error.message);
            console.error('Error details:', error.details);
            console.error('Error hint:', error.hint);
            
            setErrorMessage(`Rate data error: ${error.message}. Please check if the table and columns exist.`);
            setShowError(true);
            
            // Try a fallback query without filters to see what data exists
            try {
              const { data: allData } = await supabase
                .from('subclassratetbl')
                .select('*')
                .limit(5);
              
              console.log('Sample data from subclassratetbl:', allData);
            } catch (fallbackError) {
              console.error('Fallback query also failed:', fallbackError);
            }
          } else if (data && data.length > 0) {
            // Store in subclass rate localStorage
            storeSubclassRateData(data, currentYear);
            console.log('Subclass rate data stored successfully for year:', currentYear);
            console.log('Number of rate records:', data.length);
          } else {
            console.log(`No subclass rate data found for year ${currentYear}`);
            // Check if there's any data in the table at all
            const { data: anyData } = await supabase
              .from('subclassratetbl')
              .select('*')
              .limit(1);
              
            if (anyData && anyData.length > 0) {
              console.log('But there is data in the table for other years:', anyData);
            } else {
              console.log('The subclassratetbl appears to be empty');
            }
          }
        } catch (error) {
          console.error('Unexpected error fetching subclass rate data:', error);
          setErrorMessage('Unexpected error fetching rate data');
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