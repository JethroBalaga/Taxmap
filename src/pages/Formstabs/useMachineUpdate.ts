// src/hooks/useMachineUpdate.ts
import { useState } from 'react';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { CalculatedMachineData } from './useMachineryData';

export const useMachineUpdate = (loadMachineryData: () => void) => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState<MachineData | null>(null);
  const [selectedValueInfoId, setSelectedValueInfoId] = useState<string>('');

  const handleUpdateClick = (machineData: CalculatedMachineData, valueInfoId: string) => {
    const baseMachineData: MachineData = {
      valueInfoId: machineData.valueInfoId,
      selectedEquipment: machineData.selectedEquipment,
      serialNo: machineData.serialNo,
      machineDescription: machineData.machineDescription,
      brandModel: machineData.brandModel,
      condition: machineData.condition,
      machineDetails: machineData.machineDetails,
      purchaseType: machineData.purchaseType,
      dateAcquired: machineData.dateAcquired,
      dateInstalled: machineData.dateInstalled,
      dateOperated: machineData.dateOperated,
      yearsUsed: machineData.yearsUsed,
      estimatedLife: machineData.estimatedLife,
      numberOfUnits: machineData.numberOfUnits,
      originalCost: machineData.originalCost,
      freight: machineData.freight,
      insurance: machineData.insurance,
      installation: machineData.installation,
      others: machineData.others,
      depreciation: machineData.depreciation
    };
    
    setSelectedMachineData(baseMachineData);
    setSelectedValueInfoId(valueInfoId);
    setUpdateModalOpen(true);
  };

  const handleMachineUpdate = async (updatedData: MachineData, valueInfoId: string) => {
    try {
      const success = MachineDataLocalStorage.updateMachineData(valueInfoId, updatedData);
      if (success) {
        console.log('Machine data updated successfully');
        setUpdateModalOpen(false);
        loadMachineryData();
      } else {
        console.error('Failed to update machine data');
      }
    } catch (error) {
      console.error('Error updating machine data:', error);
    }
  };

  return {
    updateModalOpen,
    selectedMachineData,
    selectedValueInfoId,
    handleUpdateClick,
    handleMachineUpdate,
    setUpdateModalOpen
  };
};