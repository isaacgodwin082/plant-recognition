import type { SampleSpecimen } from '../types/plant';

const BASE = import.meta.env.BASE_URL;

export const SAMPLE_SPECIMENS: SampleSpecimen[] = [
  {
    id: 'echeveria',
    plateNumber: 'Plate 01',
    commonName: 'Mexican Snowball',
    scientificName: 'Echeveria elegans',
    family: 'Crassulaceae',
    partFocus: 'Whole Plant',
    environment: 'Patio or Greenhouse',
    contextNote: 'Rosette succulent in gritty mineral mix under bright morning sun.',
    imageUrl: `${BASE}src/assets/images/botanical_echeveria_1794920448473.jpg`,
  },
  {
    id: 'orchid',
    plateNumber: 'Plate 02',
    commonName: 'White Moth Orchid',
    scientificName: 'Phalaenopsis aphrodite',
    family: 'Orchidaceae',
    partFocus: 'Flower',
    environment: 'Indoor Houseplant',
    contextNote: 'Blooming indoor orchid on bright filtered east windowsill.',
    imageUrl: `${BASE}src/assets/images/botanical_orchid_1794920448480.jpg`,
  },
  {
    id: 'rosemary',
    plateNumber: 'Plate 03',
    commonName: 'Garden Rosemary',
    scientificName: 'Salvia rosmarinus',
    family: 'Lamiaceae',
    partFocus: 'Foliage',
    environment: 'Outdoor Garden',
    contextNote: 'Woody aromatic perennial in full sun with pale blue blossoms.',
    imageUrl: `${BASE}src/assets/images/botanical_rosemary_1794920449872.jpg`,
  },
  {
    id: 'peace-lily',
    plateNumber: 'Plate 04',
    commonName: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    family: 'Araceae',
    partFocus: 'Whole Plant',
    environment: 'Indoor Houseplant',
    contextNote: 'Indoor specimen in clay pot with white spathe bloom and indirect window light.',
    imageUrl: `${BASE}src/assets/images/botanical_peace_lily_1794920448843.jpg`,
  },
];
