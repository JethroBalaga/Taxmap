// SubmitButton.tsx
import React from 'react';
import { IonButton } from '@ionic/react';

const SubmitButton: React.FC = () => {
  return (
    <IonButton expand="block" type="submit">
      Submit
    </IonButton>
  );
};

export default SubmitButton;
