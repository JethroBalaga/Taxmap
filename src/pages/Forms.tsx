import React, { useState, useEffect } from 'react';
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
  IonAlert,
  IonText,
  IonButton
} from '@ionic/react';
import { arrowUpCircle, trash, refresh, add } from 'ionicons/icons';
import { FormDataLocalStorage, FormData } from '../utils/tablestorages/FormDataLocalStorage';
import './../CSS/Forms.css';
import DynamicTable from '../components/GlobalComponent/DynamicTable';

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Array of icon objects for better organization
  const iconActions = [
    {
      icon: refresh,
      className: "icon-blue",
      onClick: () => handleRefresh(),
      title: "Refresh Data",
      enabled: true
    },
    {
      icon: arrowUpCircle,
      className: selectedForm ? "icon-blue" : "icon-blue icon-disabled",
      onClick: () => handleUpdateClick(),
      title: "Update Selected Form",
      enabled: !!selectedForm
    },
    {
      icon: trash,
      className: selectedForm ? "icon-blue" : "icon-blue icon-disabled",
      onClick: () => handleDeleteClick(),
      title: "Delete Selected Form",
      enabled: !!selectedForm
    }
  ];

  // Load data from localStorage on component mount
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = () => {
  setIsLoading(true);
  try {
    // Fetch ALL form data from localStorage
    const allForms = FormDataLocalStorage.getAllFormData();
    
    // Ensure we always have an array, even if data is corrupted
    if (Array.isArray(allForms)) {
      setFormData(allForms);
    } else {
      // Handle legacy data format (single object instead of array)
      if (allForms && typeof allForms === 'object' && 'id' in allForms) {
        // Convert single form to array
        setFormData([allForms]);
        // Also update localStorage to new format
        localStorage.setItem('formData', JSON.stringify([allForms]));
      } else {
        // No valid data found
        setFormData([]);
      }
    }
  } catch (error) {
    console.error('Error loading form data:', error);
    setFormData([]);
  } finally {
    setIsLoading(false);
  }
};

  const handleUpdateClick = () => {
    if (selectedForm) {
      console.log('Update form:', selectedForm);
      // In a real app, you would navigate to an edit form
      alert(`Would update form with ID: ${selectedForm.id}`);
    } else {
      alert('Please select a form to update');
    }
  };

  const handleDeleteClick = () => {
    if (selectedForm) {
      setShowDeleteAlert(true);
    } else {
      alert('Please select a form to delete');
    }
  };

  const confirmDelete = () => {
    if (selectedForm) {
      // Delete the selected form from localStorage
      const success = FormDataLocalStorage.deleteFormData(selectedForm.id);
      
      if (success) {
        // Update local state
        const updatedForms = formData.filter(form => form.id !== selectedForm.id);
        setFormData(updatedForms);
        setSelectedForm(null);
        setShowDeleteAlert(false);
        
        console.log('Deleted form:', selectedForm.id);
      } else {
        alert('Error deleting form');
      }
    }
  };
  const handleRowClick = (rowData: any) => {
    setSelectedForm(rowData);
  };

  const handleRefresh = () => {
    loadFormData();
  };

  // Filter forms based on search term - with additional safety check
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
                  <IonText>Loading form data...</IonText>
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
                        Selected Form: {selectedForm.id} - {selectedForm.kind} in District {selectedForm.district}
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

          <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header={'Confirm Delete'}
            message={'Are you sure you want to delete this form? This action cannot be undone.'}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Delete',
                role: 'destructive',
                handler: confirmDelete
              }
            ]}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Forms;