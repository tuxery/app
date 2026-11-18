/**
 * One plain sentence on what a category holds, for the editorial
 * collections on /apps and /games (`~/components/section-magazine`). Keyed
 * by catalog's category label, which is also its id. A category without
 * one gets `categoryBlurb`'s generic sentence, so catalog can add a
 * category before this list names it.
 */
export const CATEGORY_BLURBS: Readonly<Record<string, string>> = {
  // Apps
  "Web Browsers":
    "Firefox, Chromium and the independent browsers, each from every source that packages it.",
  "Messaging & Calls": "Chat, voice and video clients, from Signal and Telegram to Matrix and IRC.",
  Email: "Mail clients for reading, sorting and sending email from the desktop.",
  "Social Media": "Desktop clients for Mastodon, Bluesky and other social networks.",
  "File Sharing & Downloads":
    "Torrent clients, download managers and tools to send files to other people.",
  Networking: "Tools to set up, inspect and troubleshoot networks and remote connections.",
  "Graphics & Design":
    "Painting, drawing, vector design and 3D modelling, from GIMP and Inkscape to Blender.",
  "Photo & Video": "Players, photo managers and editors for pictures and video.",
  "Music & Audio": "Music players, audio editors, recording studios and sound tools.",
  Productivity: "Office suites, notes, calendars and to-do lists.",
  Business: "Accounting, invoicing, project and customer management.",
  Finance: "Personal budgets, banking and cryptocurrency wallets.",
  AI: "Chat assistants and tools to run language models on your own machine.",
  Education: "Apps to learn languages, maths, typing and more, for children and adults.",
  Science: "Calculators, astronomy, chemistry, statistics and lab tools.",
  "Books & Reference": "E-book readers, dictionaries and offline encyclopedias.",
  "News & Weather": "Feed readers, news clients and weather forecasts.",
  "Travel & Navigation": "Maps, route planners and GPS tools.",
  "Developer Tools": "Editors, IDEs, debuggers, version control and the rest of a developer's kit.",
  "System Tools": "Terminals, monitors, disk and package tools to look after the system.",
  Security: "Password managers, encryption, VPNs and privacy tools.",
  Settings: "Tools to configure the desktop, hardware and system services.",
  Utilities: "Small everyday tools: archives, clipboards, screenshots, converters.",
  "Gaming Tools": "Launchers, emulators, game engines and tools that make other games run.",
  // Games
  Action: "Platformers, brawlers and arcade games where reflexes count.",
  Adventure: "Story-driven games of exploration and puzzles, point-and-click included.",
  Arcade: "Short, fast games in the spirit of the arcade cabinets.",
  "Board & Cards": "Chess, card games, solitaire and digital board games.",
  "Music & Rhythm": "Games played to the beat, from rhythm games to music toys.",
  Puzzle: "Logic, tile and physics puzzles to solve at your own pace.",
  Racing: "Karts, rally, racing cars and driving games.",
  "Role-Playing": "Role-playing games and roguelikes: build a character, explore, level up.",
  Shooter: "First- and third-person shooters, arena games and shoot 'em ups.",
  Simulation: "City builders, management and simulation games.",
  Sports: "Football, golf, skating and other sports games.",
  Strategy: "Turn-based and real-time strategy: plan, build and outthink the opponent.",
};

/** The category's sentence, or a generic one naming it. */
export function categoryBlurb(category: string, title: string): string {
  return (
    CATEGORY_BLURBS[category] ?? `The most popular ${title.toLowerCase()}, across every source.`
  );
}
