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
import { supabase } from '../utils/supaBaseClient';
import '../CSS/Map.css';

// Interface for classification data
interface ClassificationData {
  class_id: string;
  classification: string;
}

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

      // Check if we already have classification data in localStorage
      const storedClassification = localStorage.getItem('classification_data');
      if (storedClassification) {
        console.log('Classification data already in localStorage:', JSON.parse(storedClassification));
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
          // Store in localStorage with a different key
          localStorage.setItem('classification_data', JSON.stringify(data));
          console.log('Classification data stored in localStorage:', data);
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
        {/* Loading indicator */}
        <IonLoading isOpen={loading} message="Loading classification data..." />

        {/* Username Label - Positioned below the header */}
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

        {/* Map Card - Full screen */}
        <IonCard className="map-card">
          <MapCon/>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Map;