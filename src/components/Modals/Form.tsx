import React, { useState } from 'react';
import { IonContent } from '@ionic/react';
import Declarant from '../FormComponents/Declarant';
import Kind from '../FormComponents/Kind';
import Classification from '../FormComponents/Classification';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';

const Form: React.FC = () => {
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);

  return (
    <IonContent className="ion-padding">
      <Declarant value={declarant} onChange={setDeclarant} />
      <Kind value={kind} onChange={setKind} />
      <Classification value={classification} onChange={setClassification} />
      <Area value={area} onChange={setArea} />
      <Next />
    </IonContent>
  );
};

export default Form;
