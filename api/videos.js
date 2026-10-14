// Deprecated: FreshTunes now runs 100% client-side without any backend serverless API or YouTube API key.
// All video discovery is handled directly in src/services/videoService.js.
export default function handler(req, res) {
  return res.status(200).json({
    message: "FreshTunes is now 100% client-side! No backend API is needed."
  });
}
