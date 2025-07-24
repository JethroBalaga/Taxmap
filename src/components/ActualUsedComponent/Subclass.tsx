import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import actualUsedData from '../DB/ActualUsed.json';

interface RatingGroup {
  RATINGS: {
    [classification: string]: {
      [subclass: string]: any; // Replace 'any' with the actual type if known
    };
  };
}

const Subclass: React.FC = () => {
  const [subclasses, setSubclasses] = useState<string[]>([]);

  useEffect(() => {
    const subclassSet = new Set<string>();

    (actualUsedData as RatingGroup[]).forEach(group => {
      const ratings = group.RATINGS;
      Object.keys(ratings).forEach((classification) => {
        const classRatings = ratings[classification];
        if (classRatings) {
          Object.keys(classRatings).forEach((key) => {
            subclassSet.add(key);
          });
        }
      });
    });

    // Sort result like R1–R4, C1–C4, I1–I4
    const sorted = Array.from(subclassSet).sort((a, b) => {
      const getPrefix = (str: string) => str[0];
      const getNumber = (str: string) => parseInt(str.slice(1), 10);
      
      // Define a type for the prefix order mapping
      type PrefixOrder = {
        [key: string]: number;
      };
      
      const prefixOrder: PrefixOrder = { R: 1, C: 2, I: 3 };
      
      const prefixA = getPrefix(a);
      const prefixB = getPrefix(b);
      
      // Fallback to 0 if prefix is not found (shouldn't happen with your data)
      return (prefixOrder[prefixA] || 0) - (prefixOrder[prefixB] || 0) ||
             getNumber(a) - getNumber(b);
    });

    setSubclasses(sorted);
  }, []);

  return (
    <IonItem>
      <IonLabel>Subclass</IonLabel>
      <IonSelect placeholder="Select Subclass">
        {subclasses.map((subclass) => (
          <IonSelectOption key={subclass} value={subclass}>
            {subclass}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default Subclass;