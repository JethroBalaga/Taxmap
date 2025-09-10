import {
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonPage,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
    IonList,
    IonLabel
} from '@ionic/react'
import {mapOutline, logOutOutline, documentTextOutline } from 'ionicons/icons';
import { Redirect, Route } from 'react-router';
import { useIonRouter } from '@ionic/react';
import Map from './Map';
import { clearSession } from '../utils/localStorage'; // Import the clearSession function
import { supabase } from '../utils/supaBaseClient'; // Import supabase client
import Forms from './Forms';
import BuildingTable from './Formstabs/BuildingTable';

const Menu: React.FC = () => {
    const router = useIonRouter();
    const path = [
        { name: 'Map', url: '/menu/map', icon: mapOutline},
        { name: 'Forms', url: '/menu/forms', icon: documentTextOutline},
    ]

    const handleLogout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();
            
            // Clear session from localStorage
            clearSession();
            
            // Redirect to login page
            router.push('/', 'root', 'replace');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            <IonMenu contentId="main-content">
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Menu Content</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonList>
                        {path.map((item, index) => (
                            <IonMenuToggle key={index} autoHide={false}>
                                <IonItem routerLink={item.url} routerDirection="forward">
                                    <IonIcon icon={item.icon} slot="start"></IonIcon>
                                    {item.name}
                                </IonItem>
                            </IonMenuToggle>
                        ))}
                        
                        {/* Logout Button */}
                        <IonMenuToggle autoHide={false}>
                            <IonItem button onClick={handleLogout} lines="none">
                                <IonIcon icon={logOutOutline} slot="start" color="danger"></IonIcon>
                                <IonLabel color="danger">Logout</IonLabel>
                            </IonItem>
                        </IonMenuToggle>
                    </IonList>
                </IonContent>
            </IonMenu>
            <IonPage id="main-content">
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonMenuButton></IonMenuButton>
                        </IonButtons>
                        <IonTitle>Menu</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonRouterOutlet id="main">
                        <Route exact path="/menu/map" component={Map} />
                        <Route exact path="/menu/forms" component={Forms} />
                        <Route exact path="/menu/buildingtable" component={BuildingTable} />
                        <Route exact path="/menu">
                            <Redirect to="/menu/map" />
                        </Route>
                    </IonRouterOutlet>
                </IonContent>
            </IonPage>
        </>
    );
};

export default Menu;