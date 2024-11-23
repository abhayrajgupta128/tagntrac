export const getShipmentIdFromQuery = (question: string): string | null => {
    /** Extract shipment ID from the query */
    const patterns = [
        /shipment\s+id\s*[:#]?\s*([\w=]+)/i,
        /shipment\s*[:#]?\s*([\w=]+)/i,
        /id\s*[:#]?\s*([\w=]+)/i,
        /track\s*[:#]?\s*([\w=]+)/i,
    ];

    for (const pattern of patterns) {
        const match = question.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
};

export const getTimePeriodFromQuery = (question: string): { time_period: string, days: number } => {  // Review
    /** Extract time period from the query */
    question = question.toLowerCase();
    if (question.includes("week") || question.includes("7 days")) {
        return { time_period: "week", days: 7 };
    } else if (question.includes("month") || question.includes("30 days")) {
        return { time_period: "month", days: 30 };
    } else {
        return { time_period: "month", days: 30 };  // default to month
    }
};

export const formatTemperature = (temp: any): string => {
    /** Format temperature with appropriate unit */
    try {
        return `${parseFloat(temp).toFixed(1)}°C`;
    } catch {
        return "Not available";
    }
};

export const checkTemperatureExcursion = (temperature: any): [boolean, string] => {
    /** Check if temperature is outside the acceptable range (15-25 degrees) */
    try {
        const temp = parseFloat(temperature);
        if (temp < 15 || temp > 25) {
            return [true, `Temperature Excursion: ${temp}°C is outside acceptable range (15-25°C)`];
        }
    } catch (error) {
        return [false, "Invalid temperature value"];
    }
    return [false, "Temperature is within acceptable range"];
};

export const classifyExcursionSeverity = (deviation: any): string => {
    /** Classify the severity of temperature excursion */
    try {
        const dev = Math.abs(parseFloat(deviation));
        if (dev <= 3) {
            return "minor";
        } else if (dev <= 5) {
            return "moderate";
        } else {
            return "severe";
        }
    } catch (error) {
        return "unknown";
    }
};

export const cleanOutput = (text: string): string => {
    return text
        .replace(/\s*\n\s*/g, ' ') // Replace newlines and surrounding spaces with a single space
        .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
        .trim();                  // Trim leading and trailing spaces
};

export const parseDelayReasons = (reasonsString: string, reasonsMap: Record<string, number>) => {
    for (const reason of reasonsString.split(', ')) {
        if (reason) {
            reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
        }
    }
};