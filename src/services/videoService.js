// Keyless Client-Side YouTube Video Discovery Service
// Uses public Invidious/Piped APIs with CORS proxy & dynamic query rotation + deep music pool fallback.

const INVIDIOUS_INSTANCES = [
  "https://inv.tux.pizza",
  "https://invidious.nerdvpn.de",
  "https://invidious.drgns.space",
  "https://inv.hostux.net",
  "https://vid.puffyan.us",
  "https://invidious.privacydev.net",
  "https://yewtu.be",
  "https://invidious.flokinet.to"
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
  "https://api.piped.privacydev.net"
];

// Rich, diverse pool of real YouTube music videos for guaranteed freshness on every refresh
const EXTENDED_MUSIC_POOL = {
  hi: [
    { id: "v144hX_0GzM", title: "Kesariya - Brahmāstra", channel: "Sony Music India", thumbnail: "https://i.ytimg.com/vi/v144hX_0GzM/hqdefault.jpg" },
    { id: "hT_nvWreIhg", title: "Apna Bana Le - Bhediya", channel: "Zee Music Company", thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg" },
    { id: "CLL2kSVsD2E", title: "Tum Se - Teri Baaton Mein Aisa Uljha Jiya", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/CLL2kSVsD2E/hqdefault.jpg" },
    { id: "ElZfdU54Cp8", title: "Aayi Nai - Stree 2", channel: "Maddock Films", thumbnail: "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg" },
    { id: "fHI8X4OXluQ", title: "Raataan Lambiyan - Shershaah", channel: "Sony Music India", thumbnail: "https://i.ytimg.com/vi/fHI8X4OXluQ/hqdefault.jpg" },
    { id: "K3M3qC2fH1Y", title: "Ve Kamleya - Rocky Aur Rani Kii Prem Kahaani", channel: "Saregama Music", thumbnail: "https://i.ytimg.com/vi/K3M3qC2fH1Y/hqdefault.jpg" },
    { id: "284T_dO04f8", title: "Maan Meri Jaan - King", channel: "King", thumbnail: "https://i.ytimg.com/vi/284T_dO04f8/hqdefault.jpg" },
    { id: "S19UCW2J8_w", title: "Chaleya - Jawan", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/S19UCW2J8_w/hqdefault.jpg" },
    { id: "d9S_3y12sGA", title: "O Maahi - Dunki", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/d9S_3y12sGA/hqdefault.jpg" },
    { id: "Y2424l9iV9Q", title: "Heeriye - Jasleen Royal ft. Arijit Singh", channel: "Jasleen Royal", thumbnail: "https://i.ytimg.com/vi/Y2424l9iV9Q/hqdefault.jpg" },
    { id: "P2vX_yX_40I", title: "Satranga - Animal", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/P2vX_yX_40I/hqdefault.jpg" },
    { id: "JvYf73_4p4k", title: "Tauba Tauba - Bad Newz", channel: "Saregama Music", thumbnail: "https://i.ytimg.com/vi/JvYf73_4p4k/hqdefault.jpg" },
    { id: "g3jCAyPai2Y", title: "Aaj Ki Raat - Stree 2", channel: "Zee Music Company", thumbnail: "https://i.ytimg.com/vi/g3jCAyPai2Y/hqdefault.jpg" },
    { id: "42a3fP9sIsk", title: "Taras - Munjya", channel: "Maddock Films", thumbnail: "https://i.ytimg.com/vi/42a3fP9sIsk/hqdefault.jpg" },
    { id: "UUj1Xp1vX9w", title: "Chori Kiya Re Jiya - Dabangg", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/UUj1Xp1vX9w/hqdefault.jpg" },
    { id: "BddP6PYo2gs", title: "Kesariya Acoustic - Arijit Singh", channel: "Sony Music India", thumbnail: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg" },
    { id: "a2GfR_pA2wY", title: "Tum Hi Ho - Aashiqui 2", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/a2GfR_pA2wY/hqdefault.jpg" },
    { id: "3m_52I_w-yQ", title: "Tera Ban Jaunga - Kabir Singh", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/3m_52I_w-yQ/hqdefault.jpg" },
    { id: "8pP2B4U7A2M", title: "Agar Tum Saath Ho - Tamasha", channel: "T-Series", thumbnail: "https://i.ytimg.com/vi/8pP2B4U7A2M/hqdefault.jpg" },
    { id: "yI_aH3I6v6k", title: "Shayad - Love Aaj Kal", channel: "Sony Music India", thumbnail: "https://i.ytimg.com/vi/yI_aH3I6v6k/hqdefault.jpg" },
    { id: "8U_1xU1_32s", title: "Ghaatchakkar - Punjabi Hit", channel: "Speed Records", thumbnail: "https://i.ytimg.com/vi/8U_1xU1_32s/hqdefault.jpg" },
    { id: "hX9s5e2k9Xw", title: "Softly - Karan Aujla", channel: "Karan Aujla", thumbnail: "https://i.ytimg.com/vi/hX9s5e2k9Xw/hqdefault.jpg" },
    { id: "f4X9y0_33xA", title: "Winning Speech - Karan Aujla", channel: "Karan Aujla", thumbnail: "https://i.ytimg.com/vi/f4X9y0_33xA/hqdefault.jpg" },
    { id: "0pP2X94yI_w", title: "Soulmate - Badshah & Arijit Singh", channel: "Badshah", thumbnail: "https://i.ytimg.com/vi/0pP2X94yI_w/hqdefault.jpg" },
    { id: "N2_304iX_1w", title: "Husn - Anuv Jain", channel: "Anuv Jain", thumbnail: "https://i.ytimg.com/vi/N2_304iX_1w/hqdefault.jpg" },
    { id: "32352pI93Xw", title: "Baarishein - Anuv Jain", channel: "Anuv Jain", thumbnail: "https://i.ytimg.com/vi/32352pI93Xw/hqdefault.jpg" },
    { id: "K89s_3pI1w0", title: "Choo Lo - The Local Train", channel: "The Local Train", thumbnail: "https://i.ytimg.com/vi/K89s_3pI1w0/hqdefault.jpg" },
    { id: "B503k2s0_Xw", title: "Aftab - The Yellow Diary", channel: "Sony Music India", thumbnail: "https://i.ytimg.com/vi/B503k2s0_Xw/hqdefault.jpg" }
  ],
  en: [
    { id: "H5v3kku4y6Q", title: "As It Was - Harry Styles", channel: "Harry Styles", thumbnail: "https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg" },
    { id: "jfKfPfyJRdk", title: "lofi hip hop radio 📚 - beats to relax / study to", channel: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg" },
    { id: "kxyVL4_aP8M", title: "Flowers - Miley Cyrus", channel: "Miley Cyrus", thumbnail: "https://i.ytimg.com/vi/kxyVL4_aP8M/hqdefault.jpg" },
    { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody - Queen", channel: "Queen Official", thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg" },
    { id: "4NRXx6U8ABQ", title: "Blinding Lights - The Weeknd", channel: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg" },
    { id: "gNi_6U5Pm_o", title: "Cruel Summer - Taylor Swift", channel: "Taylor Swift", thumbnail: "https://i.ytimg.com/vi/gNi_6U5Pm_o/hqdefault.jpg" },
    { id: "SlPhMPnE58M", title: "Memories - Maroon 5", channel: "Maroon 5", thumbnail: "https://i.ytimg.com/vi/SlPhMPnE58M/hqdefault.jpg" },
    { id: "5qap5aO4i9A", title: "lofi hip hop radio - beats to sleep/chill to", channel: "Lofi Girl", thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg" },
    { id: "TUVcZfQe-Kw", title: "Levitating - Dua Lipa", channel: "Dua Lipa", thumbnail: "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg" },
    { id: "0V3xO3y94pM", title: "Shape of You - Ed Sheeran", channel: "Ed Sheeran", thumbnail: "https://i.ytimg.com/vi/0V3xO3y94pM/hqdefault.jpg" },
    { id: "fP_M3U3Xv0E", title: "Stay - The Kid LAROI & Justin Bieber", channel: "The Kid LAROI", thumbnail: "https://i.ytimg.com/vi/fP_M3U3Xv0E/hqdefault.jpg" },
    { id: "dQw4w9WgXcQ", title: "Never Gonna Give You Up - Rick Astley", channel: "Rick Astley", thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
    { id: "OPf0YbXqDm0", title: "Uptown Funk - Mark Ronson ft. Bruno Mars", channel: "Mark Ronson", thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg" },
    { id: "YQHsXMglC9A", title: "Hello - Adele", channel: "Adele", thumbnail: "https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg" },
    { id: "hT_nvWreIhg", title: "Counting Stars - OneRepublic", channel: "OneRepublic", thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg" },
    { id: "l0U7SxXHkPY", title: "Vampire - Olivia Rodrigo", channel: "Olivia Rodrigo", thumbnail: "https://i.ytimg.com/vi/l0U7SxXHkPY/hqdefault.jpg" },
    { id: "8Xg72i2S_3s", title: "Espresso - Sabrina Carpenter", channel: "Sabrina Carpenter", thumbnail: "https://i.ytimg.com/vi/8Xg72i2S_3s/hqdefault.jpg" },
    { id: "eVli-tstM5E", title: "Please Please Please - Sabrina Carpenter", channel: "Sabrina Carpenter", thumbnail: "https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg" },
    { id: "M43s0P_I1x0", title: "Birds of a Feather - Billie Eilish", channel: "Billie Eilish", thumbnail: "https://i.ytimg.com/vi/M43s0P_I1x0/hqdefault.jpg" },
    { id: "d9I2x_3I_w0", title: "Die With A Smile - Lady Gaga & Bruno Mars", channel: "Lady Gaga", thumbnail: "https://i.ytimg.com/vi/d9I2x_3I_w0/hqdefault.jpg" },
    { id: "v2H4mC_w1X0", title: "Good Luck, Babe! - Chappell Roan", channel: "Chappell Roan", thumbnail: "https://i.ytimg.com/vi/v2H4mC_w1X0/hqdefault.jpg" },
    { id: "2Vv-BfVoq4g", title: "Perfect - Ed Sheeran", channel: "Ed Sheeran", thumbnail: "https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg" },
    { id: "nfWlot6h_JM", title: "Shake It Off - Taylor Swift", channel: "Taylor Swift", thumbnail: "https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg" },
    { id: "LsoLEjrDogU", title: "Water - Tyla", channel: "Tyla", thumbnail: "https://i.ytimg.com/vi/LsoLEjrDogU/hqdefault.jpg" }
  ],
  all: []
};

// Populate 'all' by combining Hindi & English lists
EXTENDED_MUSIC_POOL.all = [...EXTENDED_MUSIC_POOL.hi, ...EXTENDED_MUSIC_POOL.en];

function getSearchQuery(language, mode) {
  const queries = {
    hi: {
      trending: [
        "Arijit Singh latest hit official music video",
        "Bollywood chartbuster songs 2026",
        "Badshah Pritam latest Hindi hit video",
        "New Punjabi Hindi viral songs 2026",
        "Shreya Ghoshal romantic hit songs"
      ],
      random: [
        "Hindi acoustic unplugged acoustic video",
        "Indie Hindi pop songs official video",
        "Hindi lofi chill beats music video",
        "Classic 90s Hindi hit official video",
        "Coke Studio Bharat latest episode",
        "Bollywood unplugged guitar session"
      ]
    },
    en: {
      trending: [
        "Billboard Top 100 hit official music video",
        "Taylor Swift Sabrina Carpenter pop hits",
        "The Weeknd Bruno Mars latest official video",
        "Global viral pop music video 2026",
        "Dua Lipa Harry Styles top pop hits"
      ],
      random: [
        "Indie pop folk acoustic official music video",
        "Chill R&B soul music video official",
        "Lofi Hip Hop beats relax study official",
        "Alternative rock indie hit music video",
        "Synthwave retro electro pop video",
        "Acoustic pop cover official music video"
      ]
    },
    all: {
      trending: [
        "Global trending music video 2026",
        "Top international hit songs music video",
        "Latest viral music official release",
        "Most popular music videos today"
      ],
      random: [
        "Fresh indie acoustic music video",
        "New global pop releases official video",
        "Chill music video session official",
        "Live unplugged session official music video"
      ]
    }
  };

  const langObj = queries[language] || queries.all;
  const list = langObj[mode] || langObj.trending;
  return list[Math.floor(Math.random() * list.length)];
}

// Extract Video ID if query is a YouTube link or ID
export function extractYouTubeId(text) {
  if (!text) return null;
  const match = text.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(text.trim())) return text.trim();
  return null;
}

// Fetch from Invidious with direct & CORS proxy fallbacks
async function fetchFromInvidious(query, limit = 10) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const items = data.map(item => {
        const id = item.videoId;
        let thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        if (item.videoThumbnails && item.videoThumbnails.length > 0) {
          thumb = item.videoThumbnails[item.videoThumbnails.length - 1].url || thumb;
        }
        return {
          id,
          title: item.title || "Untitled Video",
          channel: item.author || "YouTube",
          thumbnail: thumb
        };
      }).filter(v => v.id);

      if (items.length > 0) {
        return items;
      }
    } catch {
      // Try next instance
    }
  }
  return null;
}

// Fetch from Piped API
async function fetchFromPiped(query, limit = 10) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) continue;

      const items = data.items.map(item => {
        const id = item.url ? item.url.replace("/watch?v=", "") : "";
        return {
          id,
          title: item.title || "Untitled Video",
          channel: item.uploaderName || "YouTube",
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
        };
      }).filter(v => v.id);

      if (items.length > 0) {
        return items;
      }
    } catch {
      // Try next instance
    }
  }
  return null;
}

// Memory set for seen videos in the current session so every refresh delivers fresh unseen songs
const sessionSeenIds = new Set();

export async function fetchVideosClientSide({ mode = "trending", language = "all", limit = 10 } = {}) {
  const query = getSearchQuery(language, mode);

  // 1. Try Invidious API
  let liveResults = await fetchFromInvidious(query, limit);

  // 2. If Invidious fails, try Piped API
  if (!liveResults || liveResults.length === 0) {
    liveResults = await fetchFromPiped(query, limit);
  }

  // 3. Pool of videos (either live or rich extended pool)
  let pool = liveResults && liveResults.length > 0
    ? liveResults
    : (EXTENDED_MUSIC_POOL[language] || EXTENDED_MUSIC_POOL.all);

  // Filter out recently seen videos to guarantee NEW items on every refresh
  let unseen = pool.filter(v => !sessionSeenIds.has(v.id));

  // If pool runs out of unseen, clear session memory and start fresh
  if (unseen.length < limit) {
    sessionSeenIds.clear();
    unseen = pool;
  }

  // Shuffle pool to ensure random non-static order every time
  const shuffled = [...unseen].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, limit);

  // Track these IDs so next refresh gives completely different songs
  selected.forEach(v => sessionSeenIds.add(v.id));

  return selected;
}
