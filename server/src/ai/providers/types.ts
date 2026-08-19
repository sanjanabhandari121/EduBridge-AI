export interface AIProvider {
  name: string;
  generateJSON(prompt: string): Promise<unknown>;
}
