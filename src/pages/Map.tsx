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
import { MapDataManager } from '../utils/MapUtility';
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

      // Check if all data is fresh
      const allDataFresh = await MapDataManager.checkAllDataFreshness();
      if (allDataFresh) {
        console.log('Using all existing data');
        return;
      }

      setLoading(true);
      
      // Fetch all required data
      const { results, hasErrors } = await MapDataManager.fetchAllRequiredData();
      
      // Handle errors
      if (hasErrors) {
        const errorMessages = results
          .filter(result => !result.success)
          .map(result => result.message)
          .join(', ');
        
        setErrorMessage(`Errors occurred: ${errorMessages}`);
        setShowError(true);
      }

      // Log all results
      results.forEach(result => {
        if (result.success) {
          console.log(result.message);
        } else {
          console.error(result.message, result.error);
        }
      });
      
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