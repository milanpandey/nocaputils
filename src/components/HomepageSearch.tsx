"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomepageSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/tools");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="neo-search-wrapper">
      <span className="neo-search-icon" aria-hidden="true">🔍</span>
      <input
        type="text"
        className="neo-search"
        placeholder="Search all tools…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="homepage-search"
      />
    </form>
  );
}
