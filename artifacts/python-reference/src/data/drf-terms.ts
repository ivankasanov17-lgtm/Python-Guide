export interface DrfTermArgument {
  name: string;
  description: string;
}

export interface DrfTerm {
  name: string;
  category: string;
  description: string;
  syntax: string;
  arguments: DrfTermArgument[];
  example: string;
}

export const drfTerms: DrfTerm[] = [
  
];
