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
