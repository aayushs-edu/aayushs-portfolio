"use client";

import { ArrowUp } from "lucide-react";
import css from "./Footer.module.css";
import { GitHubMark, LinkedInMark, MailMark } from "./marks";

/** The work, in page order: each link jumps to its section (from any page, through the home page). */
const SECTIONS = [
  { label: "Paintwise", id: "paintwise" },
  { label: "Hackathons", id: "hackathons" },
  { label: "Paintings", id: "paintings" },
  { label: "Games", id: "games" },
  { label: "Animation", id: "animation" },
];

const EMAIL = "aayushs2008@gmail.com";

const CONTACTS = [
  { label: "GitHub", href: "https://github.com/aayushs-edu", Mark: GitHubMark, size: css.markRound },
  { label: "LinkedIn", href: "https://linkedin.com/in/aayush-sharma-1420bb311", Mark: LinkedInMark, size: css.markSquare },
  { label: "Email", href: `mailto:${EMAIL}`, Mark: MailMark, size: css.markWide },
];

/**
 * The footer under every page: the name with the hero's three contact
 * marks, the sections of the one-page site, and a last line with the
 * copyright and a way back to the top. Set like the home page: the cream
 * Poppins name over the page's own dark, a hairline above.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={css.footer}>
      <div className={css.inner}>
        <div className={css.sign}>
          <p className={css.name}>Aayush Sharma</p>
          <ul className={css.contacts}>
            {CONTACTS.map(({ label, href, Mark, size }) => (
              <li key={label}>
                <a className={css.contact} href={href} aria-label={label} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Mark className={size} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className={css.sections} aria-label="Work">
          <ul>
            {SECTIONS.map(({ label, id }) => (
              <li key={id}>
                <a href={`/#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={css.base}>
        <p>© {year} Aayush Sharma</p>
        <button type="button" className={css.top} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
          Back to top
          <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
