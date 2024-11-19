export const isDetailsQuery = (question: string): boolean => {
    /** Check if the question is asking for comprehensive shipment details */
    const detailKeywords = [
        "details", "information", "tell me about", "what about",
        "show me", "give me details", "status of", "info on",
        "specifics", "overview"
    ];
    return detailKeywords.some(keyword => question.toLowerCase().includes(keyword)) && (
        question.toLowerCase().includes("shipment") || question.toLowerCase().includes("id")
    );
};

export const isLocationQuery = (question: string): boolean => {
    /** Check if the question is asking about current location */
    const locationKeywords = [
        "where", "location", "located", "current position",
        "right now", "currently", "track", "tracking",
        "whereabouts", "find", "locate"
    ];
    return locationKeywords.some(keyword => question.toLowerCase().includes(keyword)) && (
        question.toLowerCase().includes("shipment") || question.toLowerCase().includes("id")
    );
};

export const isSummaryQuery = (question: string): boolean => {
    /** Check if the question is asking for a summary of temperature excursions */
    const summaryKeywords = [
        "summary", "overview", "report", "recent",
        "history", "historical", "past", "review",
        "summarize", "recap"
    ];
    return summaryKeywords.some(keyword => question.toLowerCase().includes(keyword)) && question.toLowerCase().includes("temperature");
};

export const isEtaQuery = (question: string): boolean => {
    /** Check if the question is asking about estimated time of arrival */
    const etaKeywords = [
        "eta", "arrival", "arrive", "arriving", "expected",
        "estimated time", "when will", "delivery time",
        "delivery date", "expected delivery"
    ];
    return etaKeywords.some(keyword => question.toLowerCase().includes(keyword));
};

export const isCurrentExcursionQuery = (question: string): boolean => {
    /** Check if the question is asking about current temperature excursions */
    const currentKeywords = [
        "currently", "right now", "at the moment", "presently",
        "ongoing", "active", "experiencing", "current"
    ];
    const excursionKeywords = ["excursion", "excursions", "deviation", "violation"];
    
    const questionLower = question.toLowerCase();
    return currentKeywords.some(keyword => questionLower.includes(keyword)) && 
           excursionKeywords.some(keyword => questionLower.includes(keyword));
};

export const isRiskAssessmentQuery = (question: string): boolean => {
    /** Check if the question is asking about risk of temperature excursions */
    const riskKeywords = [
        "risk", "at risk", "likely to", "possibility of",
        "chance of", "potential", "may have", "could have",
        "vulnerable", "susceptible"
    ];
    return riskKeywords.some(keyword => question.toLowerCase().includes(keyword)) && question.toLowerCase().includes("temperature");
};

export const isRouteSummaryQuery = (question: string): boolean => {
    /** Check if question is asking for summary between specific locations */
    const locationPairs = [
        ["california", "texas"],
        ["los angeles", "dallas"],
        ["san francisco", "houston"]
    ];
    const questionLower = question.toLowerCase();
    return locationPairs.some(([loc1, loc2]) => questionLower.includes(loc1) && questionLower.includes(loc2)) && questionLower.includes("summary");
};

export const isRouteExcursionAnalysisQuery = (question: string): boolean => {
    /** Check if question is asking about routes with most excursions */
    const keywords = [
        "which route", "what route", "route analysis",
        "route with most", "worst route", "problematic route",
        "route temperature", "route excursions"
    ];
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
};

export const isSensorBreakdownQuery = (question: string): boolean => {
    /** Check if question is about IoT sensor data transmission issues */
    const keywords = [
        "sensor", "iot", "transmission", "data gap",
        "breakdown", "interruption", "downtime",
        "connectivity", "signal loss", "data loss"
    ];
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
};

export const isDelayTrendQuery = (question: string): boolean => {
    /** Check if question is about shipment delay trends */
    const keywords = [
        "delay trend", "delay pattern", "delay analysis",
        "late delivery", "tardiness", "delivery performance",
        "on-time performance", "delay statistics"
    ];
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
};

export const isDetailedDataReportQuery = (question: string): boolean => {
    /** Check if question is requesting detailed temperature and location report */
    const keywords = [
        "detailed report", "full report", "complete data",
        "temperature and location", "comprehensive report",
        "detailed analysis", "data report"
    ];
    return keywords.some(keyword => question.toLowerCase().includes(keyword));
};

export const isTemperatureQuery = (question: string): boolean => {
    /** Check if the question is asking about temperature */
    const temperatureKeywords = [
        "temperature", "temp", "degrees",
        "excursion", "too hot", "too cold",
        "temperature alert", "temperature warning"
    ];
    return temperatureKeywords.some(keyword => question.toLowerCase().includes(keyword));
};