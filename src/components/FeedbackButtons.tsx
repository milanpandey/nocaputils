"use client";

import { usePathname } from "next/navigation";
import {
  FEATURE_REQUEST_URL,
  GENERIC_FEEDBACK_URL,
  TOOL_FEEDBACK_URLS,
} from "@/lib/constants";

/** Pages that use the generic (non-prefilled) feedback URL */
const GENERIC_FEEDBACK_PATHS = new Set(["/", "/blog"]);

export default function FeedbackButtons() {
  const pathname = usePathname();

  // Strip trailing slash for consistent matching
  const normalised = pathname.replace(/\/$/, "") || "/";

  // Determine whether this is a blog sub-page
  const isBlogPage = normalised.startsWith("/blog");

  // Pick the right feedback URL
  const feedbackUrl =
    GENERIC_FEEDBACK_PATHS.has(normalised) || isBlogPage
      ? GENERIC_FEEDBACK_URL
      : (TOOL_FEEDBACK_URLS[normalised] ?? GENERIC_FEEDBACK_URL);

  return (
    <div className="feedback-tab-group" aria-label="Site feedback">
      {/* ── Tool Feedback ─────────────────────────────────── */}
      <a
        href={feedbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="feedback-tab feedback-tab--feedback"
        aria-label="Give feedback on this tool"
      >
        Feedback
      </a>

      {/* ── Feature Request ───────────────────────────────── */}
      <a
        href={FEATURE_REQUEST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="feedback-tab feedback-tab--feature"
        aria-label="Request a new feature"
      >
        Feature&nbsp;Request
      </a>
    </div>
  );
}
