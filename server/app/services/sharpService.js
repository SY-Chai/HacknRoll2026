import axios from "axios";

/**
 * Calls the SHARP 3DGS service to generate 3D Gaussian Splats from images.
 *
 * @param {string[]} imageUrls - Array of image URLs to process
 * @returns {Promise<Array<{ply_url: string, status: string} | null>>} - Array of results containing PLY URLs
 */
export async function generate3DGaussians(imageUrls) {
  const SHARP_API_URL = process.env.SHARP_API_URL;
  const SHARP_API_TOKEN = process.env.SHARP_API_TOKEN;

  if (!SHARP_API_URL) {
    console.warn(
      "SHARP_API_URL is not defined in environment variables. Skipping 3D generation.",
    );
    return null;
  }

  // Filter out invalid URLs
  const urls = imageUrls.filter(
    (url) => url && typeof url === "string" && url.startsWith("http"),
  );

  if (urls.length === 0) {
    return [];
  }

  try {
    console.log(
      `Sending ${urls.length} images to SHARP 3DGS service at ${SHARP_API_URL}...`,
    );

    const payload = {
      input: {
        images: urls.map((url) => ({ image_url: url })),
      },
    };

    const headers = {
      "Content-Type": "application/json",
    };

    if (SHARP_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SHARP_API_TOKEN}`;
    }

    // Long timeout as 3D generation can be slow
    const response = await axios.post(SHARP_API_URL, payload, {
      headers,
      timeout: 600000, // 10 minutes
    });

    const output = response.data;

    console.log(output);

    // Handle RunPod output structure
    // Sometimes it's directly the result, sometimes wrapped in 'output'
    let resultData = output;
    if (output.output) {
      resultData = output.output;
    }

    if (resultData.status === "success" || resultData.status === "partial") {
      if (Array.isArray(resultData.results)) {
        return resultData.results.map((r) => {
          if (r && r.status === "success") {
            return {
              ply_url: r.ply_url,
              status: "success",
            };
          } else {
            return null;
          }
        });
      }
    }

    console.error(
      "SHARP Service reported error or unexpected format:",
      resultData,
    );
    return null;
  } catch (error) {
    console.error("SHARP 3DGS Request Failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    return null;
  }
}
