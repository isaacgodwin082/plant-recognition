export type HealthStatus = 'Healthy' | 'Needs Attention' | 'Critical' | 'Unclear';

export interface CareLight {
  level: string;
  hoursPerDay: string;
  placement: string;
}

export interface CareWater {
  frequency: string;
  method: string;
  soilMoistureCue: string;
}

export interface CareSoil {
  mix: string;
  pHRange: string;
  drainage: string;
}

export interface CareClimate {
  tempRangeC: string;
  tempRangeF: string;
  humidityRange: string;
}

export interface CareFertilizer {
  schedule: string;
  npkRatio: string;
  seasonalNote: string;
}

export interface CarePruning {
  pruning: string;
  repottingFrequency: string;
  propagationMethod: string;
}

export interface CareGuide {
  light: CareLight;
  water: CareWater;
  soil: CareSoil;
  climate: CareClimate;
  fertilizer: CareFertilizer;
  pruningAndRepotting: CarePruning;
}

export interface ToxicityInfo {
  pets: string;
  humans: string;
  note: string;
}

export interface CommonIssue {
  symptom: string;
  cause: string;
  remedy: string;
}

export interface AlternativeMatch {
  commonName: string;
  scientificName: string;
  confidence: number;
  distinguishingFeature: string;
}

export interface HealthAssessment {
  status: HealthStatus;
  summary: string;
  observations: string[];
}

export interface PlantIdentificationResult {
  isPlant: boolean;
  nonPlantReason?: string;
  confidence: number;
  commonName: string;
  scientificName: string;
  family: string;
  origin: string;
  plantType: string;
  morphologicalNotes: string;
  healthAssessment: HealthAssessment;
  careGuide: CareGuide;
  toxicity: ToxicityInfo;
  commonIssues: CommonIssue[];
  alternativeMatches: AlternativeMatch[];
}

export interface SampleSpecimen {
  id: string;
  plateNumber: string;
  commonName: string;
  scientificName: string;
  family: string;
  contextNote: string;
  imageUrl: string;
}

export interface SavedSpecimen {
  id: string;
  savedAt: string;
  thumbnailDataUrl: string;
  fieldNote: string;
  result: PlantIdentificationResult;
}

export interface CareChatMessage {
  role: 'user' | 'model';
  text: string;
}
