/**
 * Attempts to safely parse a JSON string, with multiple fallback strategies
 * for handling malformed JSON commonly returned by LLMs.
 *
 * @param jsonString - The string to parse as JSON
 * @returns An object representing the parsed JSON, or containing the original text
 */
export const safeJsonParse = (jsonString: string): any => {
    // First, try standard JSON parsing
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.log("Standard JSON parsing failed, trying repair strategies");

        // Try to extract JSON if it's wrapped in markdown code blocks
        try {
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
        } catch (e) {
            console.log("Extracting JSON from code blocks failed");
        }

        // Try to repair common JSON issues with missing quotes/brackets
        try {
            // Replace unescaped quotes in string values
            const repairedJson = fixUnescapedQuotes(jsonString);
            return JSON.parse(repairedJson);
        } catch (e) {
            console.log("JSON repair attempt failed");
        }

        // If all parsing attempts fail, return a formatted object with the original text
        return {
            text_response: "The response couldn't be properly formatted. Original content below:\n\n" + jsonString,
            parse_error: true
        };
    }
};

/**
 * Attempts to fix common issues with unescaped quotes in JSON strings
 */
function fixUnescapedQuotes(jsonString: string): string {
    // Replace cases where quotes appear inside string values without being escaped
    let inString = false;
    let result = '';
    let i = 0;

    while (i < jsonString.length) {
        const char = jsonString[i];

        if (char === '"') {
            // Check if this quote is escaped
            const isEscaped = i > 0 && jsonString[i-1] === '\\' && jsonString[i-2] !== '\\';

            if (!isEscaped) {
                inString = !inString;
            }
        }

        // Handle unescaped quotes inside strings
        if (inString && char === '"' && i > 0 && jsonString[i-1] !== '\\') {
            // This is an unescaped quote inside a string - escape it
            result += '\\';
        }

        result += char;
        i++;
    }

    // Check for unclosed strings at the end
    if (inString) {
        result += '"'; // Add closing quote
    }

    // Add missing closing braces if needed
    let openBraces = 0;
    let openBrackets = 0;

    for (let i = 0; i < result.length; i++) {
        if (result[i] === '{') openBraces++;
        if (result[i] === '}') openBraces--;
        if (result[i] === '[') openBrackets++;
        if (result[i] === ']') openBrackets--;
    }

    // Add any missing closing braces or brackets
    result += '}'.repeat(Math.max(0, openBraces));
    result += ']'.repeat(Math.max(0, openBrackets));

    return result;
}
