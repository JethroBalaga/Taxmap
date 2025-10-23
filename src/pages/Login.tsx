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
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get device information
  const getDeviceInfo = () => {
    // You can enhance this with more device detection logic
    const deviceName = navigator.userAgent;
    return deviceName;
  };

  const doLogin = async () => {
    if (!usernameOrEmail || !password) {
      setAlertMessage('Please enter both username/email and password.');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);

    try {
      let userEmail = usernameOrEmail;
      let userId = '';

      // STEP 1: Check if user exists and get user data
      let userQuery;
      if (!usernameOrEmail.includes('@')) {
        // Username lookup
        userQuery = await supabase
          .from('users')
          .select('user_email, user_id, suspended')
          .eq('username', usernameOrEmail)
          .single();
      } else {
        // Email lookup
        userQuery = await supabase
          .from('users')
          .select('user_email, user_id, suspended')
          .eq('user_email', usernameOrEmail)
          .single();
      }

      if (userQuery.error || !userQuery.data) {
        setAlertMessage('User not found. Please check your username or email.');
        setShowAlert(true);
        setIsLoading(false);
        return;
      }

      const userData = userQuery.data;
      userEmail = userData.user_email;
      userId = userData.user_id;

      // STEP 2: Check if user is suspended FIRST
      if (userData.suspended) {
        setToastMessage('Your account has been suspended. Please contact administrator.');
        setShowToast(true);
        setIsLoading(false);
        return; // Stop here if suspended
      }

      // STEP 3: Verify credentials through Supabase Auth
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
        // STEP 4: Check device registration (only if user is not suspended and credentials are correct)
        const deviceName = getDeviceInfo();
        
        // Check if device exists for this user
        const { data: deviceData, error: deviceError } = await supabase
          .from('deviceregistration')
          .select('*')
          .eq('user_id', userId)
          .eq('device_name', deviceName)
          .single();

        if (deviceError || !deviceData) {
          // Device doesn't exist, insert new device record
          const { error: insertError } = await supabase
            .from('deviceregistration')
            .insert({
              user_id: userId,
              device_name: deviceName,
              registered: false,
              registered_at: null
            });

          if (insertError) {
            console.error('Error inserting device:', insertError);
          }

          setToastMessage('New device detected. Please ask administrator to allow this device.');
          setShowToast(true);
          setIsLoading(false);
          return;
        }

        // Device exists, check if it's registered
        if (!deviceData.registered) {
          setToastMessage('Device not approved. Please ask administrator to allow this device.');
          setShowToast(true);
          setIsLoading(false);
          return;
        }

        // STEP 5: Device is registered, proceed with login
        // Store session in localStorage
        const sessionData: SessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user.id,
            email: data.user.email || '',
          }
        };
        
        storeSession(sessionData);
        
        // Login successful
        setToastMessage('Login successful! Redirecting...');
        setShowToast(true);
        setTimeout(() => {
          navigation.push('/menu', 'forward', 'replace');
        }, 1500);
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
          message={toastMessage}
          duration={3000}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;