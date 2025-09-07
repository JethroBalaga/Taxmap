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

export class Geolocator {
  // Get current position using Capacitor - SIMPLIFIED VERSION
  static async getCurrentPosition(): Promise<GeolocationPosition> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
      });

      if (!position?.coords) {
        throw new Error('Unable to get GPS coordinates');
      }

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
      console.error('Geolocation error:', error);
      throw new Error('Failed to get location: ' + error.message);
    }
  }

  // Request location permissions - SIMPLIFIED
  static async requestPermissions(): Promise<void> {
    try {
      await Geolocation.requestPermissions();
    } catch (error: any) {
      console.warn('Permission request failed:', error);
      // Don't throw error, just continue
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
}