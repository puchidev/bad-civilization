import dedent from 'dedent';

import type { RaceTrack } from './types';

/**
 * Transforms a race track length to human-readable text.
 * @param length length of race track
 * @returns text representing the type of race
 */
function getLengthType(length: number) {
  if (length > 2400) {
    return '장거리';
  }
  if (length > 1800) {
    return '중거리';
  }
  if (length > 1400) {
    return '마일';
  }
  return '단거리';
}

/**
 * Creates basic info text of a race track.
 * @param track information about the track
 * @returns basic information text
 */
function formatBasicInfo(track: RaceTrack) {
  const { racetrack, statusRef, terrain, length } = track;
  const lengthType = getLengthType(length);
  let output = `${racetrack} | ${terrain} | ${length}m (${lengthType})`;

  if (statusRef) {
    output += ` | ${statusRef.join(', ')} 보정`;
  }

  return output;
}

/**
 * Creates detailed course info text of a race track.
 * @param track information about the track
 * @returns course information text
 */
function formatCourseInfo(track: RaceTrack) {
  const {
    course: {
      straight,
      corner,
      finalCorner,
      finalStraight,
      uphill,
      downhill,
      openingLeg,
      middleLeg,
      finalLeg,
    },
  } = track;

  const output = dedent`
    직선 — ${formatCourseRange(straight)}
    코너 — ${formatCourseRange(corner)}
    최종 코너 — ${formatCourseRange(finalCorner)}
    최종 직선 — ${formatCourseRange(finalStraight)}
    오르막 — ${formatCourseRange(uphill)}
    내리막 — ${formatCourseRange(downhill)}
    초반 — ${formatCourseRange(openingLeg)}
    중반 — ${formatCourseRange(middleLeg)}
    종반 — ${formatCourseRange(finalLeg)}
  `.trim();

  return output;
}

/**
 * Reformats a string representing course range(s) to be more readable.
 * @param ranges a course range or multiple ranges (or nothing if non-existant)
 * @returns formatted range
 */
function formatCourseRange(ranges: string | null) {
  if (!ranges) {
    return '없음';
  }

  return ranges
    .split(',')
    .map((range) => `${range}m`)
    .join(', ');
}

export { formatBasicInfo, formatCourseInfo, getLengthType };
