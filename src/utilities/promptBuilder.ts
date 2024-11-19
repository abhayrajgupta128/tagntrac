import * as Utils from '../utilities/queryTypeDetector';

export const buildPrompt = (data: string, question: string): string => {
    if (Utils.isRouteSummaryQuery(question)) {
        return `
        Instructions: You are analyzing shipments between specific locations.
        Based on the provided data, summarize shipment performance between the locations.
        
        Format your response exactly like this:
        "This month, you've had [X] shipments between [Location A] and [Location B]. 
        [Y]% arrived on time, with [Z] shipments experiencing minor temperature fluctuations. 
        I can provide detailed insights on specific shipments if needed."
  
        Include specific numbers and performance metrics.
        Highlight any notable patterns or concerns.
        
        Context: ${data}
  
        Question: ${question}
      `;
    } else if (Utils.isLocationQuery(question)) {
        return `
        Instructions: You are tracking the current location of shipments.
        Based on the provided data, give the current location and next checkpoint details.
        
        Format your response exactly like this:
        "Shipment ID [___] is currently located at [Current Location]. 
        It's in transit and scheduled to reach the next checkpoint at [Location] by [Time]."
  
        Context: ${data}
  
        Question: ${question}
      `;
    } else if (Utils.isCurrentExcursionQuery(question)) {
        return `
        Instructions: You are monitoring current temperature excursions in real-time.
        Based on the provided data, identify shipments with active temperature excursions.
  
        Format your response exactly like this:
        "Currently, Shipment IDs [X] and [Y] are experiencing temperature excursions. 
        Shipment [X] has exceeded the maximum permissible temperature by [X degrees], 
        and Shipment [Y] is under the minimum threshold by [Y degrees]. 
        Alerts have been triggered for both, and recommended actions are underway."
  
        Context: ${data}
  
        Question: ${question}
      `;
    } else if (Utils.isRiskAssessmentQuery(question)) {
        return `
        Instructions: You are assessing temperature excursion risks for shipments.
        Based on the provided data, identify shipments at risk of temperature excursions.
  
        Format your response exactly like this:
        "Based on current transit conditions, Shipment IDs [A, B, and C] are at higher risk 
        of temperature excursions due to factors like [specific reasons]."
  
        Context: ${data}
  
        Question: ${question}
      `;
    } else {
        return `
        Instructions: You are a domain expert of the below mentioned context. 
        Provide an accurate and relevant answer based on the context. 
        Ensure that the information provided is directly related to the question. 
        In cases where the responses are long, summarise them into 2 or 3 relevant sentences.
  
        Context: ${data}
  
        Question: ${question}
      `;
    }
}
