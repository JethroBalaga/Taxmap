// src/pages/hooks/useAgriculturalSubmission.ts
import { useState } from 'react';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { AgriculturalDataLocalStorage } from '../../utils/tablestorages/AgriculturalDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const validateNumber = (value: string | null): number | null => {
  if (!value || value === 'N/A') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const validateDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

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

const cleanupLocalPhotos = async (photoTag: any) => {
  try {
    const photoPath = `phototags/${photoTag.photoName}`;

    if (Capacitor.isNativePlatform()) {
      await Filesystem.deleteFile({
        path: photoPath,
        directory: Directory.Data
      });
      console.log('Local photo cleaned up successfully');
    } else {
      localStorage.removeItem(photoTag.photoName);
    }
  } catch (error) {
    console.warn('Could not clean up local photo:', error);
  }
};

export const useAgriculturalSubmission = (formId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleToastDismiss = () => {
    setShowToast(false);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    showToastMessage('Starting agricultural form upload process...', 'warning');

    try {
      const formData = FormDataLocalStorage.getFormData(formId);
      if (!formData) throw new Error('Form data not found');
      if (formData.uploaded) throw new Error('Form already uploaded');

      const valueInfo = ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
      if (!valueInfo) throw new Error('Value info not found');

      // CHANGED: Added await since getAgriculturalDataByValueInfoId is now async
      const agriData = await AgriculturalDataLocalStorage.getAgriculturalDataByValueInfoId(valueInfo.id);
      if (!agriData) throw new Error('Agricultural adjustment data not found');

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
        } else {
          await cleanupLocalPhotos(photoTag);
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
      if (!databaseValueInfoId) throw new Error('Failed to insert value info');

      const adjustmentSuccess = await supabaseApi.insertAgriLandAdjustment(databaseValueInfoId, {
        frontage: validateNumber(agriData.frontage),
        weather_road: validateNumber(agriData.weather_road),
        market: validateNumber(agriData.market)
      });

      if (!adjustmentSuccess) throw new Error('Failed to insert agricultural adjustment data');

      if (!formData.synced_id) {
        FormDataLocalStorage.markFormAsUploaded(formId, databaseFormId);
      }

      showToastMessage('Agricultural data submitted successfully! All data synchronized with server.', 'success');

    } catch (error: any) {
      console.error('Agricultural form upload failed:', error);
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
    onSubmit,
    handleToastDismiss
  };
};