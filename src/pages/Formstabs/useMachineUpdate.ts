// src/hooks/useMachineUpdate.ts
import { useState } from 'react';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { CalculatedMachineData } from './useMachineryData';

export const useMachineUpdate = (loadMachineryData: () => void) => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMachineData, setSelectedMachineData] = useState<MachineData | null>(null);
  const [selectedValueInfoId, setSelectedValueInfoId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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
    setUpdateError(null); // Clear any previous errors
  };

  const handleMachineUpdate = async (updatedData: MachineData, valueInfoId: string) => {
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const result = await MachineDataLocalStorage.updateMachineData(valueInfoId, updatedData);
      if (result) {
        console.log('Machine data updated successfully');
        setUpdateModalOpen(false);
        loadMachineryData();
      } else {
        const errorMsg = 'Failed to update machine data - machine not found';
        console.error(errorMsg);
        setUpdateError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Error updating machine data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      setUpdateError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setUpdateError(null);
    setSelectedMachineData(null);
  };

  return {
    updateModalOpen,
    selectedMachineData,
    selectedValueInfoId,
    isUpdating,
    updateError,
    handleUpdateClick,
    handleMachineUpdate,
    setUpdateModalOpen: closeUpdateModal // Provide a more specific close function
  };
};