import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonIcon,
  IonText,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { arrowUpCircle, trash, informationCircleOutline } from 'ionicons/icons';
import { FormDataLocalStorage, FormData } from '../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../utils/tablestorages/ValueInfoLocalStorage';
import { PhotoTagLocalStorage } from '../utils/tablestorages/PhotoTagLocalStorage';
import { BuildingDataLocalStorage } from '../utils/tablestorages/BuildingDataLocalStorage';
import { BuildingAdjustmentLocalStorage } from '../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { Filesystem, Directory } from '@capacitor/filesystem';
import './../CSS/Forms.css';
import DynamicTable from '../components/GlobalComponent/DynamicTable';
import FormUpdateModal from '../components/Modals/FormUpdateModal';
import { useHistory } from 'react-router-dom';

// Add interface for PhotoTag if not already defined
interface PhotoTag {
  id: string;
  imagePath?: string;
  // Add other properties as needed
}

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastButtons, setToastButtons] = useState<any[]>([]);
  const history = useHistory();

  const iconActions = [
    { icon: arrowUpCircle, className: selectedForm ? "icon-blue" : "icon-blue icon-disabled", onClick: () => handleUpdateClick(), title: "Update Selected Form", enabled: !!selectedForm },
    { icon: trash, className: selectedForm ? "icon-blue" : "icon-blue icon-disabled", onClick: () => handleDeleteClick(), title: "Delete Selected Form", enabled: !!selectedForm },
    { icon: informationCircleOutline, className: selectedForm ? "icon-blue" : "icon-blue icon-disabled", onClick: () => handleInfoClick(), title: "View Building Details", enabled: !!selectedForm },
  ];

  const loadFormData = useCallback(() => {
    setIsLoading(true);
    try {
      const allForms = FormDataLocalStorage.getAllFormData();
      if (Array.isArray(allForms)) {
        setFormData(allForms);
      } else if (allForms && typeof allForms === 'object' && 'id' in allForms) {
        setFormData([allForms]);
        localStorage.setItem('formData', JSON.stringify([allForms]));
      } else {
        setFormData([]);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      setFormData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    loadFormData();
  });

  useEffect(() => {
    loadFormData();

    const refreshInterval = setInterval(() => {
      loadFormData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [loadFormData]);

  const handleRefresh = (event: CustomEvent) => {
    loadFormData();
    setTimeout(() => {
      if (event.detail) {
        event.detail.complete();
      }
    }, 1000);
  };

  const handleUpdateClick = () => {
    if (selectedForm) {
      setShowUpdateModal(true);
    } else {
      setToastMessage('Please select a form to update');
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowToast(true);
    }
  };

  const handleDeleteClick = () => {
    if (selectedForm) {
      setToastMessage('Are you sure you want to delete this form and all its related data?');
      setToastButtons([
        { text: 'Cancel', role: 'cancel', handler: () => setShowToast(false) },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirmDelete();
            setShowToast(false);
          }
        }
      ]);
      setShowToast(true);
    } else {
      setToastMessage('Please select a form to delete');
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowToast(true);
    }
  };

  const handleInfoClick = () => {
    if (selectedForm) {
      const kind = typeof selectedForm.kind === 'string'
        ? parseInt(selectedForm.kind)
        : selectedForm.kind;

      if (kind === 2) {
        // Navigate to building table using routing
        history.push(`/menu/forms/buildingtable/${selectedForm.id}`);
      } else {
        setToastMessage('Building details are only available for forms with kind = 2');
        setToastButtons([{ text: 'OK', role: 'cancel' }]);
        setShowToast(true);
      }
    } else {
      setToastMessage('Please select a form to view details');
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowToast(true);
    }
  };

  const deleteImageFile = async (imagePath: string): Promise<void> => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
      console.warn('Invalid image path provided for deletion');
      return;
    }
    
    try {
      // Extract just the filename from the path
      let filename = imagePath;
      
      // Remove file:// prefix if present
      if (filename.startsWith('file://')) {
        filename = filename.substring(7); // Remove "file://" prefix
      }
      
      // Extract just the filename part (after the last slash)
      const lastSlashIndex = Math.max(
        filename.lastIndexOf('/'),
        filename.lastIndexOf('\\')
      );
      
      if (lastSlashIndex !== -1) {
        filename = filename.substring(lastSlashIndex + 1);
      }
      
      // Ensure we have a valid filename
      if (!filename || filename.trim() === '') {
        console.warn('Could not extract valid filename from path:', imagePath);
        return;
      }
      
      console.log(`Attempting to delete image file: ${filename}`);
      
      // Try to delete the file
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data
      });
      
      console.log(`Successfully deleted image file: ${filename}`);
    } catch (error: any) {
      // Check if it's a "file does not exist" error
      if (error.message && error.message.includes('does not exist')) {
        console.log(`Image file already deleted: ${imagePath}`);
      } else {
        console.warn(`Could not delete image file: ${imagePath}`, error);
      }
      // Continue with other deletions even if file deletion fails
    }
  };

  const deleteRelatedData = async (formId: string): Promise<void> => {
    console.log(`Deleting related data for form ID: ${formId}`);

    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    const relatedValueInfo = allValueInfo.filter(info => info.formDataId === formId);

    console.log(`Found ${relatedValueInfo.length} value info entries to delete`);

    // First, delete all image files
    const imageDeletionPromises: Promise<void>[] = [];
    
    for (const valueInfo of relatedValueInfo) {
      console.log(`Processing value info ID: ${valueInfo.id}`);
      
      if (valueInfo.photoTagId) {
        try {
          // Use type assertion to handle the photoTag response
          const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId) as unknown as PhotoTag;
          
          // Check if photoTag exists and has imagePath property
          if (photoTag && typeof photoTag === 'object' && 'imagePath' in photoTag) {
            const imagePath = (photoTag as any).imagePath;
            if (imagePath && typeof imagePath === 'string') {
              // Add the deletion promise to the array
              imageDeletionPromises.push(deleteImageFile(imagePath));
            }
          }
        } catch (error) {
          console.error(`Error processing photo tag for value info ${valueInfo.id}:`, error);
          // Continue with other deletions
        }
      }
    }

    // Wait for all image deletions to complete (or fail)
    try {
      await Promise.allSettled(imageDeletionPromises);
      console.log('All image deletion operations completed');
    } catch (error) {
      console.error('Error in image deletion process:', error);
    }

    // Then delete database entries
    relatedValueInfo.forEach(valueInfo => {
      console.log(`Deleting database entries for value info ID: ${valueInfo.id}`);

      try {
        const buildingDataDeleted = BuildingDataLocalStorage.deleteBuildingData(valueInfo.id);
        if (buildingDataDeleted) {
          console.log(`Deleted building data for value info ID: ${valueInfo.id}`);
        }

        const buildingAdjustmentsDeleted = BuildingAdjustmentLocalStorage.deleteBuildingAdjustmentsByValueInfoId(valueInfo.id);
        if (buildingAdjustmentsDeleted) {
          console.log(`Deleted building adjustments for value info ID: ${valueInfo.id}`);
        }

        if (valueInfo.photoTagId) {
          const photoTagDeleted = PhotoTagLocalStorage.deletePhotoTag(valueInfo.photoTagId);
          if (photoTagDeleted) {
            console.log(`Deleted photo tag ID: ${valueInfo.photoTagId}`);
          }
        }

        const valueInfoDeleted = ValueInfoLocalStorage.deleteValueInfo(valueInfo.id);
        if (valueInfoDeleted) {
          console.log(`Deleted value info ID: ${valueInfo.id}`);
        }
      } catch (error) {
        console.error(`Error deleting database entries for value info ${valueInfo.id}:`, error);
      }
    });

    // Clean up any orphaned entries
    const remainingValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    const orphanedValueInfo = remainingValueInfo.filter(info => info.formDataId === formId);

    if (orphanedValueInfo.length > 0) {
      console.log(`Found ${orphanedValueInfo.length} orphaned value info entries, deleting them`);
      orphanedValueInfo.forEach(info => {
        try {
          ValueInfoLocalStorage.deleteValueInfo(info.id);
        } catch (error) {
          console.error(`Error deleting orphaned value info ${info.id}:`, error);
        }
      });
    }
  };

  const confirmDelete = async () => {
    if (selectedForm) {
      try {
        await deleteRelatedData(selectedForm.id);

        const success = FormDataLocalStorage.deleteFormData(selectedForm.id);
        if (success) {
          const updatedForms = formData.filter(form => form.id !== selectedForm.id);
          setFormData(updatedForms);
          setSelectedForm(null);
          setToastMessage('Form and all related data deleted successfully');
          setToastButtons([{ text: 'OK', role: 'cancel' }]);
          setShowToast(true);
        } else {
          setToastMessage('Error deleting form');
          setToastButtons([{ text: 'OK', role: 'cancel' }]);
          setShowToast(true);
        }
      } catch (error) {
        console.error('Error during deletion:', error);
        setToastMessage('Error deleting form data');
        setToastButtons([{ text: 'OK', role: 'cancel' }]);
        setShowToast(true);
      }
    }
  };

  const handleRowClick = (rowData: any) => {
    setSelectedForm(rowData);
  };

  const handleFormUpdate = (updatedData: FormData) => {
    loadFormData();
    setSelectedForm(updatedData);
  };

  const filteredForms = Array.isArray(formData)
    ? formData.filter(form =>
      form && Object.values(form).some(value =>
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    : [];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Forms Management</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="forms-container">
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <div className="search-container">
                  <IonSearchbar
                    placeholder="Search forms..."
                    value={searchTerm}
                    onIonInput={(e) => setSearchTerm(e.detail.value!)}
                    className="forms-searchbar"
                  />
                  <div className="icon-group">
                    {iconActions.map((action, index) => (
                      <IonIcon
                        key={index}
                        icon={action.icon}
                        className={action.className}
                        onClick={action.onClick}
                        title={action.title}
                      />
                    ))}
                  </div>
                </div>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="12">
                {isLoading ? (
                  <div className="loading-indicator">
                    <IonSpinner name="crescent" />
                    <IonText>Loading form data...</IonText>
                  </div>
                ) : formData.length > 0 ? (
                  <>
                    <DynamicTable
                      data={filteredForms}
                      title={`Forms (${filteredForms.length} of ${formData.length})`}
                      keyField="id"
                      onRowClick={handleRowClick}
                    />
                    {selectedForm && (
                      <div className="selection-info">
                        Selected Form: {selectedForm.id} - Kind: {selectedForm.kind} in District {selectedForm.district}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <IonText>
                      <h3>No Form Data Found</h3>
                      <p>Click "Add New" to create your first form.</p>
                    </IonText>
                  </div>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => { setShowToast(false); setToastButtons([]); }}
            message={toastMessage}
            duration={toastButtons.length > 1 ? 0 : 3000}
            buttons={toastButtons}
            position="middle"
            color="warning"
          />

          <FormUpdateModal
            isOpen={showUpdateModal}
            formId={selectedForm?.id || null}
            onDismiss={() => setShowUpdateModal(false)}
            onUpdate={handleFormUpdate}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Forms;