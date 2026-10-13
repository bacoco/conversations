import { JOBS, JOB_IDS, casesOf, jobById, jobRules } from '../jobs/jobs';
import { getPromptLibrary } from '../library/content';

describe('the ten jobs of the ministry', () => {
  it('are offered in the agreed order, each with its profile', () => {
    expect(JOBS.map((job) => job.id)).toEqual([...JOB_IDS]);
    expect(JOB_IDS).toHaveLength(10);
    JOBS.forEach((job) => {
      expect(job.label).toBeTruthy();
      expect(job.vocabulary.length).toBeGreaterThanOrEqual(10);
      expect(job.examples.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('each has ten cases, three of level 1, four of level 2, three of level 3', () => {
    JOB_IDS.forEach((id) => {
      const cases = casesOf(id);
      // Ten cases, from the easiest to the hardest.
      expect(cases.map((item) => item.id).sort()).toEqual(
        Array.from({ length: 10 }, (_, index) => `${id}-${index + 1}`).sort(),
      );
      expect(cases.map((item) => item.level)).toEqual(
        [...cases.map((item) => item.level)].sort(),
      );
      expect(cases.filter((item) => item.level === 1)).toHaveLength(3);
      expect(cases.filter((item) => item.level === 2)).toHaveLength(4);
      expect(cases.filter((item) => item.level === 3)).toHaveLength(3);
      // Ten different tasks, never the same case twice.
      expect(new Set(cases.map((item) => item.title)).size).toBe(10);
      cases.forEach((item) => {
        expect(item.keyPoints).toHaveLength(3);
        expect(item.checkAnswer.length).toBeGreaterThanOrEqual(2);
        expect(item.goodRequest.includes('[')).toBe(false);
      });
    });
  });

  it('each leads to existing families of the library', () => {
    const families = getPromptLibrary('fr').categories.map((item) => item.id);
    JOBS.forEach((job) =>
      job.library.forEach((family) => expect(families).toContain(family)),
    );
  });

  it('an unknown or old job is no job', () => {
    expect(jobById('mail')).toBeNull();
    expect(jobById(null)).toBeNull();
    expect(jobById('rh')?.label).toBe('Gestionnaire RH');
  });

  it('gives the coach the words of the job, only to pick examples', () => {
    const rules = jobRules(jobById('rh')!);
    expect(rules).toContain('Gestionnaire RH');
    expect(rules).toContain('compte épargne-temps');
    expect(rules).toContain('never add');
  });
});
