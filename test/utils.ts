export const SECTION = (text: string): string => {
  let result = text + ' ';

  result += '='.repeat(80 - result.length);

  return result;
};
