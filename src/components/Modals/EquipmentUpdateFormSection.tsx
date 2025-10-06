import React from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonDatetime
} from '@ionic/react';

// Reuse interfaces from your existing EquipmentFormSection
interface FieldOption {
  value: string;
  label: string;
}

interface BaseFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  value: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password';
  bold?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  options: FieldOption[];
  onChange?: (value: string) => void;
}

interface DateTimeFieldProps extends BaseFieldProps {
  value: string;
  onChange?: (value: string) => void;
}

interface EquipmentUpdateFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Main component
const EquipmentUpdateFormSection: React.FC<EquipmentUpdateFormSectionProps> & {
  Input: React.FC<InputFieldProps>;
  Select: React.FC<SelectFieldProps>;
  DateTime: React.FC<DateTimeFieldProps>;
  Grid: React.FC<{ children: React.ReactNode }>;
} = ({ title, children, className }) => {
  return (
    <div className={`form-section ${className || ''}`}>
      <h3 className="section-title">{title}</h3>
      {children}
    </div>
  );
};

// Input Component
const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  placeholder,
  required,
  onChange,
  type = 'text',
  readonly,
  bold
}) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </IonLabel>
    <IonInput
      value={value}
      type={type}
      placeholder={placeholder}
      onIonInput={e => onChange?.(e.detail.value!)}
      className="modal-input"
      readonly={readonly}
      style={{ 
        opacity: readonly ? 0.7 : 1,
        fontWeight: bold ? 'bold' : 'normal',
        color: bold ? '#2c3e50' : 'inherit'
      }}
    />
  </IonItem>
);

// Select Component
const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  placeholder,
  required,
  options,
  onChange,
  disabled
}) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </IonLabel>
    <IonSelect
      value={value}
      placeholder={placeholder}
      onIonChange={e => onChange?.(e.detail.value)}
      interface="popover"
      className="modal-input"
      disabled={disabled}
    >
      {options.map((option) => (
        <IonSelectOption key={option.value} value={option.value}>
          {option.label}
        </IonSelectOption>
      ))}
    </IonSelect>
  </IonItem>
);

// DateTime Component
const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  value,
  placeholder,
  required,
  onChange
}) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </IonLabel>
    <IonDatetime
      value={value}
      onIonChange={e => onChange?.(e.detail.value as string)}
      presentation="date"
      className="modal-input"
    />
  </IonItem>
);

// Grid Component
const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '12px' 
  }}>
    {children}
  </div>
);

// Attach sub-components
EquipmentUpdateFormSection.Input = InputField;
EquipmentUpdateFormSection.Select = SelectField;
EquipmentUpdateFormSection.DateTime = DateTimeField;
EquipmentUpdateFormSection.Grid = Grid;

export default EquipmentUpdateFormSection;