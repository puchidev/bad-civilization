export interface Umamusume {
  name: string;
}

export interface Race {
  name: string;
  trackId: string;
}

export interface RaceTrack {
  id: string;
  course: RaceCourse;
  length: number;
  map: string;
  racetrack: string;
  statusRef: string[] | null;
  terrain: string;
}

export interface RaceCourse {
  straight: string;
  corner: string;
  finalCorner: string;
  finalStraight: string;
  uphill: string | null;
  downhill: string | null;
  openingLeg: string;
  middleLeg: string;
  finalLeg: string;
}

export interface Skill {
  ja: string;
  ko: string;
}

export interface UniqueSkill {
  umamusume: string;
  description: string[];
  effect: SkillEffect;
  precondition?: string;
  condition: SkillCondition;
}

export interface SkillEffect {
  duration: number;
  speed?: number;
  acceleration?: number;
  movement?: number;
  heal?: number;
  drain?: number;
}

export type SkillCondition = string | string[];
