export type ExampleFile = {
  filename: string;
  code: string;
};

export type FastAPIExample = {
  id: string;
  title: string;
  task: string;
  files: ExampleFile[];
  explanation: string;
};

export const fastapiExamples: FastAPIExample[] = [];
