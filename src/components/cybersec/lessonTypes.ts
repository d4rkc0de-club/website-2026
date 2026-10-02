export type LessonStep<Config> = {
  title: string;
  explanationLines: readonly string[];
  taskText?: string;
  isTaskDone?: (config: Config) => boolean;
  describeLiveFact?: (config: Config) => string;
};

export type GlossaryEntry = {
  term: string;
  meaning: string;
};
