export interface Criterion {
  id: string;
  name: string;
  shortName: string;
  description: string;
  weight: number; // in percentage e.g. 30
  weightLabel: string;
  iconName: 'Zap' | 'Clock' | 'Smile' | 'Users' | 'Compass';
}

export const CRITERIA: Criterion[] = [
  {
    id: 'performance',
    name: 'Work Performance',
    shortName: 'Performance',
    description: 'Quality and timely completion of tasks',
    weight: 30,
    weightLabel: '30%',
    iconName: 'Zap',
  },
  {
    id: 'attendance',
    name: 'Attendance & Punctuality',
    shortName: 'Attendance',
    description: 'Regular and punctual at work',
    weight: 20,
    weightLabel: '20%',
    iconName: 'Clock',
  },
  {
    id: 'attitude',
    name: 'Work Attitude',
    shortName: 'Attitude',
    description: 'Positive, responsible, and professional',
    weight: 20,
    weightLabel: '20%',
    iconName: 'Smile',
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    shortName: 'Teamwork',
    description: 'Cooperation and support for colleagues',
    weight: 15,
    weightLabel: '15%',
    iconName: 'Users',
  },
  {
    id: 'initiative',
    name: 'Initiative',
    shortName: 'Initiative',
    description: 'Willingness to take responsibility and help beyond assigned tasks',
    weight: 15,
    weightLabel: '15%',
    iconName: 'Compass',
  },
];
