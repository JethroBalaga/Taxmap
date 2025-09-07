// src/utils/Geolocator.ts
import { Geolocation } from '@capacitor/geolocation';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class Geolocator {
  // Check if geolocation is available
  static async isAvailable(): Promise<boolean> {
    try {
      await Geolocation.checkPermissions();
      return true;
    } catch {
      return false;
    }
  }

  // Get current position using Capacitor
  static async getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationPosition> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 30000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? null,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
        timestamp: position.timestamp
      };
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Watch position changes
  static async watchPosition(
    callback: (position: GeolocationPosition) => void,
    options: GeolocationOptions = {}
  ): Promise<string> {
    try {
      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 30000,
      }, (position, error) => {
        if (error) {
          console.error('Watch position error:', error);
          return;
        }
        
        if (position) {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
            timestamp: position.timestamp
          });
        }
      });

      return watchId;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Stop watching position
  static async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  }

  // Request location permissions
  static async requestPermissions(): Promise<{ location: string }> {
    try {
      return await Geolocation.requestPermissions();
    } catch (error: any) {
      throw new Error('Failed to request location permissions: ' + error.message);
    }
  }

  // Check current permissions
  static async checkPermissions(): Promise<{ location: string }> {
    try {
      return await Geolocation.checkPermissions();
    } catch (error: any) {
      throw new Error('Failed to check permissions: ' + error.message);
    }
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Check if coordinates are valid
  static isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  // Convert decimal degrees to degrees, minutes, seconds
  static toDMS(coord: number, isLatitude: boolean): string {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

    const direction = isLatitude
      ? coord >= 0 ? 'N' : 'S'
      : coord >= 0 ? 'E' : 'W';

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }

  // Get error message from geolocation error
  private static getErrorMessage(error: any): string {
    if (error.message?.includes('permission')) {
      return 'Location access denied. Please enable location permissions in app settings.';
    }
    if (error.message?.includes('unavailable')) {
      return 'Location services are unavailable. Please check your device settings.';
    }
    if (error.message?.includes('timeout')) {
      return 'Location request timed out. Please try again.';
    }
    return error.message || 'Unknown error occurred while getting location';
  }

  // Get formatted coordinates
  static getFormattedCoordinates(latitude: number, longitude: number): string {
    return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
  }
}