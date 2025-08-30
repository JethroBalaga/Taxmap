import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel
} from '@ionic/react';
import { useEffect, useState } from 'react';
import MapCon from '../components/MapCon';
import { getUserData } from '../utils/localStorage'; // Import the localStorage utility
import '../CSS/Map.css';

const Map: React.FC = () => {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Get user data from localStorage when component mounts
    const userData = getUserData();
    if (userData && userData.email) {
      setUsername(userData.email);
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonCard className="map-card">
          {/* Display username if available */}
          {username && (
            <IonCardHeader>
              <IonCardSubtitle>Welcome back,</IonCardSubtitle>
              <IonCardTitle className="username-title">{username}</IonCardTitle>
            </IonCardHeader>
          )}
          <MapCon/>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Map;