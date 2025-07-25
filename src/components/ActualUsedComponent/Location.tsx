import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import actualUsedData from '../DB/ActualUsed.json';

interface LocationProps {
  value: string;
  onChange: (value: string) => void;
  group: string; // Added group prop
}

const Location: React.FC<LocationProps> = ({ value, onChange, group }) => {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (group) {
      // Filter locations based on selected group
      const selectedGroup = actualUsedData.find(g => g.Group === group);
      setLocations(selectedGroup ? selectedGroup.LOCATIONS : []);
    } else {
      setLocations([]);
    }
  }, [group]);

  return (
    <IonItem>
      <IonLabel>Location</IonLabel>
      <IonSelect 
        value={value} 
        placeholder={group ? "Select Location" : "Select Group First"}
        onIonChange={e => onChange(e.detail.value)}
        disabled={!group}
      >
        {locations.map(loc => (
          <IonSelectOption key={loc} value={loc}>
            {loc}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default Location;