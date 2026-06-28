"use client";

import { useEffect, useMemo, useState } from "react";

type CollectionState = {
  owned: string[];
  wishlist: string[];
};

const initialState: CollectionState = {
  owned: [],
  wishlist: [],
};

function getInitialState(): CollectionState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const stored = window.localStorage.getItem("switch2-collection");
    return stored ? JSON.parse(stored) : initialState;
  } catch {
    return initialState;
  }
}

export default function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterCart, setFilterCart] = useState("All");
  const [collection, setCollection] = useState<CollectionState>(getInitialState);

  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      const response = await fetch("/api/igdb?platform=Nintendo%20Switch%202");
      const data = await response.json();
      setGames(data.games ?? []);
      setLoading(false);
    }

    loadGames();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "switch2-collection",
        JSON.stringify(collection)
      );
    }
  }, [collection]);

  const genres = useMemo(() => {
    const values = new Set<string>();
    games.forEach((game) => {
      (game.genres ?? []).forEach((genre: string) => values.add(genre));
    });
    return ["All", ...Array.from(values).sort()];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const genreMatch =
        filterGenre === "All" || (game.genres ?? []).includes(filterGenre);
      const cartMatch =
        filterCart === "All" || game.cartType === filterCart;
      return genreMatch && cartMatch;
    });
  }, [filterGenre, filterCart, games]);

  const toggleCollection = (id: string, list: "owned" | "wishlist") => {
    setCollection((current) => {
      const currentIds = current[list];
      const exists = currentIds.includes(id);
      return {
        ...current,
        [list]: exists ? currentIds.filter((item) => item !== id) : [...currentIds, id],
      };
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_45%),linear-gradient(135deg,_#060816,_#111827)] px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">
                Nintendo Switch 2 collection tracker
              </p>
              <h1 className="text-4xl font-semibold sm:text-5xl">
                Keep your physical game shelf in sync with the latest launches.
              </h1>
              <p className="text-lg text-zinc-400">
                Browse upcoming and current Switch 2 titles, mark what you own,
                and track the games you still want to chase down.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">
              <p className="font-semibold">Collection snapshot</p>
              <p>{collection.owned.length} owned • {collection.wishlist.length} wishlisted</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">Filter catalog</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm text-zinc-400">
                Genre
                <select
                  value={filterGenre}
                  onChange={(event) => setFilterGenre(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm outline-none ring-0"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-zinc-400">
                Cart type
                <select
                  value={filterCart}
                  onChange={(event) => setFilterCart(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm outline-none ring-0"
                >
                  <option value="All">All</option>
                  <option value="Physical Cartridge">Physical Cartridge</option>
                  <option value="Collector's Edition">Collector's Edition</option>
                  <option value="Digital">Digital</option>
                </select>
              </label>
            </div>
          </aside>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-10 text-center text-zinc-400">
                Pulling Switch 2 titles from IGDB...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredGames.map((game) => {
                  const owned = collection.owned.includes(game.id);
                  const wishlisted = collection.wishlist.includes(game.id);

                  return (
                    <article
                      key={game.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 shadow-lg shadow-black/20"
                    >
                      <div className="h-40 w-full bg-zinc-800">
                        <img
                          src={game.cover}
                          alt={game.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-semibold">{game.name}</h3>
                            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">
                              {game.cartType}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">{game.summary}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(game.genres ?? []).slice(0, 3).map((genre: string) => (
                            <span
                              key={`${game.id}-${genre}`}
                              className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-zinc-400">
                          <span>Released {game.releaseYear}</span>
                          <span>{game.platforms?.[0] ?? "Nintendo Switch 2"}</span>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCollection(game.id, "owned")}
                            className={`flex-1 rounded-2xl px-3 py-2 text-sm font-medium transition ${owned ? "bg-emerald-500 text-emerald-950" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"}`}
                          >
                            {owned ? "Owned ✓" : "Mark owned"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCollection(game.id, "wishlist")}
                            className={`flex-1 rounded-2xl px-3 py-2 text-sm font-medium transition ${wishlisted ? "bg-fuchsia-500 text-white" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"}`}
                          >
                            {wishlisted ? "Wishlisted ✓" : "Wishlist"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
