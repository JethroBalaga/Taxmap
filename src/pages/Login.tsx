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
import { storeSession, SessionData } from '../utils/localStorage';
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
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const doLogin = async () => {
    if (!usernameOrEmail || !password) {
      setAlertMessage('Please enter both username/email and password.');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      let userEmail = usernameOrEmail;

      // If input doesn't contain '@', treat it as username and look up the email
      if (!usernameOrEmail.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_email')
          .eq('username', usernameOrEmail)
          .single();

        if (userError || !userData) {
          setAlertMessage('User not found. Please check your username or email.');
          setShowAlert(true);
          setIsLoading(false);
          return;
        }
        userEmail = userData.user_email;
      }

      // Verify credentials through Supabase Auth using the email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password
      });

      if (authError) {
        // Handle specific password errors
        if (authError.message.includes('Invalid login credentials')) {
          setAlertMessage('Incorrect username/email or password. Please try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setAlertMessage('Please verify your email address before logging in.');
        } else {
          setAlertMessage(authError.message);
        }
        setShowAlert(true);
        setIsLoading(false);
        return;
      }

      if (data.session && data.user) {
        // Store session in localStorage
        const sessionData: SessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            // Add other user properties you might need
          }
        };
        
        storeSession(sessionData);
        
        // Login successful
        setShowToast(true);
        setTimeout(() => {
          navigation.push('/menu', 'forward', 'replace');
        }, 300);
      } else {
        setAlertMessage('Login failed. Please try again.');
        setShowAlert(true);
      }

    } catch (error) {
      setAlertMessage('An unexpected error occurred. Please try again.');
      setShowAlert(true);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      doLogin();
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
                  label="Username or Email"
                  labelPlacement="floating"
                  fill="outline"
                  type="text"
                  placeholder="Enter username or email"
                  value={usernameOrEmail}
                  onIonChange={e => setUsernameOrEmail(e.detail.value!)}
                  onKeyPress={handleKeyPress}
                  className="login-input"
                  disabled={isLoading}
                />

                <IonInput
                  label="Password"
                  labelPlacement="floating"
                  fill="outline"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
                  onKeyPress={handleKeyPress}
                  className="login-input"
                  disabled={isLoading}
                >
                  <IonInputPasswordToggle slot="end" color="dark" />
                </IonInput>

                <IonButton
                  onClick={doLogin}
                  expand="block"
                  shape="round"
                  color="warning"
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <AlertBox 
          message={alertMessage} 
          isOpen={showAlert} 
          onClose={() => setShowAlert(false)} 
        />

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