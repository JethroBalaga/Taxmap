import React, { useState } from 'react';
import { IonGrid, IonRow, IonCol, IonItem } from '@ionic/react';
import './../../CSS/DynamicTable.css'; // Create this file for styling

interface DynamicTableProps {
  data: any[];
  title?: string;
  keyField?: string;
  onRowClick?: (rowData: any) => void;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ 
  data, 
  title, 
  keyField = 'id',
  onRowClick 
}) => {
  const [selectedRow, setSelectedRow] = useState<string | number | null>(null);

  if (!data || data.length === 0) {
    return <IonItem>No data available</IonItem>;
  }

  const columns = Object.keys(data[0]);

  const handleRowClick = (rowKey: string | number, rowData: any) => {
    setSelectedRow(rowKey);
    if (onRowClick) {
      onRowClick(rowData);
    }
  };

  return (
    <div className="dynamic-table">
      {title && <h2>{title}</h2>}
      
      <IonGrid>
        <IonRow className="header-row">
          {columns.map((col) => (
            <IonCol key={`header-${col}`}>
              <strong>{col.replace(/_/g, ' ')}</strong>
            </IonCol>
          ))}
        </IonRow>

        {data.map((item) => (
          <IonRow 
            key={item[keyField]}
            className={`data-row ${selectedRow === item[keyField] ? 'selected' : ''}`}
            onClick={() => handleRowClick(item[keyField], item)}
          >
            {columns.map((col) => (
              <IonCol key={`${item[keyField]}-${col}`}>
                {String(item[col])}
              </IonCol>
            ))}
          </IonRow>
        ))}
      </IonGrid>
    </div>
  );
};

export default DynamicTable;