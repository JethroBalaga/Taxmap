import { supabase } from './../utils/supaBaseClient';

export interface FormData {
  declarant_id: number;
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
  accuracy: number | null;
  altitude: number | null;
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

export const supabaseApi = {
  /**
   * Insert a form and return the new form_id (UUID)
   */
  async insertForm(formData: FormData): Promise<string> {
    const { data, error } = await supabase.rpc('insert_form_and_return_id', {
      p_declarant_id: formData.declarant_id,
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
      p_accuracy: photoData.accuracy,
      p_altitude: photoData.altitude,
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
      p_date_constructed: data.date_constructed,
      p_date_occupied: data.date_occupied,
      p_date_completed: data.date_completed,
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
