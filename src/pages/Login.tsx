import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonInput,
  IonInputPasswordToggle,
  IonAlert,
  IonToast,
  IonCard,
  IonCardContent,
  IonAvatar,
} from '@ionic/react';
import { useState } from 'react';
import { supabase } from '../utils/supaBaseClient';
import Logo from '../assets/Flag_of_Manolo_Fortich,_Bukidnon.png';
import backgroundImg from '../assets/Background.jpg';
import '../CSS/Login.css';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const doLogin = async () => {
    try {
      // Verify credentials through Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Handle specific password errors
        if (authError.message.includes('Invalid login credentials')) {
          setAlertMessage('Incorrect email or password. Please try again.');
        } else {
          setAlertMessage(authError.message);
        }
        setShowAlert(true);
        return;
      }

      // Login successful
      setShowToast(true);
      setTimeout(() => {
        navigation.push('/menu', 'forward', 'replace');
      }, 300);

    } catch (error) {
      setAlertMessage('An unexpected error occurred. Please try again.');
      setShowAlert(true);
      console.error('Login error:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="login-title">Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding' fullscreen>
        <div
          className="login-background"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />

        <div className="login-container">
          <IonCard className="login-card">
            <IonCardContent>
              <div className="login-content">
                <IonAvatar className="login-avatar">
                  <img src={Logo} alt="Logo" />
                </IonAvatar>

                <h1 className="login-title">TaxMap Staff</h1>

                <IonInput
                  label="Email"
                  labelPlacement="floating"
                  fill="outline"
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onIonChange={e => setEmail(e.detail.value!)}
                  className="login-input"
                />

                <IonInput
                  label="Password"
                  labelPlacement="floating"
                  fill="outline"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
                  className="login-input"
                >
                  <IonInputPasswordToggle slot="end" color="dark" />
                </IonInput>

                <IonButton
                  onClick={doLogin}
                  expand="block"
                  shape="round"
                  color="warning"
                  className="login-button"
                >
                  Login
                </IonButton>

                <IonButton
                  routerLink="/registration"
                  expand="block"
                  fill="clear"
                  shape="round"
                  style={{
                    '--color': 'white',
                    '--background': 'transparent',
                    '--border-color': 'transparent'
                  }}
                  className="login-secondary-button"
                >
                  Add A Taxmap Admin or User
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful! Redirecting..."
          duration={1500}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;