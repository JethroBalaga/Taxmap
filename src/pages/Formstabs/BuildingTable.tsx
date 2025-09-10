import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from "@ionic/react";

interface BuildingTableProps {
  form_id: string;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ form_id }) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Building Table - Form ID: {form_id}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <p>Building details for form: {form_id}</p>
      </IonContent>
    </IonPage>
  );
};

export default BuildingTable;