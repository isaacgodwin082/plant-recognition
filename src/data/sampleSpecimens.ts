import type { SampleSpecimen } from '../types/plant';

const BASE = import.meta.env.BASE_URL;

export const SAMPLE_SPECIMENS: SampleSpecimen[] = [
  {
    id: 'monstera',
    plateNumber: 'Plate 01',
    commonName: 'Swiss Cheese Plant',
    scientificName: 'Monstera deliciosa',
    family: 'Araceae',
    contextNote: 'Indoor specimen beside bright east-facing window in ceramic pot.',
    imageUrl: `${BASE}src/assets/images/specimen_monstera_1794911907430.jpg`,
  },
  {
    id: 'calathea',
    plateNumber: 'Plate 02',
    commonName: 'Orbifolia Prayer Plant',
    scientificName: 'Goeppertia orbifolia',
    family: 'Marantaceae',
    contextNote: 'Greenhouse specimen in dappled shade with high ambient humidity.',
    imageUrl: `${BASE}src/assets/images/specimen_calathea_1794911908122.jpg`,
  },
  {
    id: 'lavender',
    plateNumber: 'Plate 03',
    commonName: 'English Lavender',
    scientificName: 'Lavandula angustifolia',
    family: 'Lamiaceae',
    contextNote: 'Outdoor garden border against limestone wall in full afternoon sun.',
    imageUrl: `${BASE}src/assets/images/specimen_lavender_1794911908552.jpg`,
  },
  {
    id: 'fiddle-leaf',
    plateNumber: 'Plate 04',
    commonName: 'Fiddle-Leaf Fig',
    scientificName: 'Ficus lyrata',
    family: 'Moraceae',
    contextNote: 'Indoor tree in terracotta vessel receiving bright indirect window light.',
    imageUrl: `${BASE}src/assets/images/specimen_fiddle_leaf_1794911908579.jpg`,
  },
];
