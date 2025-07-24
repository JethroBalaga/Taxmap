import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import actualUsedData from '../DB/ActualUsed.json';

interface LocationProps {
  value: string;
  onChange: (value: string) => void;
}

const Location: React.FC<LocationProps> = ({ value, onChange }) => {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    // Flatten all location arrays and remove duplicates
    const allLocations = actualUsedData.flatMap(group => group.LOCATIONS);
    const uniqueLocations = Array.from(new Set(allLocations));
    setLocations(uniqueLocations);
  }, []);

  return (
    <IonItem>
      <IonLabel>Location</IonLabel>
      <IonSelect value={value} placeholder="Select Location" onIonChange={e => onChange(e.detail.value)}>
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
