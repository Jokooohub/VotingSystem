import { Office, Employee, OfficeId, Participant } from '../types';

export const DIVISION_INFO = {
  name: 'Division for Campus Facility, Safety, and Security Services',
  shortName: 'DCFSSS',
  chief: 'Ar. Magichael B. Cloribel',
  chiefTitle: 'Division Chief',
  period: 'Annual Recognition Award 2026',
  awardTitle: 'Best Employee of the Year Award',
};

export const OFFICES: Office[] = [
  {
    id: 'ECO',
    name: 'Engineering & Construction Office',
    shortName: 'ECO',
    fullName: 'Engineering and Construction Office',
    description: 'Architectural planning, structural development, electrical, electronics, and plumbing systems.',
    headName: 'Ar. Alchor R. Tapayan',
    iconName: 'Compass',
    themeColor: {
      bg: 'bg-indigo-50',
      border: 'border-slate-200 hover:border-indigo-300',
      text: 'text-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accent: 'from-indigo-600 to-blue-600',
    },
  },
  {
    id: 'GSO',
    name: 'General Services Office',
    shortName: 'GSO',
    fullName: 'General Services Office',
    description: 'Facility maintenance, motor pool & transportation, groundskeeping, and administrative logistics.',
    headName: 'Engr. Mariel M. Delo',
    iconName: 'Building2',
    themeColor: {
      bg: 'bg-blue-50',
      border: 'border-slate-200 hover:border-blue-300',
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'from-blue-600 to-cyan-600',
    },
  },
  {
    id: 'OCSS',
    name: 'Office of Campus Safety & Security',
    shortName: 'OCSS',
    fullName: 'Office of the Campus Safety and Security',
    description: 'Campus perimeter protection, student and personnel safety, and surveillance operations.',
    headName: 'Engr. Marilou G. Umpad',
    iconName: 'ShieldCheck',
    themeColor: {
      bg: 'bg-slate-100',
      border: 'border-slate-200 hover:border-slate-400',
      text: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      accent: 'from-slate-700 to-slate-900',
    },
  },
  {
    id: 'DRRMO',
    name: 'Disaster Risk Reduction & Management',
    shortName: 'DRRMO',
    fullName: 'Disaster Risk Reduction and Management Office',
    description: 'Emergency response, disaster preparedness, mitigation, and crisis recovery management.',
    headName: 'Urlie G. Anino, DiSDS',
    iconName: 'ShieldAlert',
    themeColor: {
      bg: 'bg-violet-50',
      border: 'border-slate-200 hover:border-violet-300',
      text: 'text-violet-600',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      accent: 'from-violet-600 to-indigo-600',
    },
  },
];

// All division participants eligible to vote (46 members)
export const ALL_PARTICIPANTS: Participant[] = [
  {
    id: 1,
    name: 'Ar. Magichael B. Cloribel',
    designation: 'Division Chief',
    officeId: 'DCFSSS',
  },
  // DRRMO
  {
    id: 2,
    name: 'Urlie G. Anino, DiSDS',
    designation: 'Director / Emergency Response and Recovery Unit',
    officeId: 'DRRMO',
  },
  {
    id: 3,
    name: 'Garry B. Tabugon, LPT',
    designation: 'Head, Disaster Preparedness and Mitigation Unit',
    officeId: 'DRRMO',
  },
  {
    id: 4,
    name: 'Carlito C. Yap',
    designation: 'Administrative Aide III (Clerk I)',
    officeId: 'DRRMO',
  },
  {
    id: 5,
    name: 'Prima Grace R. Jadumas, MPA',
    designation: 'Technical Staff',
    officeId: 'DRRMO',
  },
  // OCSS
  {
    id: 6,
    name: 'Engr. Marilou G. Umpad',
    designation: 'Director, OCSS',
    officeId: 'OCSS',
  },
  {
    id: 7,
    name: 'Colbhorne Stanley Gallego',
    designation: 'Safety Unit Staff',
    officeId: 'OCSS',
  },
  {
    id: 8,
    name: 'Engr. Rogelio B. Gonzales',
    designation: 'Head, University Safety Unit (OCSS) / University Electrical Engineer (GSO)',
    officeId: 'OCSS',
  },
  {
    id: 9,
    name: 'Warren Harvey T. Lecciones',
    designation: 'Head, University Security Unit',
    officeId: 'OCSS',
  },
  {
    id: 10,
    name: 'Quinton Ferderic B. Gambe',
    designation: 'Technical Staff',
    officeId: 'OCSS',
  },
  {
    id: 11,
    name: 'Elyka Mae Hinautan',
    designation: 'Technical Staff',
    officeId: 'OCSS',
  },
  {
    id: 12,
    name: 'Bridget Faye M. Evangelista',
    designation: 'Office Staff',
    officeId: 'OCSS',
  },
  // ECO
  {
    id: 13,
    name: 'Ar. Alchor R. Tapayan',
    designation: 'Director (ECO) / Head, Landscaping Services Unit (GSO)',
    officeId: 'ECO',
  },
  {
    id: 14,
    name: 'Ar. Derwin T. Gumban',
    designation: 'Head, Planning and Design Unit',
    officeId: 'ECO',
  },
  {
    id: 15,
    name: 'Ar. Kresia H. Sales',
    designation: 'Head, Project Implementation Unit',
    officeId: 'ECO',
  },
  {
    id: 16,
    name: 'Engr. Charle Magne L. Cillo',
    designation: 'Electrical Engineer',
    officeId: 'ECO',
  },
  {
    id: 17,
    name: 'Engr. Robert Lee M. Bawiga',
    designation: 'Electronics Engineer',
    officeId: 'ECO',
  },
  {
    id: 18,
    name: 'Engr. Louid D. Hermosa',
    designation: 'Master Plumber/Mechanical Engineer',
    officeId: 'ECO',
  },
  {
    id: 19,
    name: 'Ar. Timothy P. Palero',
    designation: 'Site Architect',
    officeId: 'ECO',
  },
  {
    id: 20,
    name: 'Engr. Neil R. Galuso',
    designation: 'Site Engineer',
    officeId: 'ECO',
  },
  {
    id: 21,
    name: 'Joko J. Saco',
    designation: 'Project Technical Officer',
    officeId: 'ECO',
  },
  {
    id: 22,
    name: 'Mark Vi D. Cepeda',
    designation: 'Senior Draftsman',
    officeId: 'ECO',
  },
  {
    id: 23,
    name: 'Ralph Nhyne P. Pabon',
    designation: 'Junior Draftsman',
    officeId: 'ECO',
  },
  {
    id: 24,
    name: 'Reginald M. Llagas',
    designation: 'Junior Draftsman',
    officeId: 'ECO',
  },
  {
    id: 25,
    name: 'Michaella B. Guillera',
    designation: 'Junior Draftswoman',
    officeId: 'ECO',
  },
  {
    id: 26,
    name: 'Gerlie Mae O. Cabal',
    designation: 'Technical Assistant',
    officeId: 'ECO',
  },
  {
    id: 27,
    name: 'Jay Criz M. Delo',
    designation: 'Liaison Officer',
    officeId: 'ECO',
  },
  {
    id: 28,
    name: 'Corazon D. Cepeda',
    designation: 'Office Staff',
    officeId: 'ECO',
  },
  // GSO
  {
    id: 29,
    name: 'Engr. Mariel M. Delo',
    designation: 'Director (GSO) / University Structural Engineer (ECO)',
    officeId: 'GSO',
  },
  {
    id: 30,
    name: 'Engr. Ena Tiu-Ibarra',
    designation: 'Head, Transportation Services Unit',
    officeId: 'GSO',
  },
  {
    id: 31,
    name: 'Engr. Ma. Zylphadelle Gumadlas-Valduhueza',
    designation: 'Head, Facility Maintenance Unit',
    officeId: 'GSO',
  },
  {
    id: 32,
    name: 'Engr. John Niño S. Salabe',
    designation: 'Resident Engineer I',
    officeId: 'GSO',
  },
  {
    id: 33,
    name: 'Raul Jr V. Dunan',
    designation: 'Project Technical Officer I',
    officeId: 'GSO',
  },
  {
    id: 34,
    name: 'Rojielaine Divine Amparo',
    designation: 'University Draftswoman',
    officeId: 'GSO',
  },
  {
    id: 35,
    name: 'Carl Laurence I. Lisondra',
    designation: 'University Draftsman',
    officeId: 'GSO',
  },
  {
    id: 36,
    name: 'Fortunato D. Paje',
    designation: 'University Draftsman',
    officeId: 'GSO',
  },
  {
    id: 37,
    name: 'Zianne A. Capangpangan',
    designation: 'Admin Assistant II',
    officeId: 'GSO',
  },
  {
    id: 38,
    name: 'Esmeraldo C. Catipan',
    designation: 'Admin Aide VI - Clerk III',
    officeId: 'GSO',
  },
  {
    id: 39,
    name: 'Vergilio P. Villamor Jr.',
    designation: 'Admin Aide IV - University Mechanic',
    officeId: 'GSO',
  },
  {
    id: 40,
    name: 'Allan M. Albero',
    designation: 'Admin Aide IV - University Driver',
    officeId: 'GSO',
  },
  {
    id: 41,
    name: 'Ariel V. Ancheta',
    designation: 'Admin Aide IV - University Driver',
    officeId: 'GSO',
  },
  {
    id: 42,
    name: 'Retchie C. Capangpangan',
    designation: 'Admin Aide IV - University Driver',
    officeId: 'GSO',
  },
  {
    id: 43,
    name: 'Verjelyn C. Capilitan',
    designation: 'Admin Aide IV - University Driver',
    officeId: 'GSO',
  },
  {
    id: 44,
    name: 'Christopher F. Sison',
    designation: 'Admin Aide III - University Driver',
    officeId: 'GSO',
  },
  {
    id: 45,
    name: 'Cris G. Entina',
    designation: 'ACU Technician',
    officeId: 'GSO',
  },
  {
    id: 46,
    name: 'Marlon D. Solis',
    designation: 'Admin Aide I - Checker',
    officeId: 'GSO',
  },
];

// Fun and distinctive Fruit & Animal Anonymous Codenames for all participants
export const ANONYMOUS_CODENAMES: Record<number, { name: string; avatar: string }> = {
  1: { name: 'Golden Eagle', avatar: '🦅' },
  2: { name: 'Silver Fox', avatar: '🦊' },
  3: { name: 'Blue Dolphin', avatar: '🐬' },
  4: { name: 'Emerald Falcon', avatar: '🦅' },
  5: { name: 'Crimson Tiger', avatar: '🐯' },
  6: { name: 'Ruby Cheetah', avatar: '🐆' },
  7: { name: 'Topaz Panther', avatar: '🐆' },
  8: { name: 'Diamond Wolf', avatar: '🐺' },
  9: { name: 'Amber Bear', avatar: '🐻' },
  10: { name: 'Sapphire Hawk', avatar: '🦅' },
  11: { name: 'Solar Phoenix', avatar: '🦚' },
  12: { name: 'Lunar Owl', avatar: '🦉' },
  13: { name: 'Golden Mango', avatar: '🥭' },
  14: { name: 'Crimson Apple', avatar: '🍎' },
  15: { name: 'Blueberry Lynx', avatar: '🫐' },
  16: { name: 'Kiwi Otter', avatar: '🥝' },
  17: { name: 'Velvet Peach', avatar: '🍑' },
  18: { name: 'Pineapple Stag', avatar: '🍍' },
  19: { name: 'Dragonfruit Heron', avatar: '🦩' },
  20: { name: 'Papaya Jaguar', avatar: '🐆' },
  21: { name: 'Citrus Leopard', avatar: '🐆' },
  22: { name: 'Starfruit Crane', avatar: '🦩' },
  23: { name: 'Coconut Panda', avatar: '🐼' },
  24: { name: 'Avocado Koala', avatar: '🐨' },
  25: { name: 'Cherry Badger', avatar: '🍒' },
  26: { name: 'Pecan Beaver', avatar: '🦫' },
  27: { name: 'Grape Gazelle', avatar: '🍇' },
  28: { name: 'Melon Seal', avatar: '🍈' },
  29: { name: 'Plum Pelican', avatar: '🦤' },
  30: { name: 'Guava Cardinal', avatar: '🐦' },
  31: { name: 'Tangerine Flamingo', avatar: '🦩' },
  32: { name: 'Lychee Penguin', avatar: '🐧' },
  33: { name: 'Fig Sea Lion', avatar: '🦭' },
  34: { name: 'Apricot Elk', avatar: '🦌' },
  35: { name: 'Blackberry Moose', avatar: '🫎' },
  36: { name: 'Raspberry Orca', avatar: '🐋' },
  37: { name: 'Lime Gecko', avatar: '🦎' },
  38: { name: 'Pear Toucan', avatar: '🦜' },
  39: { name: 'Guava Osprey', avatar: '🦅' },
  40: { name: 'Passionfruit Cobra', avatar: '🐍' },
  41: { name: 'Cranberry Kingfisher', avatar: '🐦' },
  42: { name: 'Pomegranate Lynx', avatar: '🐱' },
  43: { name: 'Mulberry Bison', avatar: '🦬' },
  44: { name: 'Olive Swift', avatar: '🕊️' },
  45: { name: 'Hazelnut Robin', avatar: '🐦' },
  46: { name: 'Elderberry Falcon', avatar: '🦅' },
};

export function getAnonymousProfile(id: number): { name: string; avatar: string } {
  return ANONYMOUS_CODENAMES[id] || { name: `Nominee #${id}`, avatar: '🌟' };
}

// 45 Nominees grouped by Office (ECO, GSO, OCSS, DRRMO)
export const EMPLOYEES: Employee[] = ALL_PARTICIPANTS.filter(
  (p): p is Employee => p.officeId !== 'DCFSSS'
);

export function getEmployeesByOffice(officeId: OfficeId): Employee[] {
  return EMPLOYEES.filter((emp) => emp.officeId === officeId);
}

export function getOfficeById(officeId: OfficeId): Office | undefined {
  return OFFICES.find((o) => o.id === officeId);
}

export function getEmployeeById(id: number): Employee | undefined {
  return EMPLOYEES.find((emp) => emp.id === id);
}

export function getParticipantById(id: number): Participant | undefined {
  return ALL_PARTICIPANTS.find((p) => p.id === id);
}
