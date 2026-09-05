import axios from "axios";

// Calls the Python AI microservice per docs/api-contract.md.
// This is the ONLY place that talks to the AI service - keep it that way.
export async function analyzeImage(imageBase64, panelWidthCm, panelHeightCm) {
  const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/analyze`, {
    image_base64: imageBase64,
    panel_width_cm: panelWidthCm,
    panel_height_cm: panelHeightCm,
  });
  return data; // { extracted_text, declarations, overall_status, violations }
}
