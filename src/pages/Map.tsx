import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle
} from '@ionic/react';
import { useEffect, useState } from 'react';
import MapCon from '../components/MapCon';
import { getUserData } from '../utils/localStorage';
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
      <IonContent fullscreen className="map-content">
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