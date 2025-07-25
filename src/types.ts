// types.ts
export interface RatingGroup {
  Group: string;
  LOCATIONS: string[];
  RATINGS: {
    RESIDENTIAL?: Record<string, number>;
    COMMERCIAL?: Record<string, number>;
    INDUSTRIAL?: Record<string, number>;
  };
}

// Or more generally if you prefer:
export type RatingClassification = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
export type SubclassType = `R${number}` | `C${number}` | `I${number}`;