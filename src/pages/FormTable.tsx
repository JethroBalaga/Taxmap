import React, { useState } from 'react';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonIcon
} from '@ionic/react';
import { arrowUpCircle, trash } from 'ionicons/icons';
import '../CSS/FormTable.css';

interface FormTableProps {
  data: any[];
  columns: { key: string; header: string }[];
  title: string;
  onRowClick?: (rowData: any) => void;
}

const FormTable: React.FC<FormTableProps> = ({
  data,
  columns,
  title,
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    !searchTerm.trim() ||
    columns.some(column => 
      String(item[column.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
    if (onRowClick) {
      onRowClick(rowData);
    }
  };

  const handleUpdateClick = () => {
    // Update functionality will be implemented later
    console.log('Update clicked for:', selectedRow);
  };

  const handleDeleteClick = () => {
    // Delete functionality will be implemented later
    console.log('Delete clicked for:', selectedRow);
  };

  return (
    <div className="form-table-container">
      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              placeholder={`Search ${title.toLowerCase()}...`}
              onIonInput={(e) => setSearchTerm(e.detail.value || '')}
              debounce={0}
              className="form-table-searchbar"
            />

            <div className="icon-group">
              <IonIcon
                icon={arrowUpCircle}
                className={`icon-yellow ${!selectedRow ? 'icon-disabled' : ''}`}
                onClick={selectedRow ? handleUpdateClick : undefined}
                title="Edit Item"
              />
              <IonIcon
                icon={trash}
                className={`icon-yellow ${!selectedRow ? 'icon-disabled' : ''}`}
                onClick={selectedRow ? handleDeleteClick : undefined}
                title="Delete Item"
              />
            </div>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12">
            <div className="table-wrapper">
              <table className="form-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => handleRowClick(item)}
                      className={selectedRow === item ? 'selected' : ''}
                    >
                      {columns.map((column) => (
                        <td key={column.key}>{item[column.key] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="no-data-message">
                  No {title.toLowerCase()} found
                </div>
              )}
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default FormTable;