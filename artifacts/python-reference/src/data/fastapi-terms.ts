export interface FastAPITerm {
  name: string;
  description: string;
  syntax: string;
  arguments: { name: string; description: string }[];
  example: string;
  category: string;
}

export const fastapiTerms: FastAPITerm[] = [];
