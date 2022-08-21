import type BigNumber from 'bignumber.js';

// Characters --------------------

export interface Umamusume {
  name: string;
  aptitude: string;
  presence: string | null;
  uniqueSkillDescription: string[];
  uniqueSkillEffect: SkillEffect;
  uniqueSkillCondition: SkillCondition;
  uniqueSkillPrecondition?: string;
}

// Race --------------------

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

// Skill --------------------

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

// Pickup --------------------

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

// Gacha --------------------

export interface GachaRules {
  guaranteeEvery: number;
  guaranteeGroup: string;
  sessionSize: number;
}

export interface GachaMember {
  name: string;
  pickup?: boolean;
}

export interface GachaGroup {
  name: string;
  tier: number;
}

export interface GachaGroupExtended extends GachaGroup {
  rates: number;
  pickupRatio: number;
}

export interface GachaGameData {
  id: string;
  name: string;
  rules: GachaRules;
  groups: GachaGroupExtended[];
  membersByGroup: {
    [groupName: string]: GachaMember[];
  };
}

export interface GachaSortedGroup extends GachaGroup {
  members: GachaMember[];
  pickup: boolean;
  rates: BigNumber;
  ratesOnGuarantee: BigNumber;
}

export interface GachaGame {
  id: string;
  name: string;
  rules: GachaRules;
  groups: GachaSortedGroup[];
}

export interface GachaPull {
  member: GachaMember;
  group: GachaGroup;
}

export interface GachaResult {
  pulls: GachaPull[];
  topPullCount: number;
  topPullRates: BigNumber;
}
