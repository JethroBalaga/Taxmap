import React, { useEffect } from 'react';
import { IonContent } from '@ionic/react';
import { EquipmentData } from '../../utils/equipmentLocalStorage';
import EquipmentFormSection from './EquipmentFormSection';
import Next from '../../components/GlobalComponent/Next';
import { FormData } from './MachineModal';

interface EquipmentFormProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: string) => void;
  equipmentOptions: EquipmentData[];
  isLoading: boolean;
  error: string | null;
  onNextClick: () => void;
  isFormValid: boolean;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  formData,
  onFormChange,
  equipmentOptions,
  isLoading,
  error,
  onNextClick,
  isFormValid
}) => {
  // Calculate remaining life when years used or estimated life changes
  useEffect(() => {
    if (formData.yearsUsed && formData.estimatedLife) {
      const remaining = (parseFloat(formData.estimatedLife) - parseFloat(formData.yearsUsed)).toFixed(1);
      onFormChange('remainingLife', remaining);
    }
  }, [formData.yearsUsed, formData.estimatedLife]);

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
  }, [formData.originalCost, formData.freight, formData.insurance, formData.installation, formData.others]);

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
  }, [formData.totalCost, formData.depreciation]);

  const handleEquipmentChange = (value: string) => {
    onFormChange('selectedEquipment', value);
    const equipment = equipmentOptions.find(e => e.equipment_id === value);
    if (equipment) {
      onFormChange('machineDescription', equipment.machine_type);
    }
  };

  const handleDepreciationChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    onFormChange('depreciation', numericValue);
  };

  // Enhanced form validation - require original cost
  const enhancedFormValid = isFormValid && formData.originalCost.trim() !== '';

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '16px'
      }}>
        {/* Equipment Selection Section */}
        <EquipmentFormSection title="Equipment Selection">
          <EquipmentFormSection.Select
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
        </EquipmentFormSection>

        {/* Equipment Details Section */}
        <EquipmentFormSection title="Equipment Details">
          <EquipmentFormSection.Input
            label="Serial No"
            required={true}
            value={formData.serialNo}
            placeholder="Enter serial number"
            onChange={(value) => onFormChange('serialNo', value)}
          />
          
          <EquipmentFormSection.Input
            label="Machine Type"
            value={formData.machineDescription}
            placeholder="Select equipment to auto-fill type"
            readonly={true}
          />
          
          <EquipmentFormSection.Input
            label="Brand/Model"
            value={formData.brandModel}
            placeholder="Enter brand and model"
            onChange={(value) => onFormChange('brandModel', value)}
          />
          
          <EquipmentFormSection.Select
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

          <EquipmentFormSection.Grid>
            <EquipmentFormSection.Input
              label="Years Used"
              value={formData.yearsUsed}
              placeholder="Enter years used"
              onChange={(value) => onFormChange('yearsUsed', value)}
              type="number"
            />
            <EquipmentFormSection.Input
              label="No. of Units"
              value={formData.numberOfUnits}
              placeholder="Enter number of units"
              onChange={(value) => onFormChange('numberOfUnits', value)}
              type="number"
            />
          </EquipmentFormSection.Grid>
        </EquipmentFormSection>

        {/* Machine Details Section */}
        <EquipmentFormSection title="Machine Details">
          <EquipmentFormSection.Input
            label="Machine Details"
            value={formData.machineDetails}
            placeholder="Enter machine details"
            onChange={(value) => onFormChange('machineDetails', value)}
          />
          
          <EquipmentFormSection.Select
            label="Purchase Type"
            value={formData.purchaseType}
            placeholder="Select purchase type"
            options={[
              { value: 'Locally Purchased', label: 'Locally Purchased' },
              { value: 'Internationally Purchased', label: 'Internationally Purchased' }
            ]}
            onChange={(value) => onFormChange('purchaseType', value)}
          />
        </EquipmentFormSection>

        {/* Date Information Section */}
        <EquipmentFormSection title="Date Information" className="date-section">
          <EquipmentFormSection.DateTime
            label="Date Acquired"
            value={formData.dateAcquired}
            onChange={(value) => onFormChange('dateAcquired', value)}
          />
          
          <EquipmentFormSection.DateTime
            label="Date Installed"
            value={formData.dateInstalled}
            onChange={(value) => onFormChange('dateInstalled', value)}
          />
          
          <EquipmentFormSection.DateTime
            label="Date Operated"
            value={formData.dateOperated}
            onChange={(value) => onFormChange('dateOperated', value)}
          />
        </EquipmentFormSection>

        {/* Life Metrics Section */}
        <EquipmentFormSection title="Life Metrics">
          <EquipmentFormSection.Grid>
            <EquipmentFormSection.Input
              label="Estimated Life (years)"
              value={formData.estimatedLife}
              placeholder="Enter estimated life"
              onChange={(value) => onFormChange('estimatedLife', value)}
              type="number"
            />
            <EquipmentFormSection.Input
              label="Remaining Life (years)"
              value={formData.remainingLife}
              placeholder="Auto-calculated"
              readonly={true}
            />
          </EquipmentFormSection.Grid>
        </EquipmentFormSection>

        {/* Financial Information Section */}
        <EquipmentFormSection title="Financial Information">
          <EquipmentFormSection.Input
            label="Original Cost ($)"
            required={true}
            value={formData.originalCost}
            placeholder="Enter original cost"
            onChange={(value) => onFormChange('originalCost', value)}
            type="number"
          />

          <EquipmentFormSection.Grid>
            <EquipmentFormSection.Input
              label="Freight ($)"
              value={formData.freight}
              placeholder="Shipping cost"
              onChange={(value) => onFormChange('freight', value)}
              type="number"
            />
            <EquipmentFormSection.Input
              label="Insurance ($)"
              value={formData.insurance}
              placeholder="Insurance cost"
              onChange={(value) => onFormChange('insurance', value)}
              type="number"
            />
          </EquipmentFormSection.Grid>

          <EquipmentFormSection.Grid>
            <EquipmentFormSection.Input
              label="Installation ($)"
              value={formData.installation}
              placeholder="Installation cost"
              onChange={(value) => onFormChange('installation', value)}
              type="number"
            />
            <EquipmentFormSection.Input
              label="Others ($)"
              value={formData.others}
              placeholder="Other costs"
              onChange={(value) => onFormChange('others', value)}
              type="number"
            />
          </EquipmentFormSection.Grid>

          <EquipmentFormSection.Input
            label="Total Cost ($)"
            value={formData.totalCost}
            placeholder="Auto-calculated"
            readonly={true}
            bold={true}
          />

          <EquipmentFormSection.Grid>
            <EquipmentFormSection.Input
              label="Depreciation (%)"
              value={formData.depreciation}
              placeholder="Enter percentage"
              onChange={handleDepreciationChange}
              type="number"
            />
            <EquipmentFormSection.Input
              label="Adjusted Market Value ($)"
              value={formData.adjustedMarketValue}
              placeholder="Auto-calculated"
              readonly={true}
              bold={true}
            />
          </EquipmentFormSection.Grid>
        </EquipmentFormSection>
      </div>

      {/* Next Button */}
      <div className="next-btn-container">
        <Next onClick={onNextClick} disabled={!enhancedFormValid} />
      </div>
    </>
  );
};

export default EquipmentForm;