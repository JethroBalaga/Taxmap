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
    IonToolbar
} from '@ionic/react'
import { locateOutline, mapOutline } from 'ionicons/icons';
import { Redirect, Route } from 'react-router';
import Map from './Map';
import GeoTagging from './GeoTagging';
const Menu: React.FC = () => {
    const path = [
        { name: 'Map', url: '/map', icon: mapOutline},
        { name: 'Geo Tag', url: '/geotagging', icon: locateOutline},
    ]

    return (
        <>
            <IonMenu contentId="main-content">
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Menu Content</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {path.map((item, index) => (
                        <IonMenuToggle key={index}>
                            <IonItem routerLink={item.url} routerDirection="forward">
                                <IonIcon icon={item.icon} slot="start"></IonIcon>
                                {item.name}
                            </IonItem>
                        </IonMenuToggle>
                    ))}
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
                        <Route exact path="/map" component={Map} />
                        <Route exact path="/geotagging"component={GeoTagging}/>

                        <Route exact path="/">
                            <Redirect to="/map" />
                        </Route>
                    </IonRouterOutlet>
                </IonContent>
            </IonPage>
        </>
    );
};

export default Menu;