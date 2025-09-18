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
  IonAlert,
  IonText,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
  IonSpinner
} from '@ionic/react';
import { arrowUpCircle, trash, informationCircleOutline } from 'ionicons/icons';
import { FormDataLocalStorage, FormData } from '../utils/tablestorages/FormDataLocalStorage';
import './../CSS/Forms.css';
import DynamicTable from '../components/GlobalComponent/DynamicTable';
import BuildingTable from './Formstabs/BuildingTable';
import FormUpdateModal from '../components/Modals/FormUpdateModal';

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuildingTable, setShowBuildingTable] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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
      setLastRefresh(new Date());
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

  const handleInfoClick = () => {
    if (selectedForm) {
      const kind = typeof selectedForm.kind === 'string'
        ? parseInt(selectedForm.kind)
        : selectedForm.kind;

      if (kind === 2) {
        setShowBuildingTable(true);
      } else {
        alert('Building details are only available for forms with kind = 2');
      }
    } else {
      alert('Please select a form to view details');
    }
  };

  const confirmDelete = () => {
    if (selectedForm) {
      const success = FormDataLocalStorage.deleteFormData(selectedForm.id);
      if (success) {
        const updatedForms = formData.filter(form => form.id !== selectedForm.id);
        setFormData(updatedForms);
        setSelectedForm(null);
        setShowDeleteAlert(false);
      } else {
        alert('Error deleting form');
      }
    }
  };

  const handleRowClick = (rowData: any) => {
    setSelectedForm(rowData);
  };

  const handleBackToForms = () => {
    setShowBuildingTable(false);
    loadFormData();
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

  if (showBuildingTable && selectedForm) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Building Details</IonTitle>
            <IonButton slot="end" onClick={handleBackToForms}>
              Back to Forms
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <BuildingTable
          form_id={selectedForm.id}
          declarant={selectedForm.declarantId?.toString() || ''}
          onBack={handleBackToForms}
          kind={selectedForm.kind || ''}
          classification={selectedForm.classification || ''}
          area={selectedForm.area || 0}
          actual_use={selectedForm.actualUse || ''}
        />
      </IonPage>
    );
  }

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

          <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header={'Confirm Delete'}
            message={'Are you sure you want to delete this form? This action cannot be undone.'}
            buttons={[
              { text: 'Cancel', role: 'cancel' },
              { text: 'Delete', role: 'destructive', handler: confirmDelete }
            ]}
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