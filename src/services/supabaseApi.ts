import { supabase } from './../utils/supaBaseClient';

export interface FormData {
  declarant: string; // CHANGED: from declarant_id to declarant
  kind_id: number;
  class_id: string;
  area: string;
  district_id: number | null;
  actual_used_id: string | null;
  subclass_id: string | null;
  status: string | null;
}

export interface PhotoData {
  photo: string | null;
  longitude: number;
  latitude: number;
  date_taken: string | null;
}

export interface BuildingAdjustmentData {
  building_subcom_id: string;
  description: string;
  completion_percent: string;
  depreciation: string;
  area: number | null;
}

export interface GeneralDescriptionData {
  building_code: string;
  storey: number;
  floor_order: number;
  bld_age: string | null;
  bldg_permit: string | null;
  construction_percent: string | null;
  date_constructed: string | null;
  date_occupied: string | null;
  date_completed: string | null;
  depreciation_rate: string | null;
}

export interface MachineData {
  selected_equipment: string | null;
  serial_no: string | null;
  machine_description: string | null;
  brand_model: string | null;
  condition: string | null;
  machine_details: string | null;
  purchase_type: string | null;
  date_acquired: string | null;
  date_installed: string | null;
  date_operated: string | null;
  years_used: number | null;
  estimated_life: number | null;
  number_of_units: number | null;
  original_cost: number | null;
  freight: number | null;
  insurance: number | null;
  installation: number | null;
  others: number | null;
  depreciation: number | null;
}

export interface AgriLandAdjustmentData {
  frontage: number | null;
  weather_road: number | null;
  market: number | null;
}

export interface NonAgriAdjustmentData {
  adjustment_id: string;
  additional_factor?: number | null;
}

// Fixed helper function to validate and convert dates
const validateDate = (dateString: string | null | undefined): string | null => {
  if (dateString == null || dateString === '') return null;
  
  // Handle both string and other types
  const dateToValidate = typeof dateString === 'string' ? dateString : String(dateString);
  
  try {
    const date = new Date(dateToValidate);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// Fixed helper function to validate numbers - handles both strings and numbers
const validateNumber = (value: any): number | null => {
  // Handle null, undefined, empty strings, and invalid values
  if (value == null || value === '') return null;
  
  // If it's already a valid number, return it
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  // If it's a string, trim and parse
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }
  
  // For any other type, attempt conversion
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
};

export const supabaseApi = {
  /**
   * Insert a form and return the new form_id (UUID)
   */
  async insertForm(formData: FormData): Promise<string> {
    const { data, error } = await supabase.rpc('insert_form_and_return_id', {
      p_declarant: formData.declarant, // CHANGED: from p_declarant_id to p_declarant
      p_kind_id: formData.kind_id,
      p_class_id: formData.class_id,
      p_area: formData.area,
      p_district_id: formData.district_id,
      p_actual_used_id: formData.actual_used_id,
      p_subclass_id: formData.subclass_id,
      p_status: formData.status
    });

    if (error) throw error;
    return data; // UUID as string
  },

  /**
   * Insert a photo and return the new tag_id (UUID)
   */
  async insertPhoto(photoData: PhotoData): Promise<string> {
    const { data, error } = await supabase.rpc('insert_photo_and_return_id', {
      p_photo: photoData.photo,
      p_longitude: photoData.longitude,
      p_latitude: photoData.latitude,
      p_date_taken: photoData.date_taken
    });

    if (error) throw error;
    return data; // UUID as string
  },

  /**
   * Insert value_info and return value_info_id (UUID)
   */
  async insertValueInfo(form_id: string, tag_id: string): Promise<string> {
    const { data, error } = await supabase.rpc('insert_value_info_and_return_id', {
      p_form_id: form_id,
      p_tag_id: tag_id
    });

    if (error) throw error;
    return data; // UUID as string
  },

  /**
   * Insert general description for a value_info record
   */
  async insertGeneralDescription(value_info_id: string, data: GeneralDescriptionData): Promise<void> {
    const { error } = await supabase.rpc('insert_general_description', {
      p_value_info_id: value_info_id,
      p_building_code: data.building_code,
      p_storey: data.storey,
      p_floor_order: data.floor_order,
      p_bld_age: data.bld_age,
      p_bldg_permit: data.bldg_permit,
      p_construction_percent: data.construction_percent,
      p_date_constructed: validateDate(data.date_constructed),
      p_date_occupied: validateDate(data.date_occupied),
      p_date_completed: validateDate(data.date_completed),
      p_depreciation_rate: data.depreciation_rate
    });

    if (error) throw error;
  },

  /**
   * Insert multiple building adjustments for a value_info record
   */
  async insertBuildingAdjustments(value_info_id: string, adjustments: BuildingAdjustmentData[]): Promise<void> {
    for (const adjustment of adjustments) {
      const { error } = await supabase.rpc('insert_building_adjustments', {
        p_value_info_id: value_info_id,
        p_building_subcom_id: adjustment.building_subcom_id,
        p_description: adjustment.description,
        p_completion_percent: adjustment.completion_percent,
        p_depreciation: adjustment.depreciation,
        p_area: adjustment.area
      });

      if (error) throw error;
    }
  },

  /**
   * Insert machine data and return the new machinedata_id (UUID)
   */
  async insertMachineData(value_info_id: string, machineData: any): Promise<string> {
    // Validate and transform the data before sending to Supabase
    const validatedData = {
      p_value_info_id: value_info_id,
      p_selected_equipment: machineData.selected_equipment || null,
      p_serial_no: machineData.serial_no || null,
      p_machine_description: machineData.machine_description || null,
      p_brand_model: machineData.brand_model || null,
      p_condition: machineData.condition || null,
      p_machine_details: machineData.machine_details || null,
      p_purchase_type: machineData.purchase_type || null,
      p_date_acquired: validateDate(machineData.date_acquired),
      p_date_installed: validateDate(machineData.date_installed),
      p_date_operated: validateDate(machineData.date_operated),
      p_years_used: validateNumber(machineData.years_used),
      p_estimated_life: validateNumber(machineData.estimated_life),
      p_number_of_units: validateNumber(machineData.number_of_units),
      p_original_cost: validateNumber(machineData.original_cost),
      p_freight: validateNumber(machineData.freight),
      p_insurance: validateNumber(machineData.insurance),
      p_installation: validateNumber(machineData.installation),
      p_others: validateNumber(machineData.others),
      p_depreciation: validateNumber(machineData.depreciation)
    };

    const { data, error } = await supabase.rpc('insert_machine_data', validatedData);

    if (error) {
      console.error('RPC Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to insert machine data: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from insert_machine_data function');
    }
    
    return data; // UUID as string
  },

  /**
   * Insert agricultural land adjustment data and return the agrilandadjustment_id (UUID)
   */
  async insertAgriLandAdjustment(value_info_id: string, adjustmentData: AgriLandAdjustmentData): Promise<string> {
    const { data, error } = await supabase.rpc('insert_agriland_adjustment', {
      p_value_info_id: value_info_id,
      p_frontage: adjustmentData.frontage,
      p_weather_road: adjustmentData.weather_road,
      p_market: adjustmentData.market
    });

    if (error) {
      console.error('RPC Error inserting agricultural adjustment:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to insert agricultural adjustment data: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from insert_agriland_adjustment function');
    }
    
    return data; // UUID as string
  },

  /**
   * Insert non-agricultural adjustment with additional_factor
   */
  async insertNonAgriAdjustment(
    value_info_id: string, 
    adjustment_id: string, 
    additional_factor?: number | null
  ): Promise<string> {
    const { data, error } = await supabase.rpc('insert_nonagri_adjustment', {
      p_value_info_id: value_info_id,
      p_adjustment_id: adjustment_id,
      p_additional_factor: validateNumber(additional_factor)
    });

    if (error) {
      console.error('RPC Error inserting non-agricultural adjustment:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to insert non-agricultural adjustment: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from insert_nonagri_adjustment function');
    }
    
    return data; // Returns the composite key
  },

  /**
   * Insert multiple non-agricultural adjustments for a value_info record
   */
  async insertMultipleNonAgriAdjustments(
    value_info_id: string, 
    adjustments: NonAgriAdjustmentData[]
  ): Promise<void> {
    for (const adjustment of adjustments) {
      const { error } = await supabase.rpc('insert_nonagri_adjustment', {
        p_value_info_id: value_info_id,
        p_adjustment_id: adjustment.adjustment_id,
        p_additional_factor: validateNumber(adjustment.additional_factor)
      });

      if (error) throw error;
    }
  },

  /**
   * Update form status by form_id
   */
  async updateFormStatus(form_id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('formtbl')
      .update({ status })
      .eq('form_id', form_id);

    if (error) throw error;
  }
};