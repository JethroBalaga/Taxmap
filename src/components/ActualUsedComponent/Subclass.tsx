import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import actualUsedData from '../DB/ActualUsed.json';
import { RatingClassification } from './types';
interface SubclassProps {
  value: string;
  onChange: (value: string) => void;
  actualUse: string;
}

const Subclass: React.FC<SubclassProps> = ({ value, onChange, actualUse }) => {
  const [subclasses, setSubclasses] = useState<string[]>([]);

  useEffect(() => {
    if (!actualUse) {
      setSubclasses([]);
      return;
    }

    // Type-safe filtering
    const validClassifications: RatingClassification[] = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'];
    const normalizedActualUse = actualUse.toUpperCase() as RatingClassification;

    if (!validClassifications.includes(normalizedActualUse)) {
      setSubclasses([]);
      return;
    }

    const subclassSet = new Set<string>();

    // No type assertion needed now
    actualUsedData.forEach(group => {
      const ratingsForUse = group.RATINGS[normalizedActualUse];
      if (ratingsForUse) {
        Object.keys(ratingsForUse).forEach(subclass => {
          subclassSet.add(subclass);
        });
      }
    });

    // Sort by prefix (R/C/I) then by number
    const sorted = Array.from(subclassSet).sort((a, b) => {
      const prefixOrder = { R: 1, C: 2, I: 3 };
      const getPrefix = (s: string) => s[0] as keyof typeof prefixOrder;
      const getNumber = (s: string) => parseInt(s.slice(1), 10);

      return prefixOrder[getPrefix(a)] - prefixOrder[getPrefix(b)] || 
             getNumber(a) - getNumber(b);
    });

    setSubclasses(sorted);
  }, [actualUse]);

  return (
    <IonItem>
      <IonLabel>Subclass</IonLabel>
      <IonSelect
        value={value}
        placeholder={actualUse ? "Select Subclass" : "Select Actual Use First"}
        onIonChange={e => onChange(e.detail.value)}
        disabled={!actualUse}
      >
        {subclasses.map(subclass => (
          <IonSelectOption key={subclass} value={subclass}>
            {subclass}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default Subclass;