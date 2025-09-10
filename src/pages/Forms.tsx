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
  IonText
} from '@ionic/react';
import { arrowUpCircle, trash, refresh } from 'ionicons/icons';
import { FormDataLocalStorage, FormData } from '../utils/tablestorages/FormDataLocalStorage';
import './../CSS/Forms.css';
import DynamicTable from '../components/GlobalComponent/DynamicTable';

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on component mount
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = () => {
    setIsLoading(true);
    try {
      // Fetch the form data from localStorage
      const storedFormData = FormDataLocalStorage.getFormData();
      
      if (storedFormData) {
        // Convert to array format for the table
        setFormData([storedFormData]);
      } else {
        // No data found in localStorage
        setFormData([]);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClick = () => {
    if (selectedForm) {
      console.log('Update form:', selectedForm);
      // In a real app, you would implement update functionality
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
      // Clear the form data from localStorage
      FormDataLocalStorage.clearFormData();
      
      // Update local state
      setFormData([]);
      setSelectedForm(null);
      setShowDeleteAlert(false);
      
      console.log('Deleted form:', selectedForm.id);
    }
  };

  const handleRowClick = (rowData: any) => {
    setSelectedForm(rowData);
  };

  const handleRefresh = () => {
    loadFormData();
  };

  // Filter forms based on search term
  const filteredForms = formData.filter(form => 
    Object.values(form).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
                    <IonIcon
                      icon={refresh}
                      className="icon-yellow"
                      onClick={handleRefresh}
                      title="Refresh Data"
                    />
                    <IonIcon
                      icon={arrowUpCircle}
                      className={selectedForm ? "icon-yellow" : "icon-yellow icon-disabled"}
                      onClick={handleUpdateClick}
                      title="Update Selected Form"
                    />
                    <IonIcon
                      icon={trash}
                      className={selectedForm ? "icon-yellow" : "icon-yellow icon-disabled"}
                      onClick={handleDeleteClick}
                      title="Delete Selected Form"
                    />
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
                      title="Stored Form Data"
                      keyField="id"
                      onRowClick={handleRowClick}
                    />
                    
                    {selectedForm && (
                      <div className="selection-info">
                        Selected Form: {selectedForm.id}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <IonText>
                      <h3>No Form Data Found</h3>
                      <p>There is no form data stored in localStorage.</p>
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
            message={'Are you sure you want to delete this form?'}
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Delete',
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