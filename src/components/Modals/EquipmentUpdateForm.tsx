import React, { useEffect } from 'react';
import { IonContent } from '@ionic/react';
import { EquipmentData } from '../../utils/equipmentLocalStorage';
import EquipmentUpdateFormSection from './EquipmentUpdateFormSection';
import SubmitButton from '../../components/GlobalComponent/SubmitButton'; // Use your existing SubmitButton
import { FormData } from './MachineUpdateModal';

interface EquipmentUpdateFormProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: string) => void;
  equipmentOptions: EquipmentData[];
  isLoading: boolean;
  error: string | null;
  onUpdateClick: () => void;
  isFormValid: boolean;
  existingData?: any;
}

const EquipmentUpdateForm: React.FC<EquipmentUpdateFormProps> = ({
  formData,
  onFormChange,
  equipmentOptions,
  isLoading,
  error,
  onUpdateClick,
  isFormValid,
  existingData
}) => {
  // Calculate remaining life when years used or estimated life changes
  useEffect(() => {
    if (formData.yearsUsed && formData.estimatedLife) {
      const years = parseFloat(formData.yearsUsed);
      const life = parseFloat(formData.estimatedLife);
      if (!isNaN(years) && !isNaN(life)) {
        const remaining = (life - years).toFixed(1);
        onFormChange('remainingLife', remaining);
      }
    }
  }, [formData.yearsUsed, formData.estimatedLife, onFormChange]);

  // Calculate total cost when financial fields change
  useEffect(() => {
    const calculateTotalCost = () => {
      const cost = parseFloat(formData.originalCost) || 0;
      const freightCost = parseFloat(formData.freight) || 0;
      const insuranceCost = parseFloat(formData.insurance) || 0;
      const installationCost = parseFloat(formData.installation) || 0;
      const othersCost = parseFloat(formData.others) || 0;

      const total = cost + freightCost + insuranceCost + installationCost + othersCost;
      onFormChange('totalCost', total.toFixed(2));
    };

    calculateTotalCost();
  }, [formData.originalCost, formData.freight, formData.insurance, formData.installation, formData.others, onFormChange]);

  // Calculate adjusted market value when total cost or depreciation changes
  useEffect(() => {
    const calculateAdjustedMarketValue = () => {
      const total = parseFloat(formData.totalCost) || 0;
      const depreciationPercent = parseFloat(formData.depreciation) || 0;

      if (total > 0 && depreciationPercent > 0) {
        const depreciationAmount = total * (depreciationPercent / 100);
        const adjustedValue = total - depreciationAmount;
        onFormChange('adjustedMarketValue', adjustedValue.toFixed(2));
      } else {
        onFormChange('adjustedMarketValue', formData.totalCost);
      }
    };

    calculateAdjustedMarketValue();
  }, [formData.totalCost, formData.depreciation, onFormChange]);

  const handleEquipmentChange = (value: string) => {
    onFormChange('selectedEquipment', value);
    const equipment = equipmentOptions.find(e => e.equipment_id === value);
    if (equipment) {
      onFormChange('machineDescription', equipment.machine_type);
    }
  };

  const handleDepreciationChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onFormChange('depreciation', numericValue);
  };

  const getDepreciationDisplayValue = () => {
    if (!formData.depreciation) return '';
    return `${formData.depreciation}%`;
  };

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '16px'
      }}>
        {/* Equipment Selection Section */}
        <EquipmentUpdateFormSection title="Equipment Selection">
          <EquipmentUpdateFormSection.Select
            label="Equipment"
            required={true}
            value={formData.selectedEquipment}
            placeholder={
              isLoading
                ? "Loading equipment..."
                : error
                  ? "Failed to load equipment"
                  : "Select equipment"
            }
            options={equipmentOptions.map(eq => ({ value: eq.equipment_id, label: eq.equipment_id }))}
            onChange={handleEquipmentChange}
            disabled={isLoading || !!error || equipmentOptions.length === 0}
          />
        </EquipmentUpdateFormSection>

        {/* Equipment Details Section */}
        <EquipmentUpdateFormSection title="Equipment Details">
          <EquipmentUpdateFormSection.Input
            label="Serial No"
            required={true}
            value={formData.serialNo}
            placeholder="Enter serial number"
            onChange={(value) => onFormChange('serialNo', value)}
          />
          
          <EquipmentUpdateFormSection.Input
            label="Machine Type"
            value={formData.machineDescription}
            placeholder="Select equipment to auto-fill type"
            readonly={true}
          />
          
          <EquipmentUpdateFormSection.Input
            label="Brand/Model"
            value={formData.brandModel}
            placeholder="Enter brand and model"
            onChange={(value) => onFormChange('brandModel', value)}
          />
          
          <EquipmentUpdateFormSection.Select
            label="Condition"
            value={formData.condition}
            placeholder="Select condition"
            options={[
              { value: 'Excellent', label: 'Excellent' },
              { value: 'Good', label: 'Good' },
              { value: 'Fair', label: 'Fair' },
              { value: 'Poor', label: 'Poor' },
              { value: 'Needs Repair', label: 'Needs Repair' }
            ]}
            onChange={(value) => onFormChange('condition', value)}
          />

          <EquipmentUpdateFormSection.Grid>
            <EquipmentUpdateFormSection.Input
              label="Years Used"
              value={formData.yearsUsed}
              placeholder="Enter years used"
              onChange={(value) => onFormChange('yearsUsed', value)}
              type="number"
            />
            <EquipmentUpdateFormSection.Input
              label="No. of Units"
              value={formData.numberOfUnits}
              placeholder="Enter number of units"
              onChange={(value) => onFormChange('numberOfUnits', value)}
              type="number"
            />
          </EquipmentUpdateFormSection.Grid>
        </EquipmentUpdateFormSection>

        {/* Machine Details Section */}
        <EquipmentUpdateFormSection title="Machine Details">
          <EquipmentUpdateFormSection.Input
            label="Machine Details"
            value={formData.machineDetails}
            placeholder="Enter machine details"
            onChange={(value) => onFormChange('machineDetails', value)}
          />
          
          <EquipmentUpdateFormSection.Select
            label="Purchase Type"
            value={formData.purchaseType}
            placeholder="Select purchase type"
            options={[
              { value: 'Locally Purchased', label: 'Locally Purchased' },
              { value: 'Internationally Purchased', label: 'Internationally Purchased' }
            ]}
            onChange={(value) => onFormChange('purchaseType', value)}
          />
        </EquipmentUpdateFormSection>

        {/* Date Information Section */}
        <EquipmentUpdateFormSection title="Date Information" className="date-section">
          <EquipmentUpdateFormSection.DateTime
            label="Date Acquired"
            value={formData.dateAcquired}
            onChange={(value) => onFormChange('dateAcquired', value)}
          />
          
          <EquipmentUpdateFormSection.DateTime
            label="Date Installed"
            value={formData.dateInstalled}
            onChange={(value) => onFormChange('dateInstalled', value)}
          />
          
          <EquipmentUpdateFormSection.DateTime
            label="Date Operated"
            value={formData.dateOperated}
            onChange={(value) => onFormChange('dateOperated', value)}
          />
        </EquipmentUpdateFormSection>

        {/* Life Metrics Section */}
        <EquipmentUpdateFormSection title="Life Metrics">
          <EquipmentUpdateFormSection.Grid>
            <EquipmentUpdateFormSection.Input
              label="Estimated Life (years)"
              value={formData.estimatedLife}
              placeholder="Enter estimated life"
              onChange={(value) => onFormChange('estimatedLife', value)}
              type="number"
            />
            <EquipmentUpdateFormSection.Input
              label="Remaining Life (years)"
              value={formData.remainingLife}
              placeholder="Auto-calculated"
              readonly={true}
            />
          </EquipmentUpdateFormSection.Grid>
        </EquipmentUpdateFormSection>

        {/* Financial Information Section */}
        <EquipmentUpdateFormSection title="Financial Information">
          <EquipmentUpdateFormSection.Input
            label="Original Cost ($)"
            required={true}
            value={formData.originalCost}
            placeholder="Enter original cost"
            onChange={(value) => onFormChange('originalCost', value)}
            type="number"
          />

          <EquipmentUpdateFormSection.Grid>
            <EquipmentUpdateFormSection.Input
              label="Freight ($)"
              value={formData.freight}
              placeholder="Shipping cost"
              onChange={(value) => onFormChange('freight', value)}
              type="number"
            />
            <EquipmentUpdateFormSection.Input
              label="Insurance ($)"
              value={formData.insurance}
              placeholder="Insurance cost"
              onChange={(value) => onFormChange('insurance', value)}
              type="number"
            />
          </EquipmentUpdateFormSection.Grid>

          <EquipmentUpdateFormSection.Grid>
            <EquipmentUpdateFormSection.Input
              label="Installation ($)"
              value={formData.installation}
              placeholder="Installation cost"
              onChange={(value) => onFormChange('installation', value)}
              type="number"
            />
            <EquipmentUpdateFormSection.Input
              label="Others ($)"
              value={formData.others}
              placeholder="Other costs"
              onChange={(value) => onFormChange('others', value)}
              type="number"
            />
          </EquipmentUpdateFormSection.Grid>

          <EquipmentUpdateFormSection.Input
            label="Total Cost ($)"
            value={formData.totalCost}
            placeholder="Auto-calculated"
            readonly={true}
            bold={true}
          />

          <EquipmentUpdateFormSection.Grid>
            <EquipmentUpdateFormSection.Input
              label="Depreciation (%)"
              value={getDepreciationDisplayValue()}
              placeholder="Enter percentage"
              onChange={handleDepreciationChange}
            />
            <EquipmentUpdateFormSection.Input
              label="Adjusted Market Value ($)"
              value={formData.adjustedMarketValue}
              placeholder="Auto-calculated"
              readonly={true}
              bold={true}
            />
          </EquipmentUpdateFormSection.Grid>
        </EquipmentUpdateFormSection>
      </div>

      {/* Submit Button (using your existing SubmitButton) */}
      <div className="submit-btn-container">
        <SubmitButton 
          label="Update Equipment" 
          onClick={onUpdateClick} 
          disabled={!isFormValid}
          loading={false} // You can set this based on your update state
        />
      </div>
    </>
  );
};

export default EquipmentUpdateForm;