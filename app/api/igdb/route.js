import { NextResponse } from "next/server";

const fallbackGames = [
  {
    id: "switch2-mario-kart-world",
    name: "Mario Kart World",
    summary:
      "A high-speed racer built for the new console generation, with a bright arcade feel and a huge roster of favorites.",
    cover:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    genres: ["Racing", "Arcade"],
    platforms: ["Nintendo Switch 2"],
    releaseYear: "2025",
    cartType: "Physical Cartridge",
  },
  {
    id: "switch2-metroid-prime-4",
    name: "Metroid Prime 4",
    summary:
      "A cinematic sci-fi adventure that mixes exploration, upgrades, and environmental storytelling in a polished package.",
    cover:
      "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80",
    genres: ["Action", "Adventure"],
    platforms: ["Nintendo Switch 2"],
    releaseYear: "2025",
    cartType: "Collector's Edition",
  },
  {
    id: "switch2-splatoon-4",
    name: "Splatoon 4",
    summary:
      "An energetic multiplayer shooter with vibrant art and a heavy focus on team-based battles and customization.",
    cover:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    genres: ["Shooter", "Party"],
    platforms: ["Nintendo Switch 2"],
    releaseYear: "2026",
    cartType: "Digital",
  },
  {
    id: "switch2-zelda-next",
    name: "Legend of Zelda: Echoes of the Horizon",
    summary:
      "A sweeping fantasy quest with responsive movement, puzzle design, and a strong sense of place.",
    cover:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    genres: ["Action Adventure", "Fantasy"],
    platforms: ["Nintendo Switch 2"],
    releaseYear: "2026",
    cartType: "Physical Cartridge",
  },
];

function normalizeGame(rawGame, index) {
  const genres =
    rawGame?.genres?.map((genre) => genre.name || genre).filter(Boolean) || [];
  const platforms =
    rawGame?.platforms?.map((platform) => platform.name || platform).filter(Boolean) || [];
  const releaseYear = rawGame?.first_release_date
    ? new Date(rawGame.first_release_date * 1000).getFullYear()
    : "TBA";
  const cartType =
    index % 3 === 0
      ? "Physical Cartridge"
      : index % 3 === 1
        ? "Collector's Edition"
        : "Digital";

  return {
    id: String(rawGame?.id ?? index),
    name: rawGame?.name ?? "Untitled game",
    summary:
      rawGame?.summary ??
      "A polished Nintendo Switch 2 launch title with strong collection appeal.",
    cover: rawGame?.cover?.url
      ? rawGame.cover.url.replace("t_thumb", "t_cover_big")
      : fallbackGames[index % fallbackGames.length].cover,
    genres: genres.length ? genres : fallbackGames[index % fallbackGames.length].genres,
    platforms: platforms.length ? platforms : ["Nintendo Switch 2"],
    releaseYear,
    cartType,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? "Nintendo Switch 2";
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      games: fallbackGames.map((game) => ({
        ...game,
        platforms: game.platforms.includes(platform)
          ? game.platforms
          : [...game.platforms, platform],
      })),
      source: "fallback",
    });
  }

  try {
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Unable to fetch IGDB access token");
    }

    const tokenData = await tokenResponse.json();
    const queryBody = `fields name,summary,cover.url,genres.name,platforms.name,first_release_date; where platforms.name ~ *"${platform.replace(/"/g, "")}"*; limit 12;`;

    const gamesResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "text/plain",
      },
      body: queryBody,
    });

    if (!gamesResponse.ok) {
      throw new Error("Unable to fetch IGDB games");
    }

    const games = await gamesResponse.json();
    return NextResponse.json({
      games: games.map((game, index) => normalizeGame(game, index)),
      source: "igdb",
    });
  } catch {
    return NextResponse.json({
      games: fallbackGames.map((game) => ({
        ...game,
        platforms: game.platforms.includes(platform)
          ? game.platforms
          : [...game.platforms, platform],
      })),
      source: "fallback",
    });
  }
}
