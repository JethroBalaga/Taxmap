import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonList, IonLabel, IonItem } from '@ionic/react';
import ActualUsed from '../ActualUsedComponent/ActualUsed';
import Group from '../ActualUsedComponent/Group';
import Location from '../ActualUsedComponent/Location';
import Subclass from '../ActualUsedComponent/Subclass';

interface ActualUsedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: {
        actualUse: string;
        group: string;
        location: string;
        subclass: string;
    }) => void;
}

const ActualUsedModal: React.FC<ActualUsedModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        actualUse: '',
        group: '',
        location: '',
        subclass: ''
    });

    const handleInputChange = (field: keyof typeof formData) => (value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            // Reset location when group changes
            ...(field === 'group' && { location: '' })
        }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    const showSecondaryFields = !!formData.actualUse && !!formData.group;

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Property Details</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    <ActualUsed
                        value={formData.actualUse}
                        onChange={handleInputChange('actualUse')}
                    />

                    <Group
                        value={formData.group}
                        onChange={handleInputChange('group')}
                    />

                    {showSecondaryFields && (
                        <>
                            <Location
                                value={formData.location}
                                onChange={handleInputChange('location')}
                                group={formData.group} // Pass the selected group
                            />

                            <Subclass
                                value={formData.subclass}
                                onChange={handleInputChange('subclass')}
                                actualUse={formData.actualUse} // Pass the selected actualUse
                            />

                            <IonItem>
                                <IonLabel>Rating: </IonLabel>
                                {/* Rating display logic would go here */}
                            </IonItem>
                        </>
                    )}
                </IonList>

                <div className="ion-padding">
                    <IonButton
                        expand="block"
                        onClick={handleSubmit}
                        disabled={!formData.actualUse || !formData.group || !formData.location || !formData.subclass}
                    >
                        Submit
                    </IonButton>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default ActualUsedModal;