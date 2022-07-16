import { RuntimeDatabase } from '#App/classes';
import { logger } from '#App/devtools';
import { fetchData } from '#App/utils';
import type {
  Pickup,
  PickupRef,
  Race,
  RaceTrack,
  Skill,
  Umamusume,
} from './types';

export const umamusumes = new RuntimeDatabase<Umamusume>();
export const races = new RuntimeDatabase<Race>();
export const raceTracks = new RuntimeDatabase<RaceTrack>();
export const skills = new RuntimeDatabase<Skill>();
export const pickups = new RuntimeDatabase<Pickup>();
export const pickupRefs = new RuntimeDatabase<PickupRef>();

/** Load umamusume data */
async function loadUmamusumes() {
  try {
    const umamusumeList: Umamusume[] = await fetchData(
      'database/umamusume/uma-musumes.json',
    );
    umamusumeList.forEach((umamusume) => {
      umamusumes.insert(umamusume.name, umamusume);
    });
  } catch (e) {
    logger.debug(e);
    logger.error('Failed to establish umamusume list.');
  }
}

/** Load race data */
async function loadRaces() {
  try {
    const promises = [
      'database/umamusume/races.json',
      'database/umamusume/racetracks.json',
    ].map((path) => fetchData(path));

    const [raceList, raceTrackList] = (await Promise.all(promises)) as [
      Race[],
      RaceTrack[],
    ];

    raceList.forEach((race) => {
      races.insert(race.name, race);
    });
    raceTrackList.forEach((raceTrack) => {
      raceTracks.insert(raceTrack.id, raceTrack);
    });
  } catch (e) {
    logger.debug(e);
    logger.error('Failed to establish race list.');
  }
}

/** Load umamusume skill data */
async function loadSkills() {
  try {
    const skillList: Skill[] = await fetchData(
      'database/umamusume/skills.json',
    );
    skillList.forEach((skill) => {
      skills.insert(skill.ja, skill);
    });
  } catch (e) {
    logger.debug(e);
    logger.error(`Failed to establish umamusume's skill list.`);
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

      pickups.insert(since, pickup);

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
    logger.debug(e);
    logger.error('Failed to establish umamusume pickup list.');
  }
}

loadUmamusumes();
loadRaces();
loadSkills();
loadPickups();
