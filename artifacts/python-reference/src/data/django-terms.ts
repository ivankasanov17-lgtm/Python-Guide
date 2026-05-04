export interface DjangoTermArgument {
  name: string;
  description: string;
}

export interface DjangoTerm {
  name: string;
  category: string;
  description: string;
  syntax: string;
  arguments: DjangoTermArgument[];
  example: string;
}

export const djangoTerms: DjangoTerm[] = [];
