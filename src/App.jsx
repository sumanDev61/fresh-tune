import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Play, SkipBack, SkipForward, Shuffle, Music2,
  Flame, Globe2, Languages, Heart, ListMusic, X, Menu, Sliders, ArrowDown, RotateCw, AlertCircle, ArrowUpRight
} from "lucide-react";
import { fetchVideosClientSide, extractYouTubeId } from "./services/videoService.js";

const FILTERS = [
  { id: "all", label: "For you", icon: Music2 },
  { id: "hi", label: "Hindi", icon: Languages },
  { id: "en", label: "English", icon: Globe2 }
];

function getPlayed() {
  try { return JSON.parse(localStorage.getItem("freshtunes-played") || "[]"); }
  catch { return []; }
}

function getYouTubeSearchUrl(title, channel) {
  const query = `${title} ${channel || ""}`.trim();
  const encodedQuery = encodeURIComponent(query);
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    return `intent://www.youtube.com/results?search_query=${encodedQuery}#Intent;package=com.google.android.youtube;scheme=https;end;`;
  }
  return `https://www.youtube.com/results?search_query=${encodedQuery}`;
}

function handleYouTubeClick(e, title, channel) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const query = `${title} ${channel || ""}`.trim();
  const encodedQuery = encodeURIComponent(query);
  const webSearchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    // Directly launch YouTube App on Android
    window.location.href = `intent://www.youtube.com/results?search_query=${encodedQuery}#Intent;package=com.google.android.youtube;scheme=https;end;`;
  } else if (isIOS) {
    // Launch YouTube App on iOS with web fallback
    window.location.href = `youtube://www.youtube.com/results?search_query=${encodedQuery}`;
    setTimeout(() => {
      window.open(webSearchUrl, "_blank");
    }, 1200);
  } else {
    window.open(webSearchUrl, "_blank");
  }
}

export default function App() {
  const [language, setLanguage] = useState("all");
  const [mode, setMode] = useState("trending");
  const [videos, setVideos] = useState([]);
  const [current, setCurrent] = useState(null);
  const [played, setPlayed] = useState(getPlayed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);

  const loadVideos = useCallback(async ({ fresh = false, nextMode = mode, nextLanguage = language } = {}) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      let list = await fetchVideosClientSide({ mode: nextMode, language: nextLanguage, limit: 10 });
      const recentlyPlayed = getPlayed();
      const notRecentlyPlayed = list.filter(v => !recentlyPlayed.includes(v.id));
      if (notRecentlyPlayed.length >= Math.min(3, list.length)) {
        list = notRecentlyPlayed;
      }
      list = list.slice(0, 10);
      setVideos(list);
      if (!list.length) setNotice("Is filter ke liye abhi videos nahi mile. Doosra filter try karo.");
      if (fresh && list.length) setNotice("10 new songs loaded based on your preferences!");
    } catch (e) {
      setError(e.message || "Videos load nahi ho paaye.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [language, mode]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  // Listen for YouTube iframe embed errors (e.g., restricted playback code 101/150)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && data.event === "onError") {
          const errCode = data.info;
          if (errCode === 101 || errCode === 150 || errCode === 100 || errCode === 2 || errCode === 5) {
            setEmbedError(true);
          }
        }
      } catch {
        // ignore non-json messages
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Touch handlers for Pull-to-refresh
  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && e.touches.length === 1) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 90));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    if (pullDistance > 60 && !loading) {
      loadVideos({ fresh: true });
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return videos;

    // Direct YouTube URL or Video ID check
    const extractedId = extractYouTubeId(q);
    if (extractedId) {
      return [{
        id: extractedId,
        title: `Custom Video (${extractedId})`,
        channel: "YouTube",
        thumbnail: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`
      }];
    }

    return videos.filter(v => `${v.title} ${v.channel}`.toLowerCase().includes(q)).slice(0, 10);
  }, [videos, search]);

  const markPlayed = (video) => {
    setCurrent(video);
    setEmbedError(false);
    const next = [video.id, ...played.filter(id => id !== video.id)].slice(0, 100);
    setPlayed(next);
    try { localStorage.setItem("freshtunes-played", JSON.stringify(next)); } catch {}
  };

  const playNext = () => {
    if (!filteredVideos.length) return;
    const index = filteredVideos.findIndex(v => v.id === current?.id);
    markPlayed(filteredVideos[(index + 1 + filteredVideos.length) % filteredVideos.length]);
  };

  const playPrevious = () => {
    if (!filteredVideos.length) return;
    const index = filteredVideos.findIndex(v => v.id === current?.id);
    markPlayed(filteredVideos[(index - 1 + filteredVideos.length) % filteredVideos.length]);
  };

  const changeLanguage = (value) => {
    setLanguage(value);
    loadVideos({ fresh: true, nextLanguage: value });
  };

  const changeMode = (value) => {
    setMode(value);
    loadVideos({ fresh: true, nextMode: value });
  };

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="topbar">
        <a className="brand" href="#" aria-label="FreshTunes home" onClick={(e) => { e.preventDefault(); loadVideos({ fresh: true }); }}>
          <span className="brand-icon"><Music2 size={21} /></span>
          <span>Fresh<span className="brand-light">Tunes</span></span>
        </a>

        <div className={`searchbar ${mobileSearch ? "searchbar-open" : ""}`}>
          <Search size={18} />
          <input aria-label="Search videos" placeholder="Search songs, artists, or paste YouTube URL" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="icon-button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16}/></button>}
        </div>

        <div className="top-actions">
          <button className="icon-button mobile-search-button" aria-label="Search" onClick={() => setMobileSearch(v => !v)}><Search size={20}/></button>
          <button className="icon-button menu-toggle-button" aria-label="Menu & Preferences" onClick={() => setMenuOpen(true)}>
            <Menu size={22}/>
          </button>
        </div>
      </header>

      {/* Preferences & Side Menu Overlay */}
      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <Sliders size={20}/>
                <h3>Preferences & Settings</h3>
              </div>
              <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20}/></button>
            </div>

            <div className="drawer-body">
              <div className="pref-group">
                <label>Music Language</label>
                <div className="pref-options">
                  {FILTERS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className={`pref-chip ${language === id ? "active" : ""}`}
                      onClick={() => changeLanguage(id)}
                    >
                      <Icon size={16}/> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-group">
                <label>Discovery Mode</label>
                <div className="pref-options">
                  <button
                    className={`pref-chip ${mode === "trending" ? "active" : ""}`}
                    onClick={() => changeMode("trending")}
                  >
                    <Flame size={16}/> Trending Hits
                  </button>
                  <button
                    className={`pref-chip ${mode === "random" ? "active" : ""}`}
                    onClick={() => changeMode("random")}
                  >
                    <Shuffle size={16}/> Random Discoveries
                  </button>
                </div>
              </div>

              <div className="pref-group">
                <label>Songs per batch</label>
                <div className="batch-info">
                  <span>10 Songs per load (Pull down to refresh new ones)</span>
                </div>
              </div>

              <div className="pref-group">
                <label>Recent History</label>
                <p className="pref-desc">{played.length} played videos saved to avoid repeats.</p>
                <button className="text-button clear-btn" onClick={() => { setPlayed([]); try { localStorage.removeItem("freshtunes-played"); } catch {} }}>
                  Clear History
                </button>
              </div>
            </div>

            <div className="drawer-footer">
              <button className="primary-button full-btn" onClick={() => { setMenuOpen(false); loadVideos({ fresh: true }); }}>
                <RotateCw size={16}/> Apply & Load 10 Songs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pull down to refresh visual banner */}
      <div
        className="pull-refresh-indicator"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div className="pull-content">
          <ArrowDown size={18} className={pullDistance > 60 ? "rotate-up" : ""} />
          <span>{pullDistance > 60 ? "Release to refresh 10 new songs" : "Pull down to refresh 10 new songs"}</span>
        </div>
      </div>

      <main className="main-layout">
        <section className="content-column">
          {/* Sticky Horizontal Filter Bar */}
          <nav className="filter-row sticky-filters" aria-label="Language filters">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`filter-chip ${language === id ? "active" : ""}`} onClick={() => changeLanguage(id)}>
                <Icon size={16}/>{label}
              </button>
            ))}
            <span className="filter-divider"/>
            <button className={`filter-chip ${mode === "trending" ? "active-subtle" : ""}`} onClick={() => changeMode("trending")}><Flame size={16}/> Trending</button>
            <button className={`filter-chip ${mode === "random" ? "active-subtle" : ""}`} onClick={() => changeMode("random")}><Shuffle size={16}/> Random</button>
          </nav>

          {/* Standard Player Card */}
          <section className="player-card">
            <div className="player-heading">
              <div><span className="section-kicker">NOW PLAYING</span><h2>{current ? current.title : "Pick a song to begin"}</h2></div>
              {current && (
                <a
                  className="youtube-link"
                  href={getYouTubeSearchUrl(current.title, current.channel)}
                  onClick={(e) => handleYouTubeClick(e, current.title, current.channel)}
                  title="Search song in YouTube App"
                >
                  YouTube App <ArrowUpRight size={14}/>
                </a>
              )}
            </div>

            <div className="player-frame">
              {current ? (
                <iframe
                  key={current.id}
                  src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&rel=0&enablejsapi=1`}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="player-placeholder">
                  <div className="placeholder-disc"><Music2 size={34}/></div>
                  <p>Your music discovery starts here</p>
                  <span>Choose any video from the list below</span>
                </div>
              )}
            </div>

            {/* If video embedding is restricted by owner */}
            {embedError && current && (
              <div className="embed-error-banner">
                <div className="embed-error-info">
                  <AlertCircle size={20} className="error-icon" />
                  <div>
                    <strong>Playback Restricted by Owner</strong>
                    <p>Is video ki embedding YouTube owner dwara website par restricted hai.</p>
                  </div>
                </div>
                <div className="embed-error-actions">
                  <button
                    className="primary-button"
                    onClick={(e) => handleYouTubeClick(e, current.title, current.channel)}
                  >
                    <Search size={15} /> Open in YouTube App
                  </button>
                  <button className="secondary-button" onClick={playNext}>
                    <SkipForward size={15} /> Skip to Next Song
                  </button>
                </div>
              </div>
            )}

            <div className="player-controls">
              <div className="playing-label">
                <span className={current ? "equalizer" : "equalizer muted"}><i/><i/><i/></span>
                <span>{current ? current.channel : "FreshTunes player"}</span>
              </div>
              <div className="transport-controls">
                <button className="icon-button" aria-label="Previous video" onClick={playPrevious} disabled={!videos.length}><SkipBack size={19}/></button>
                <button className="play-control" aria-label="Play selected video" onClick={() => current ? markPlayed(current) : videos[0] && markPlayed(videos[0])}><Play size={19} fill="currentColor"/></button>
                <button className="icon-button" aria-label="Next video" onClick={playNext} disabled={!videos.length}><SkipForward size={19}/></button>
              </div>
              <span className="player-count">{played.length} played</span>
            </div>
          </section>

          {/* Pull to refresh bar / trigger */}
          <div className="pull-trigger-bar" onClick={() => loadVideos({ fresh: true })}>
            <RotateCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Loading 10 fresh songs..." : "Pull down or tap to load 10 fresh songs"}</span>
          </div>

          <div className="list-heading">
            <div>
              <span className="section-kicker">10 HANDPICKED SONGS</span>
              <h2>{mode === "random" ? "Random discoveries" : language === "hi" ? "Hindi music" : language === "en" ? "English music" : "Trending & fresh"}</h2>
            </div>
            <span className="result-count">{filteredVideos.length} / 10 videos</span>
          </div>

          {notice && <div className="notice"><span>{notice}</span></div>}
          {error && (
            <div className="error-panel">
              <strong>Couldn't load videos from network</strong>
              <p>{error}</p>
              <span>Try refreshing or picking a different language/filter.</span>
              <button onClick={() => loadVideos({ fresh: true })}>Try again</button>
            </div>
          )}
          {loading && <div className="loading-state"><span className="loader"/><p>Loading 10 fresh songs…</p></div>}
          {!loading && !error && filteredVideos.length === 0 && (
            <div className="empty-state"><ListMusic size={28}/><strong>No videos found</strong><span>Pull down or change filter to try again.</span></div>
          )}

          <div className="video-list">
            {!loading && filteredVideos.map((video, index) => (
              <button className={`video-row ${current?.id === video.id ? "selected" : ""}`} key={video.id} onClick={() => markPlayed(video)}>
                <span className="row-index">{current?.id === video.id ? <span className="equalizer"><i/><i/><i/></span> : String(index + 1).padStart(2, "0")}</span>
                <span className="video-thumb-wrap">
                  <img className="video-thumb" src={video.thumbnail} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`; }}/>
                  <span className="thumb-play"><Play size={17} fill="currentColor"/></span>
                </span>
                <span className="video-meta"><strong>{video.title}</strong><span>{video.channel}</span></span>
                <span className="row-actions">
                  <a
                    className="youtube-arrow-link"
                    href={getYouTubeSearchUrl(video.title, video.channel)}
                    onClick={(e) => handleYouTubeClick(e, video.title, video.channel)}
                    title={`Open "${video.title}" in YouTube App`}
                  >
                    <ArrowUpRight size={18} />
                  </a>
                </span>
              </button>
            ))}
          </div>

          <p className="disclaimer">Videos are provided by YouTube. Availability and playback depend on each video's embedding settings.</p>
        </section>

        <aside className="side-column">
          <div className="side-card discovery-card">
            <div className="side-card-icon"><Shuffle size={19}/></div>
            <span className="section-kicker">BREAK YOUR ROUTINE</span>
            <h3>Hear something unexpected.</h3>
            <p>Switch up the mix and find 10 fresh tracks beyond your usual listening loop.</p>
            <button className="primary-button" onClick={() => changeMode("random")}><Shuffle size={16}/> Surprise me (10 songs)</button>
          </div>
          <div className="side-card history-card">
            <div className="side-title"><h3>Recently played</h3><Heart size={17}/></div>
            {played.length ? <p className="history-copy">{played.length} videos saved in this browser's recent-play history.</p> : <p className="history-copy">Your listening history will show up here as you play videos.</p>}
            <button className="text-button" onClick={() => { setPlayed([]); try { localStorage.removeItem("freshtunes-played"); } catch {} }}>Clear history</button>
          </div>
          <div className="api-note">
            <span className="api-dot"/>
            <p>100% Client-Side YouTube Discovery. Drag down anytime to refresh 10 new songs.</p>
          </div>
        </aside>
      </main>
      <footer><span>FreshTunes</span><span>Client-Side Web App · Playback by YouTube</span></footer>
    </div>
  );
}