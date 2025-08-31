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
  IonLoading
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
import { supabase } from '../utils/supaBaseClient';
import '../CSS/Map.css';

const Map: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading data...');

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
      
      // If both datasets are fresh, no need to fetch
      if (existingClassData && isClassFresh && existingSubclassData && isSubclassFresh) {
        console.log('Using existing classification and subclass data');
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
          } else if (data && data.length > 0) {
            // Store in classification localStorage
            storeClassificationData(data);
            console.log('Classification data stored successfully:', data);
          } else {
            console.log('No classification data found in classtbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching classification data:', error);
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
          } else if (data && data.length > 0) {
            // Store in subclass localStorage
            storeSubclassData(data);
            console.log('Subclass data stored successfully:', data);
          } else {
            console.log('No subclass data found in subclasstbl');
          }
        } catch (error) {
          console.error('Unexpected error fetching subclass data:', error);
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