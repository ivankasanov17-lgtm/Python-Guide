export type Difficulty = "junior" | "middle" | "senior";

export type InterviewQuestion = {
  id: string;
  question: string;
  category: string;
  difficulty: Difficulty;
  answer: string;
};
