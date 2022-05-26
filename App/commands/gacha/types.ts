import type BigNumber from 'bignumber.js';

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

export interface GachaGameConfig {
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
