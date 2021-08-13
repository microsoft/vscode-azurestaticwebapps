/**
 * Removes double quotes from both ends of a string.
 * Removes double quotes because that's what GitHub actions YAML uses.
 */
export function trimQuotes(str: string): string {
    str = str.trim();
    const arr = Array.from(str);
    const quotationMark = '"';
    const first = arr.findIndex(char => char !== quotationMark);
    const last = arr.reverse().findIndex(char => char !== quotationMark);
    return (first === -1 && last === -1) ? '' : str.substring(first, str.length - last);
}
