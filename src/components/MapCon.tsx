import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline'; // offline plugin
import localforage from 'localforage';
import { useIonViewWillEnter } from '@ionic/react';
import Form from './Modals/Form';
import { PhotoTagLocalStorage, PhotoTagData } from '../utils/tablestorages/PhotoTagLocalStorage';
import { FormDataLocalStorage } from '../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../utils/tablestorages/ValueInfoLocalStorage';
import { getMarkerIconByKind } from '../utils/markerIcons';
import MapMarkerPopup from './MapMarkerPopup';
import '../CSS/Map.css';

// Import marker icons for filter panel
import buildingMarkerIconUrl from '../assets/Building.png';
import equipmentMarkerIconUrl from '../assets/Equipment.png';
import landMarkerIconUrl from '../assets/Land.png';

const OPENSTREETMAP_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),
  L.latLng(8.45, 124.95)
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 22;
const CREATE_OUTLINE_PATH = "M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48M336 64h112v112M224 288L440 72";

// Update the MapCon props interface
interface MapConProps {
  searchQuery?: string;
}

// Satellite Toggle Control Component
const SatelliteToggleControl = ({ 
  isSatelliteView, 
  onToggle 
}: { 
  isSatelliteView: boolean;
  onToggle: () => void;
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control satellite-toggle-container');
        const button = L.DomUtil.create('button', 'satellite-toggle-btn', container);
        button.type = 'button';
        button.title = isSatelliteView ? 'Switch to Standard Map' : 'Switch to Satellite View';
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="${isSatelliteView ? 
              'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z' :
              'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z'
            }"/>
          </svg>
          <span>${isSatelliteView ? 'Map' : 'Satellite'}</span>
        `;
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          onToggle();
        });
        
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    
    return () => controlRef.current?.remove();
  }, [map, isSatelliteView, onToggle]);

  return null;
};

// Create Button Component
const CreateOutlineControl = ({ onClick }: { onClick: () => void }) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control');
        const link = L.DomUtil.create('a', 'create-outline-btn', container);
        link.href = '#';
        link.title = 'Create New Location';
        link.innerHTML = `
          <svg viewBox="0 0 512 512" width="20" height="20">
            <path fill="currentColor" d="${CREATE_OUTLINE_PATH}"/>
          </svg>
        `;
        L.DomEvent.on(link, 'click', (e) => {
          L.DomEvent.stop(e);
          onClick();
        });
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    return () => controlRef.current?.remove();
  }, [map, onClick]);

  return null;
};

// Filter Control Component
const FilterControl = ({ 
  onFilterChange,
  currentFilter,
  photoTags
}: { 
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  photoTags: PhotoTagData[];
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [markerCounts, setMarkerCounts] = useState({
    all: 0,
    land: 0,
    building: 0,
    equipment: 0
  });

  // Count markers by type
  const getMarkerCounts = useCallback(async () => {
    const counts = {
      all: photoTags.length,
      land: 0,
      building: 0,
      equipment: 0
    };

    for (const tag of photoTags) {
      try {
        const valueInfo = await ValueInfoLocalStorage.getValueInfoByPhotoTagId(tag.id);
        if (valueInfo) {
          const formData = await FormDataLocalStorage.getFormData(valueInfo.formDataId);
          if (formData && formData.kind) {
            const kindStr = String(formData.kind).trim();
            switch (kindStr) {
              case '1':
              case 'LAND':
              case 'land':
                counts.land++;
                break;
              case '2':
              case 'BUILDING':
              case 'building':
                counts.building++;
                break;
              case '3':
              case 'MACHINERY':
              case 'machinery':
              case 'EQUIPMENT':
              case 'equipment':
                counts.equipment++;
                break;
            }
          }
        }
      } catch (error) {
        console.log(`Error counting marker for ${tag.id}:`, error);
      }
    }

    return counts;
  }, [photoTags]);

  useEffect(() => {
    const loadCounts = async () => {
      const counts = await getMarkerCounts();
      setMarkerCounts(counts);
    };
    loadCounts();
  }, [getMarkerCounts]);

  useEffect(() => {
    let closePanel: (e: MouseEvent) => void;

    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control filter-toggle-container');
        
        // Filter button
        const button = L.DomUtil.create('button', 'filter-toggle-btn', container);
        button.type = 'button';
        button.title = 'Filter Markers';
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
          </svg>
          <span>Filter</span>
        `;
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          setShowFilterPanel(!showFilterPanel);
        });

        // Filter panel
        const panel = L.DomUtil.create('div', 'filter-panel');
        panel.style.display = showFilterPanel ? 'block' : 'none';
        panel.innerHTML = `
          <div class="filter-options">
            <div class="filter-section">
              <div class="filter-section-title">Show Markers</div>
              <button class="filter-option ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                <span class="filter-label">All Markers</span>
                <span class="filter-badge">${markerCounts.all}</span>
              </button>
            </div>
            <div class="filter-section">
              <div class="filter-section-title">By Type</div>
              <div class="filter-fan">
                <button class="filter-option ${currentFilter === 'land' ? 'active' : ''}" data-filter="land">
                  <img src="${landMarkerIconUrl}" alt="Land" class="filter-icon">
                  <span class="filter-label">Land</span>
                  <span class="filter-badge">${markerCounts.land}</span>
                </button>
                <button class="filter-option ${currentFilter === 'building' ? 'active' : ''}" data-filter="building">
                  <img src="${buildingMarkerIconUrl}" alt="Building" class="filter-icon">
                  <span class="filter-label">Building</span>
                  <span class="filter-badge">${markerCounts.building}</span>
                </button>
                <button class="filter-option ${currentFilter === 'equipment' ? 'active' : ''}" data-filter="equipment">
                  <img src="${equipmentMarkerIconUrl}" alt="Equipment" class="filter-icon">
                  <span class="filter-label">Equipment</span>
                  <span class="filter-badge">${markerCounts.equipment}</span>
                </button>
              </div>
            </div>
          </div>
        `;

        // Add click handlers for filter options
        L.DomEvent.on(panel, 'click', (e) => {
          const target = e.target as HTMLElement;
          const filterOption = target.closest('.filter-option') as HTMLElement;
          if (filterOption && filterOption.dataset.filter) {
            L.DomEvent.stop(e);
            onFilterChange(filterOption.dataset.filter);
            setShowFilterPanel(false);
          }
        });

        container.appendChild(panel);
        
        // Close panel when clicking outside
        closePanel = (e: MouseEvent) => {
          if (!container.contains(e.target as Node)) {
            setShowFilterPanel(false);
          }
        };
        
        document.addEventListener('click', closePanel);
        
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    
    return () => {
      document.removeEventListener('click', closePanel);
      controlRef.current?.remove();
    };
  }, [map, showFilterPanel, currentFilter, markerCounts, onFilterChange]);

  // Update panel visibility when state changes
  useEffect(() => {
    if (controlRef.current) {
      const container = controlRef.current.getContainer();
      const panel = container?.querySelector('.filter-panel');
      if (panel) {
        panel.style.display = showFilterPanel ? 'block' : 'none';
      }
    }
  }, [showFilterPanel]);

  return null;
};

// Photo Markers Component
const PhotoMarkers: React.FC<{
  photoTags: PhotoTagData[];
  onMarkerClick: (photoTagId: string) => void;
}> = ({ photoTags, onMarkerClick }) => {
  const [markerIcons, setMarkerIcons] = useState<{[key: string]: L.Icon}>({});

  useEffect(() => {
    const loadMarkerIcons = async () => {
      const icons: {[key: string]: L.Icon} = {};
      for (const tag of photoTags) {
        try {
          const valueInfo = await ValueInfoLocalStorage.getValueInfoByPhotoTagId(tag.id);
          if (valueInfo) {
            const formData = await FormDataLocalStorage.getFormData(valueInfo.formDataId);
            if (formData && formData.kind) {
              console.log(`PhotoTag ${tag.id}: Found form data with kind:`, formData.kind);
              icons[tag.id] = getMarkerIconByKind(formData.kind);
              continue;
            }
          }
        } catch (error) {
          console.log(`PhotoTag ${tag.id}: Error loading form data:`, error);
        }
        // Default icon if no form data or kind found
        console.log(`PhotoTag ${tag.id}: Using default Land icon`);
        icons[tag.id] = getMarkerIconByKind('1');
      }
      setMarkerIcons(icons);
    };

    loadMarkerIcons();
  }, [photoTags]);

  return (
    <>
      {photoTags.map((tag) => (
        <Marker
          key={tag.id}
          position={[tag.latitude, tag.longitude]}
          icon={markerIcons[tag.id] || getMarkerIconByKind('1')}
          eventHandlers={{
            click: () => onMarkerClick(tag.id)
          }}
        />
      ))}
    </>
  );
};

// Component to set up the map logic
const MapLogic = ({ 
  onOpenForm, 
  isSatelliteView, 
  onToggleSatellite 
}: { 
  onOpenForm: () => void;
  isSatelliteView: boolean;
  onToggleSatellite: () => void;
}) => {
  const map = useMap();
  const tileLayerRef = useRef<any>(null);
  const [allowZoomOut, setAllowZoomOut] = useState(false);

  useEffect(() => {
    // LocalForage config
    localforage.config({
      driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
      name: 'ManoloFortichMap',
      storeName: 'map_tiles'
    });

    // Add Offline Tile Layer - use the current view type
    const currentTileUrl = isSatelliteView ? SATELLITE_URL : OPENSTREETMAP_URL;
    const offlineLayer = (L.tileLayer as any).offline(currentTileUrl, {
      attribution: isSatelliteView 
        ? 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true,
      minZoom: MIN_ZOOM_LOCKED,
      maxZoom: MAX_ZOOM,
      maxNativeZoom: 18
    });

    offlineLayer.on('tileloadend', (e: any) => {
      if (offlineLayer.saveTile) {
        offlineLayer.saveTile(e.tile);
      }
    });

    offlineLayer.addTo(map);
    tileLayerRef.current = offlineLayer;

    // Initial map view and restriction
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    const enforceRestrictions = () => {
      const currentZoom = map.getZoom();

      if (currentZoom > DEFAULT_ZOOM) {
        setAllowZoomOut(true);
      }

      if (!allowZoomOut && currentZoom < DEFAULT_ZOOM) {
        map.setZoom(DEFAULT_ZOOM);
      } else if (allowZoomOut && currentZoom < MIN_ZOOM_UNLOCKED) {
        map.setZoom(MIN_ZOOM_UNLOCKED);
      }

      if (!manoloFortichBounds.contains(map.getCenter())) {
        map.panInsideBounds(manoloFortichBounds, { animate: false });
      }
    };

    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      offlineLayer.remove();
    };
  }, [map, allowZoomOut, isSatelliteView]);

  return (
    <>
      <SatelliteToggleControl 
        isSatelliteView={isSatelliteView} 
        onToggle={onToggleSatellite} 
      />
    </>
  );
};

// Main Map Component
const MapCon: React.FC<MapConProps> = ({ searchQuery = '' }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoTags, setPhotoTags] = useState<PhotoTagData[]>([]);
  const [selectedPhotoTagId, setSelectedPhotoTagId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [filteredPhotoTags, setFilteredPhotoTags] = useState<PhotoTagData[]>([]);
  const [searchedPhotoTags, setSearchedPhotoTags] = useState<PhotoTagData[]>([]);

  // Use a useCallback to memoize the loading function
  const loadPhotoTags = useCallback(async () => {
    const tags = await PhotoTagLocalStorage.getAllPhotoTags();
    console.log('Loaded photo tags:', tags.length, 'tags:', tags);
    setPhotoTags(tags);
    setFilteredPhotoTags(tags); // Initially show all
    setSearchedPhotoTags(tags); // Initially show all
  }, []);

  // Use useIonViewWillEnter to refresh data whenever the view is navigated to
  useIonViewWillEnter(() => {
    loadPhotoTags();
  });

  // useEffect for initial mount/unmount logic
  useEffect(() => {
    setIsMounted(true);
    
    // Add event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      setIsMounted(false);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter photo tags based on current filter
  useEffect(() => {
    const filterTags = async () => {
      if (currentFilter === 'all') {
        setFilteredPhotoTags(photoTags);
        return;
      }

      const filtered = [];
      for (const tag of photoTags) {
        try {
          const valueInfo = await ValueInfoLocalStorage.getValueInfoByPhotoTagId(tag.id);
          if (valueInfo) {
            const formData = await FormDataLocalStorage.getFormData(valueInfo.formDataId);
            if (formData && formData.kind) {
              const kindStr = String(formData.kind).trim();
              
              const matchesFilter = 
                (currentFilter === 'land' && 
                  (kindStr === '1' || kindStr === 'LAND' || kindStr === 'land')) ||
                (currentFilter === 'building' && 
                  (kindStr === '2' || kindStr === 'BUILDING' || kindStr === 'building')) ||
                (currentFilter === 'equipment' && 
                  (kindStr === '3' || kindStr === 'MACHINERY' || kindStr === 'machinery' || 
                   kindStr === 'EQUIPMENT' || kindStr === 'equipment'));
              
              if (matchesFilter) {
                filtered.push(tag);
              }
            }
          }
        } catch (error) {
          console.log(`Error filtering tag ${tag.id}:`, error);
        }
      }
      setFilteredPhotoTags(filtered);
    };

    filterTags();
  }, [photoTags, currentFilter]);

  // Search functionality - without remarks
  useEffect(() => {
    const searchProperties = async () => {
      if (!searchQuery.trim()) {
        setSearchedPhotoTags(filteredPhotoTags);
        return;
      }

      const query = searchQuery.toLowerCase().trim();
      const searched = [];

      for (const tag of filteredPhotoTags) {
        try {
          const valueInfo = await ValueInfoLocalStorage.getValueInfoByPhotoTagId(tag.id);
          if (valueInfo) {
            const formData = await FormDataLocalStorage.getFormData(valueInfo.formDataId);
            if (formData) {
              // Search in form data fields (without remarks)
              const matchesSearch = 
                (formData.id && String(formData.id).toLowerCase().includes(query)) ||
                (formData.kind && String(formData.kind).toLowerCase().includes(query)) ||
                (formData.classification && String(formData.classification).toLowerCase().includes(query)) ||
                (formData.area && String(formData.area).includes(query));
              // Removed remarks field completely

              if (matchesSearch) {
                searched.push(tag);
                continue;
              }
            }
          }

          // Search in photo tag metadata
          const tagMatchesSearch =
            (tag.id && String(tag.id).toLowerCase().includes(query)) ||
            (tag.photoName && String(tag.photoName).toLowerCase().includes(query)) ||
            (tag.latitude && String(tag.latitude).includes(query)) ||
            (tag.longitude && String(tag.longitude).includes(query));

          if (tagMatchesSearch) {
            searched.push(tag);
          }
        } catch (error) {
          console.log(`Error searching tag ${tag.id}:`, error);
        }
      }

      setSearchedPhotoTags(searched);
    };

    searchProperties();
  }, [filteredPhotoTags, searchQuery]);

  const handleFormDismiss = () => {
    setShowForm(false);
    loadPhotoTags();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadPhotoTags();
  };

  const handleMarkerClick = (photoTagId: string) => {
    setSelectedPhotoTagId(photoTagId);
  };

  const handleToggleSatellite = () => {
    setIsSatelliteView(!isSatelliteView);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    console.log(`Filter changed to: ${filter}`);
  };

  const currentTileUrl = isSatelliteView ? SATELLITE_URL : OPENSTREETMAP_URL;
  const currentAttribution = isSatelliteView 
    ? 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="map-content" style={{ height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {isMounted && (
        <>
          <MapContainer
            center={[8.35985, 124.869077]}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            minZoom={MIN_ZOOM_LOCKED}
            maxZoom={MAX_ZOOM}
            maxBounds={manoloFortichBounds}
            maxBoundsViscosity={1.0}
          >
            {/* Base tile layer */}
            <TileLayer
              url={currentTileUrl}
              attribution={currentAttribution}
              maxNativeZoom={18}
              maxZoom={MAX_ZOOM}
            />
            
            {/* Display searched photo markers */}
            <PhotoMarkers
              photoTags={searchedPhotoTags}
              onMarkerClick={handleMarkerClick}
            />
            
            <MapLogic 
              onOpenForm={() => setShowForm(true)} 
              isSatelliteView={isSatelliteView}
              onToggleSatellite={handleToggleSatellite}
            />

            {/* Filter Control FIRST (will appear ABOVE) */}
            <FilterControl 
              onFilterChange={handleFilterChange}
              currentFilter={currentFilter}
              photoTags={photoTags}
            />

            {/* Create Button SECOND (will appear BELOW) */}
            <CreateOutlineControl onClick={() => setShowForm(true)} />
          </MapContainer>

          {/* Internet status notification */}
          {!isOnline && (
            <div className="internet-status">
              <span>⚠️ No internet connection. Map may not display correctly.</span>
            </div>
          )}

          <Form
            isOpen={showForm}
            onDismiss={handleFormDismiss}
            onSuccess={handleFormSuccess}
          />

          {/* Popup overlay and content */}
          {selectedPhotoTagId && (
            <>
              <div className="popup-overlay" onClick={() => setSelectedPhotoTagId(null)} />
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                width: '90%',
                maxWidth: '400px'
              }}>
                <MapMarkerPopup
                  photoTagId={selectedPhotoTagId}
                  onClose={() => setSelectedPhotoTagId(null)}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MapCon;