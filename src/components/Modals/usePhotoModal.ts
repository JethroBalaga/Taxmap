import { useState, useEffect, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';
import { MachineData } from './MachineModal';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { MachineDataLocalStorage } from '../../utils/tablestorages/MachineDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { generateFileName, saveImageToStorage, adjustCoordinates } from '../../utils/photoModalUtils';

interface UsePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: string) => void;
  formData?: FormData;
  buildingData?: BuildingData;
  machineData?: MachineData;
  onSubmit?: (photo: string, formData: FormData, buildingData: BuildingData, machineData: MachineData) => Promise<void>;
  onCompleteSubmission?: () => void;
}

export const usePhotoModal = ({
  isOpen,
  onClose,
  onPhotoTaken,
  formData,
  buildingData,
  machineData,
  onSubmit,
  onCompleteSubmission
}: UsePhotoModalProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [adjustedLocation, setAdjustedLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [storedData, setStoredData] = useState<{
    formData: any;
    buildingData: any;
    machineData: any;
    photoTag: any;
    valueInfo: any;
  } | null>(null);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastButtons, setToastButtons] = useState<any[]>([]);
  const [photoName, setPhotoName] = useState<string>('');
  const [hasAttemptedLocation, setHasAttemptedLocation] = useState(false);

  // Check and create phototags directory when modal opens
  const checkAndCreateDirectory = useCallback(async () => {
    try {
      await Filesystem.readdir({
        path: 'phototags',
        directory: Directory.Data
      });
      console.log('phototags directory exists');
    } catch (error) {
      console.log('Creating phototags directory...');
      try {
        await Filesystem.mkdir({
          path: 'phototags',
          directory: Directory.Data,
          recursive: true
        });
        console.log('phototags directory created');
      } catch (mkdirError) {
        console.warn('Could not create phototags directory:', mkdirError);
      }
    }
  }, []);

  // Log the data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('PhotoModal opened with formData:', formData);
      console.log('PhotoModal opened with buildingData:', buildingData);
      console.log('PhotoModal opened with machineData:', machineData);
      setStoredData(null);
      setPhotoName(generateFileName());
      setHasAttemptedLocation(false);
      setAdjustedLocation(null);
      
      checkAndCreateDirectory().catch(console.error);
    }
  }, [isOpen, formData, buildingData, machineData, checkAndCreateDirectory]);

  const takePhoto = useCallback(async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
      });

      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        setPhotoName(generateFileName());
        setError(null);
        setLocationError(null);
        setCurrentLocation(null); // Reset location when taking a new photo
        setAdjustedLocation(null); // Reset adjusted location
        setHasAttemptedLocation(false); // Reset location attempt status
      } else {
        setError('No photo was taken.');
      }
    } catch (err) {
      setError('Failed to capture photo: ' + (err as Error).message);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);
      
      const position = await Geolocation.getCurrentPosition();
      
      if (!position?.coords) {
        throw new Error('Unable to get GPS coordinates');
      }

      const originalLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      setCurrentLocation(originalLocation);
      
      // Apply coordinate adjustment
      const adjustedCoords = adjustCoordinates(
        originalLocation.latitude, 
        originalLocation.longitude
      );
      
      setAdjustedLocation(adjustedCoords);
      setHasAttemptedLocation(true);
      
    } catch (err: any) {
      console.warn('Location error:', err);
      
      let errorMessage = 'Could not get location. Photo will be saved without coordinates.';
      
      if (err.message?.includes('permission')) {
        errorMessage = 'Location access denied. Please enable location permissions.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setLocationError(errorMessage);
      setCurrentLocation(null);
      setAdjustedLocation(null);
      setHasAttemptedLocation(true);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setPhoto(null);
    setError(null);
    setLocationError(null);
    setIsSubmitting(false);
    setIsGettingLocation(false);
    setCurrentLocation(null);
    setAdjustedLocation(null);
    setStoredData(null);
    setShowConfirmToast(false);
    setPhotoName('');
    setHasAttemptedLocation(false);
    onClose();
  }, [onClose]);

  const performSubmission = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!photo) {
        throw new Error('No photo to submit');
      }

      // Save the image to storage
      const imageUri = await saveImageToStorage(photo, photoName);
      console.log('Image saved at:', imageUri);
      
      let savedFormData = null;
      let savedBuildingData = null;
      let savedMachineData = null;
      let photoTag = null;
      let valueInfo = null;

      // 1. Store FormData (ALWAYS stored for all kinds)
      if (formData) {
        savedFormData = FormDataLocalStorage.saveFormData(formData);
        console.log('Form data saved:', savedFormData);
      }
      
      // 2. Store PhotoTag (ALWAYS stored for all kinds)
      // Use adjusted coordinates if available, otherwise use original or default
      const finalLatitude = adjustedLocation?.latitude || currentLocation?.latitude || 0;
      const finalLongitude = adjustedLocation?.longitude || currentLocation?.longitude || 0;
      
      photoTag = PhotoTagLocalStorage.addPhotoTag({
        photoName, // Use just the filename
        longitude: finalLongitude,
        latitude: finalLatitude,
        accuracy: currentLocation?.accuracy,
        timestamp: new Date()
      });
      console.log('Photo tag saved:', photoTag);

      // 3. Create ValueInfo entry (ALWAYS created for all kinds)
      if (savedFormData && photoTag) {
        valueInfo = ValueInfoLocalStorage.addValueInfo({
          formDataId: savedFormData.id,
          photoTagId: photoTag.id,
        });
        console.log('ValueInfo created:', valueInfo);

        // 4. Store BuildingData (ONLY if buildingData exists - Building kind)
        if (buildingData && valueInfo) {
          savedBuildingData = BuildingDataLocalStorage.saveBuildingData({
            ...buildingData,
            valueInfoId: valueInfo.id.toString() // Convert number to string
          });
          console.log('Building data saved:', savedBuildingData);
        }

        // 5. Store MachineData (ONLY if machineData exists - Machinery kind)
        if (machineData && valueInfo) {
          savedMachineData = MachineDataLocalStorage.saveMachineData({
            ...machineData,
            valueInfoId: valueInfo.id.toString() // Convert number to string
          });
          console.log('Machine data saved:', savedMachineData);
        }
      }

      // Store all data for display
      setStoredData({
        formData: savedFormData,
        buildingData: savedBuildingData,
        machineData: savedMachineData,
        photoTag: photoTag,
        valueInfo: valueInfo
      });

      // Call callbacks
      if (onSubmit && formData) {
        await onSubmit(photo, formData, buildingData!, machineData!);
      } else {
        onPhotoTaken(photo);
      }
      
      if (onCompleteSubmission) {
        onCompleteSubmission();
      }
      
      // Show success message
      setToastMessage('Data successfully saved! Image stored in phototags folder.');
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowConfirmToast(true);
      
    } catch (err: any) {
      setError('Submission failed: ' + err.message);
      console.error('Submission error:', err);
      
      // Show error message
      setToastMessage('Error saving data: ' + err.message);
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowConfirmToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [photo, photoName, formData, buildingData, machineData, currentLocation, adjustedLocation, onSubmit, onPhotoTaken, onCompleteSubmission]);

  const handleSubmit = useCallback(async () => {
    if (!photo) {
      setError('Please take a photo first');
      return;
    }

    // Show confirmation toast instead of immediately submitting
    setToastMessage('Are you sure you want to submit this photo and save all data?');
    setToastButtons([
      {
        text: 'No',
        role: 'cancel',
        handler: () => {
          console.log('Submission cancelled');
        }
      },
      {
        text: 'Yes',
        handler: async () => {
          await performSubmission();
        }
      }
    ]);
    setShowConfirmToast(true);
  }, [photo, performSubmission]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
    setLocationError(null);
    setCurrentLocation(null);
    setAdjustedLocation(null);
    setStoredData(null);
    setPhotoName(generateFileName());
    setHasAttemptedLocation(false);
  }, []);

  return {
    photo,
    error,
    isSubmitting,
    isGettingLocation,
    currentLocation,
    adjustedLocation,
    locationError,
    storedData,
    showConfirmToast,
    toastMessage,
    toastButtons,
    photoName,
    hasAttemptedLocation,
    takePhoto,
    getCurrentLocation,
    handleClose,
    handleSubmit,
    retakePhoto,
    setError,
    setShowConfirmToast
  };
};