export interface Skill {
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
