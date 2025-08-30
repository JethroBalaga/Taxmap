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
import { supabase } from '../utils/supaBaseClient';
import '../CSS/Map.css';

const Map: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserAndClassificationData = async () => {
      // Get user data from localStorage
      const userData = getUserData();
      if (userData && userData.email) {
        setUsername(userData.email);
      }

      // Check if we already have fresh classification data
      const existingData = getClassificationData();
      const isFresh = isClassificationDataFresh();
      
      if (existingData && isFresh) {
        console.log('Using existing classification data:', existingData);
        return;
      }

      // Fetch classification data from classtbl
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('classtbl')
          .select('class_id, classification')
          .order('class_id', { ascending: true });

        if (error) {
          console.error('Error fetching classification data:', error);
          return;
        }

        if (data && data.length > 0) {
          // Store in separate classification localStorage
          storeClassificationData(data);
          console.log('Classification data stored successfully:', data);
        } else {
          console.log('No classification data found in classtbl');
        }
      } catch (error) {
        console.error('Unexpected error fetching classification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndClassificationData();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="map-content">
        <IonLoading isOpen={loading} message="Loading classification data..." />
        
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