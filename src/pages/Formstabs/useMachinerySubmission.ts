// src/hooks/useMachinerySubmission.ts
import { useState } from 'react';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { validateDate, validateNumber } from '../../utils/MachineryUtils';
import { CalculatedMachineData } from './useMachineryData';

export const useMachinerySubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

  const getPhotoFile = async (photoTag: any): Promise<Blob | null> => {
    try {
      const photoPath = `phototags/${photoTag.photoName}`;
      
      if (Capacitor.isNativePlatform()) {
        const file = await Filesystem.readFile({
          path: photoPath,
          directory: Directory.Data
        });
        const blob = await (await fetch(`data:image/jpeg;base64,${file.data}`)).blob();
        return blob;
      } else {
        const photoData = localStorage.getItem(photoTag.photoName);
        if (photoData && photoData.startsWith('data:')) {
          return await (await fetch(photoData)).blob();
        }
        if (photoTag.photoData) {
          return await (await fetch(photoTag.photoData)).blob();
        }
        if (photoTag.photoName && photoTag.photoName.startsWith('data:image')) {
          return await (await fetch(photoTag.photoName)).blob();
        }
      }
      console.warn('Photo not found for upload in any storage location', photoTag);
      return null;
    } catch (error) {
      console.error('Error getting photo file:', error);
      return null;
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleSubmit = async (formId: string, machineryData: { machineData: CalculatedMachineData, valueInfoId: string }[]) => {
    setIsSubmitting(true);
    showToastMessage('Starting machinery upload process...', 'warning');

    try {
      const formData = FormDataLocalStorage.getFormData(formId);
      if (!formData) throw new Error('Form data not found');
      if (formData.uploaded) throw new Error('Form already uploaded');

      for (const { machineData, valueInfoId } of machineryData) {
        const valueInfo = ValueInfoLocalStorage.getValueInfo(valueInfoId);
        if (!valueInfo) throw new Error(`ValueInfo not found for ${valueInfoId}`);

        const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
        if (!photoTag) throw new Error('Photo tag not found');

        const databaseTagId = await supabaseApi.insertPhoto({
          photo: photoTag.photoName,
          longitude: photoTag.longitude,
          latitude: photoTag.latitude,
          date_taken: validateDate(photoTag.timestamp ? photoTag.timestamp.toISOString().split('T')[0] : null)
        });
        if (!databaseTagId) throw new Error('Failed to insert photo record');

        const photoFile = await getPhotoFile(photoTag);
        if (photoFile) {
          const folderPath = `${databaseTagId}/${photoTag.photoName}`;
          const { error: uploadError } = await supabase.storage.from('tag-photos').upload(folderPath, photoFile, {
            contentType: 'image/jpeg',
            upsert: false
          });
          if (uploadError) {
            console.warn('Photo upload failed', uploadError);
            showToastMessage('Form submitted but photo upload failed', 'warning');
          }
        } else {
          showToastMessage('Form submitted but could not retrieve photo', 'warning');
        }

        let databaseFormId = formData.synced_id;
        if (!databaseFormId) {
          databaseFormId = await supabaseApi.insertForm({
            declarant_id: formData.declarantId || 0,
            kind_id: parseInt(formData.kind),
            class_id: formData.classification,
            area: formData.area.toString(),
            district_id: formData.district,
            actual_used_id: formData.actualUse,
            subclass_id: formData.subclass || null,
            status: 'New'
          });
          if (!databaseFormId) throw new Error('Failed to insert form');
        }

        const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

        await supabaseApi.insertMachineData(databaseValueInfoId, {
          selected_equipment: machineData.selectedEquipment || null,
          serial_no: machineData.serialNo || null,
          machine_description: machineData.machineDescription || null,
          brand_model: machineData.brandModel || null,
          condition: machineData.condition || null,
          machine_details: machineData.machineDetails || null,
          purchase_type: machineData.purchaseType || null,
          date_acquired: validateDate(machineData.dateAcquired),
          date_installed: validateDate(machineData.dateInstalled),
          date_operated: validateDate(machineData.dateOperated),
          years_used: validateNumber(machineData.yearsUsed),
          estimated_life: validateNumber(machineData.estimatedLife),
          number_of_units: validateNumber(machineData.numberOfUnits),
          original_cost: validateNumber(machineData.originalCost),
          freight: validateNumber(machineData.freight),
          insurance: validateNumber(machineData.insurance),
          installation: validateNumber(machineData.installation),
          others: validateNumber(machineData.others),
          depreciation: validateNumber(machineData.depreciation)
        });

        if (!formData.synced_id) {
          FormDataLocalStorage.markFormAsUploaded(formId, databaseFormId);
        }
      }

      showToastMessage('Machinery data submitted successfully! All data synchronized with server.', 'success');

    } catch (error: any) {
      console.error('Machinery upload failed:', error);
      showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    showToast,
    toastMessage,
    toastColor,
    handleSubmit,
    showToastMessage,
    setShowToast
  };
};