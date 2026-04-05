/**
 * Simple template engine for AI prompts.
 * Replaces {{variableName}} placeholders with provided values.
 */
export function resolvePromptTemplate(
  content: string,
  variables: Record<string, string> = {},
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    if (!(varName in variables)) {
      throw new Error(`Missing template variable: ${varName}`);
    }
    return variables[varName];
  });
}
