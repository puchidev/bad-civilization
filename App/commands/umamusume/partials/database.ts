import { RuntimeDatabase } from '#App/classes';
import { fetchData } from '#App/utils';
import type {
  Pickup,
  PickupRef,
  Race,
  RaceTrack,
  Skill,
  Umamusume,
  UniqueSkill,
} from './types';

export const umamusume = new RuntimeDatabase<Umamusume>();
export const races = new RuntimeDatabase<Race>();
export const raceTracks = new RuntimeDatabase<RaceTrack>();
export const skills = new RuntimeDatabase<Skill>();
export const uniqueSkills = new RuntimeDatabase<UniqueSkill>();

export const pickups = new RuntimeDatabase<Pickup>();
export const pickupRefs = new RuntimeDatabase<PickupRef>();

/** Load umamusume data */
async function loadUmamusumes() {
  try {
    const umamusumeList: Umamusume[] = await fetchData(
      'database/umamusume/uma-musumes.json',
    );
    umamusume.addAll(umamusumeList, 'name');
  } catch (e) {
    console.debug(e);
    console.error('Failed to establish umamusume list.');
  }
}

/** Load race data */
async function loadRaces() {
  try {
    const promises = [
      'database/umamusume/races.json',
      'database/umamusume/racetracks.json',
    ].map((path) => fetchData(path));

    const [raceList, raceTrackList] = await Promise.all(promises);

    races.addAll(raceList as Race[], 'name');
    raceTracks.addAll(raceTrackList as RaceTrack[], 'id');
  } catch (e) {
    console.debug(e);
    console.error('Failed to establish race list.');
  }
}

/** Load umamusume skill data */
async function loadSkills() {
  try {
    const uniqueSkillList: Skill[] = await fetchData(
      'database/umamusume/skills.json',
    );
    skills.addAll(uniqueSkillList, 'ja');
  } catch (e) {
    console.debug(e);
    console.error(`Failed to establish umamusume's skill list.`);
  }
}

/** Load umamusume skill data */
async function loadUniqueSkills() {
  try {
    const uniqueSkillList: UniqueSkill[] = await fetchData(
      'database/umamusume/unique-skills.json',
    );
    uniqueSkills.addAll(uniqueSkillList, 'umamusume');
  } catch (e) {
    console.debug(e);
    console.error(`Failed to establish umamusume's unique skill list.`);
  }
}

/** Load skill data */
async function loadPickups() {
  try {
    const pickupList: Pickup[] = await fetchData(
      'database/umamusume/pickups.json',
    );

    pickupList.forEach((pickup) => {
      const { since, umamusume: umamusumeList, support: supportList } = pickup;

      pickups.set(since, pickup);

      umamusumeList.forEach((umamusume) => {
        const ref = pickupRefs.get(umamusume) ?? {
          type: '말',
          pickupIds: new Set(),
        };
        ref.pickupIds.add(since);
        pickupRefs.set(umamusume, ref);
      });

      supportList.forEach((support) => {
        const ref = pickupRefs.get(support) ?? {
          type: '서폿',
          pickupIds: new Set(),
        };
        ref.pickupIds.add(since);
        pickupRefs.set(support, ref);
      });
    });
  } catch (e) {
    console.debug(e);
    console.error('Failed to establish umamusume pickup list.');
  }
}

loadUmamusumes();
loadRaces();
loadSkills();
loadUniqueSkills();
loadPickups();
