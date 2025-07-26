// src/components/GlobalComponent/Next.tsx
import React from 'react';
import { IonButton } from '@ionic/react';

interface NextProps {
  onClick?: () => void;
  color?: string;
  expand?: 'full' | 'block';
  disabled?: boolean;
}

const Next: React.FC<NextProps> = ({ 
  onClick, 
  color = 'primary', 
  expand = 'block', 
  disabled = false 
}) => {
  return (
    <IonButton 
      expand={expand} 
      color={color} 
      onClick={onClick}
      disabled={disabled}
    >
      Next
    </IonButton>
  );
};

export default Next;