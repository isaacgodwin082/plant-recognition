export type HealthStatus =
  | 'Healthy'
  | 'Mild Stress'
  | 'Needs Attention'
  | 'Critical'
  | 'Unclear';

export type PlantPartFocus =
  | 'Whole Plant'
  | 'Foliage'
  | 'Flower'
  | 'Stem & Bark'
  | 'Spot or Pest';

export type GrowingEnvironment =
  | 'Indoor Houseplant'
  | 'Outdoor Garden'
  | 'Patio or Greenhouse'
  | 'Wild or Field';

export interface IdentifyingTrait {
  trait: string;
  detail: string;
}

export interface CareLight {
  level: string;
  hoursPerDay: string;
  placement: string;
}

export interface CareWater {
  frequency: string;
  recommendedIntervalDays: number;
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
  airflowNote: string;
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

export interface SeasonalCalendar {
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
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
  immediateAction: string;
}

export interface PlantIdentificationResult {
  isPlant: boolean;
  nonPlantReason?: string;
  confidence: number;
  commonName: string;
  scientificName: string;
  synonyms: string[];
  family: string;
  genus: string;
  origin: string;
  plantType: string;
  identifyingTraits: IdentifyingTrait[];
  healthAssessment: HealthAssessment;
  careGuide: CareGuide;
  seasonalCalendar: SeasonalCalendar;
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
  partFocus: PlantPartFocus;
  environment: GrowingEnvironment;
  contextNote: string;
  imageUrl: string;
}

export interface SavedPlantEntry {
  id: string;
  savedAt: string;
  lastWateredAt: string;
  thumbnailDataUrl: string;
  environment: GrowingEnvironment;
  fieldNote: string;
  result: PlantIdentificationResult;
}

export interface CareChatMessage {
  role: 'user' | 'model';
  text: string;
}
