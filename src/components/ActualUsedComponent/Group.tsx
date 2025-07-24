import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

interface GroupProps {
  value: string;
  onChange: (value: string) => void;
}

const Group: React.FC<GroupProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel>Group</IonLabel>
      <IonSelect value={value} placeholder="Select Group" onIonChange={e => onChange(e.detail.value)}>
        <IonSelectOption value="A">A</IonSelectOption>
        <IonSelectOption value="B">B</IonSelectOption>
        <IonSelectOption value="C">C</IonSelectOption>
        <IonSelectOption value="D">D</IonSelectOption>
      </IonSelect>
    </IonItem>
  );
};

export default Group;
