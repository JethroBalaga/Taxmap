// src/components/GlobalComponent/Next.tsx
import React from 'react';
import { IonButton } from '@ionic/react';

interface NextProps {
  onClick?: () => void;
  color?: string;
  expand?: 'full' | 'block';
}

const Next: React.FC<NextProps> = ({ onClick, color = 'primary', expand = 'block' }) => {
  return (
    <IonButton expand={expand} color={color} onClick={onClick}>
      Next
    </IonButton>
  );
};

export default Next;