export interface IAiPromptData {
  _id: string;
  key: string;
  category: string;
  label: string;
  description: string;
  content: string;
  templateVariables: string[];
  isActive: boolean;
  version: number;
  lastModifiedBy: string;
  updatedAt: string;
}
