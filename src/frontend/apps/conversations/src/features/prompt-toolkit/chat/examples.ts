import { JOB_IDS, JobId, casesOf } from '../jobs/jobs';

/** A request as many would write it, the good one, and the rule to keep. */
export interface ExamplePair {
  caseId: string;
  title: string;
  before: string;
  after: string;
  rule: string;
  /** The text the case works from, put in the field with the request. */
  material?: string;
}

/**
 * « Voir des exemples »: the three practical cases of the user's job, as
 * before / after. Without a job, the first case of three different jobs.
 */
export const examplePairs = (jobId: JobId | undefined): ExamplePair[] => {
  const cases = jobId
    ? casesOf(jobId)
    : (['assistant-direction', 'accueil-usagers', 'encadrant'] as JobId[])
        .filter((id) => JOB_IDS.includes(id))
        .map((id) => casesOf(id)[0]);
  return cases.slice(0, 3).map((item) => ({
    caseId: item.id,
    title: item.title,
    before: item.startingRequest,
    after: item.goodRequest,
    rule: item.lesson,
    ...(item.material && { material: item.material }),
  }));
};
