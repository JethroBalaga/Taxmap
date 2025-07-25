export type RatingClassification = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
export type ResidentialSubclass = 'R1' | 'R2' | 'R3' | 'R4';
export type CommercialSubclass = 'C1' | 'C2' | 'C3' | 'C4';
export type IndustrialSubclass = 'I1' | 'I2' | 'I3' | 'I4';

export type RatingSubclass = ResidentialSubclass | CommercialSubclass | IndustrialSubclass;

export interface GroupData {
  Group: string;
  LOCATIONS: string[];
  RATINGS: {
    RESIDENTIAL: Record<ResidentialSubclass, number>;
    COMMERCIAL: Record<CommercialSubclass, number>;
    INDUSTRIAL: Record<IndustrialSubclass, number>;
  };
}