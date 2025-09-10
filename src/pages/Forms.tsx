import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonIcon
} from '@ionic/react';
import { arrowUpCircle, trash } from 'ionicons/icons';
import './../CSS/Forms.css';

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdateClick = () => {
    console.log('Update functionality will be implemented later');
  };

  const handleDeleteClick = () => {
    console.log('Delete functionality will be implemented later');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Forms Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <div className="forms-container">
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <div className="search-container">
                  <IonSearchbar
                    placeholder="Search forms..."
                    value={searchTerm}
                    onIonInput={(e) => setSearchTerm(e.detail.value!)}
                    className="forms-searchbar"
                  />

                  <div className="icon-group">
                    <IonIcon
                      icon={arrowUpCircle}
                      className="icon-yellow"
                      onClick={handleUpdateClick}
                      title="Edit Item"
                    />
                    <IonIcon
                      icon={trash}
                      className="icon-yellow"
                      onClick={handleDeleteClick}
                      title="Delete Item"
                    />
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Forms;