export interface Umamusume {
  name: string;
  aptitude: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  presence: string | null;
  uniqueSkillDescription: string[];
  uniqueSkillEffect: SkillEffect;
  uniqueSkillCondition: SkillCondition;
  uniqueSkillPrecondition?: string;
}

export interface Race {
  name: string;
  trackId: string;
}

export interface RaceTrackRange {
  type: string;
  from: number;
  to: number;
}

export interface RaceTrack {
  id: string;
  racetrack: string;
  terrain: string;
  length: number;
  direction: string;
  course: string | null;
  map: string;
  legs: RaceTrackRange[];
  slopes: RaceTrackRange[];
  segments: RaceTrackRange[];
  statusRef: string[] | null;
}

export interface Skill {
  ja: string;
  ko: string;
}

export interface SkillEffect {
  currentSpeed: number;
  duration: number;
  speed?: number;
  acceleration?: number;
  movement?: number;
  heal?: number;
  drain?: number;
}

export type SkillCondition = string | string[];

interface PickupPeriod {
  since: string;
  until: string;
  sinceKR?: string;
  untilKR?: string;
}

export type PickupType = '말' | '서폿';

export interface PickupRef {
  type: PickupType;
  pickupIds: Set<string>;
}

export interface Pickup extends PickupPeriod {
  umamusume: string[];
  support: string[];
}
