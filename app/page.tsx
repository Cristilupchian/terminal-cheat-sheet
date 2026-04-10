"use client"

import { useState, useMemo, useEffect, useRef, type ChangeEvent } from "react"
import {
  Copy,
  Check,
  Search,
  Terminal,
  Container,
  GitBranch,
  FileCode,
  Command,
  Keyboard,
  ChevronDown,
  TerminalSquare,
  Star,
  Plus,
  Download,
  Upload,
  Trash2,
} from "lucide-react"

type CommandRow = {
  cmd: string
  desc: string
  customId?: string
}

type Section = {
  id: string
  title: string
  icon: typeof Terminal
  commands: CommandRow[]
}

type CustomStoredEntry = {
  id: string
  sectionLabel: string
  cmd: string
  desc: string
  createdAt: number
  updatedAt: number
}

type CustomStoragePayload = {
  v: 1
  items: CustomStoredEntry[]
}

const FAVORITES_STORAGE_KEY = "terminal_cheatsheet_favorites"
const CUSTOM_STORAGE_KEY = "terminal_cheatsheet_custom_commands_v1"

function sectionMatchesFilter(filterId: string | null, sectionId: string): boolean {
  if (filterId === null) return true
  const byCategory: Record<string, string[]> = {
    wsl: ["wsl", "adv-wsl"],
    docker: ["docker", "adv-docker"],
    wpcli: ["wpcli", "adv-wpcli"],
    git: ["git", "adv-git"],
    aliases: ["aliases", "adv-aliases"],
    nano: ["nano"],
    "adv-powershell": ["adv-powershell"],
  }
  return byCategory[filterId]?.includes(sectionId) ?? false
}

function parseCustomStorage(raw: string | null): CustomStoredEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CustomStoragePayload | CustomStoredEntry[]
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e): e is CustomStoredEntry =>
          typeof e?.id === "string" &&
          typeof e?.sectionLabel === "string" &&
          typeof e?.cmd === "string" &&
          typeof e?.desc === "string"
      )
    }
    if (parsed && parsed.v === 1 && Array.isArray(parsed.items)) {
      return parsed.items.filter(
        (e): e is CustomStoredEntry =>
          typeof e?.id === "string" &&
          typeof e?.sectionLabel === "string" &&
          typeof e?.cmd === "string" &&
          typeof e?.desc === "string"
      )
    }
  } catch {
    // ignore
  }
  return []
}

const basicsSections: Section[] = [
  {
    id: "wsl",
    title: "WSL / Terminal",
    icon: Terminal,
    commands: [
      { cmd: "cd /mnt/c/dev", desc: "Go to dev folder" },
      { cmd: "cd ..", desc: "Go up one folder" },
      { cmd: "ls -la", desc: "List files with details" },
      { cmd: "pwd", desc: "Show current folder" },
      { cmd: "clear", desc: "Clear terminal" },
      { cmd: "mkdir project-name", desc: "Create folder" },
      { cmd: "rm -rf folder-name", desc: "Delete folder recursively" },
      { cmd: "cp -r src dest", desc: "Copy folder recursively" },
      { cmd: "mv old new", desc: "Move or rename" },
      { cmd: "code .", desc: "Open current folder in editor" },
    ],
  },
  {
    id: "docker",
    title: "Docker Commands",
    icon: Container,
    commands: [
      { cmd: "docker compose up -d", desc: "Start containers" },
      { cmd: "docker compose down", desc: "Stop containers" },
      { cmd: "docker compose restart", desc: "Restart containers" },
      { cmd: "docker ps", desc: "Show running containers" },
      { cmd: "docker exec -it wp_local_app bash", desc: "Enter WordPress container" },
      { cmd: "docker compose logs -f", desc: "Show live logs" },
    ],
  },
  {
    id: "wpcli",
    title: "WP-CLI via Docker",
    icon: FileCode,
    commands: [
      { cmd: "docker compose run --rm wpcli wp plugin list", desc: "List plugins" },
      { cmd: "docker compose run --rm wpcli wp plugin activate plugin-playground", desc: "Activate plugin" },
      { cmd: "docker compose run --rm wpcli wp plugin deactivate plugin-name", desc: "Deactivate plugin" },
      { cmd: "docker compose run --rm wpcli wp theme list", desc: "List themes" },
      { cmd: "docker compose run --rm wpcli wp option get siteurl", desc: "Show site URL" },
    ],
  },
  {
    id: "git",
    title: "Git Core Commands",
    icon: GitBranch,
    commands: [
      { cmd: "git init", desc: "Initialize repo" },
      { cmd: "git clone URL", desc: "Clone repo" },
      { cmd: "git status", desc: "Show current changes" },
      { cmd: "git add .", desc: "Stage all changes" },
      { cmd: 'git commit -m "message"', desc: "Commit changes" },
      { cmd: "git pull", desc: "Pull latest changes" },
      { cmd: "git push", desc: "Push changes" },
      { cmd: "git checkout -b new-branch", desc: "Create and switch to new branch" },
      { cmd: "git checkout main", desc: "Switch to main branch" },
      { cmd: "git log --oneline", desc: "Compact commit history" },
    ],
  },
  {
    id: "aliases",
    title: "WSL Aliases",
    icon: Command,
    commands: [
      { cmd: 'alias dev="cd /mnt/c/dev"', desc: "Shortcut to dev folder" },
      { cmd: 'alias proj="cd /mnt/c/dev/projects"', desc: "Shortcut to projects folder" },
      { cmd: 'alias plug="cd /mnt/c/dev/plugins"', desc: "Shortcut to plugins folder" },
      { cmd: 'alias wpup="docker compose up -d"', desc: "Shortcut to start containers" },
      { cmd: 'alias wpdown="docker compose down"', desc: "Shortcut to stop containers" },
      { cmd: 'alias wplogs="docker compose logs -f"', desc: "Shortcut for logs" },
      { cmd: "alias wpd='docker compose run --rm wpcli wp'", desc: "WP-CLI shortcut" },
      { cmd: 'alias wpbash="docker exec -it wp_local_app bash"', desc: "Shortcut to enter container" },
      { cmd: "source ~/.bashrc", desc: "Reload aliases" },
    ],
  },
  {
    id: "nano",
    title: "Nano Exit Basics",
    icon: Keyboard,
    commands: [
      { cmd: "CTRL + X", desc: "Exit nano" },
      { cmd: "Y", desc: "Confirm save" },
      { cmd: "ENTER", desc: "Confirm filename" },
    ],
  },
]

const advancedSections: Section[] = [
  {
    id: "adv-wsl",
    title: "WSL / Terminal",
    icon: Terminal,
    commands: [
      { cmd: "history", desc: "Show command history" },
      { cmd: 'grep -R "text" .', desc: "Search text recursively" },
      { cmd: 'find . -name "*.php"', desc: "Find PHP files" },
      { cmd: "chmod +x file.sh", desc: "Make executable" },
    ],
  },
  {
    id: "adv-docker",
    title: "Docker Commands",
    icon: Container,
    commands: [
      { cmd: "docker compose build", desc: "Rebuild containers" },
      { cmd: "docker compose logs -f service_name", desc: "Logs for one service" },
      { cmd: "docker exec -it wp_local_db mysql -u root -p", desc: "Enter MySQL" },
    ],
  },
  {
    id: "adv-wpcli",
    title: "WP-CLI via Docker",
    icon: FileCode,
    commands: [
      { cmd: "docker compose run --rm wpcli wp cache flush", desc: "Flush cache" },
      { cmd: "docker compose run --rm wpcli wp user list", desc: "List users" },
      { cmd: "docker compose run --rm wpcli wp post list", desc: "List posts" },
    ],
  },
  {
    id: "adv-git",
    title: "Git Core Commands",
    icon: GitBranch,
    commands: [
      { cmd: "git checkout -", desc: "Switch to previous branch" },
      { cmd: "git branch", desc: "List branches" },
      { cmd: "git branch -d branch-name", desc: "Delete local branch" },
      { cmd: "git reset --soft HEAD~1", desc: "Undo last commit but keep changes" },
      { cmd: "git stash", desc: "Temporarily save changes" },
      { cmd: "git stash pop", desc: "Restore stashed changes" },
    ],
  },
  {
    id: "adv-aliases",
    title: "WSL Aliases",
    icon: Command,
    commands: [
      { cmd: 'alias gs="git status"', desc: "Git shortcut" },
      { cmd: 'alias gl="git log --oneline"', desc: "Git log shortcut" },
      { cmd: 'alias ..="cd .."', desc: "Go up one folder" },
    ],
  },
  {
    id: "adv-powershell",
    title: "PowerShell",
    icon: TerminalSquare,
    commands: [
      { cmd: "Get-ChildItem", desc: "List files" },
      { cmd: "Get-Location", desc: "Show path" },
      { cmd: "Set-Location C:\\dev", desc: "Change folder" },
      { cmd: "Remove-Item file.txt", desc: "Delete file" },
    ],
  },
]

export default function CheatSheet() {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [customItems, setCustomItems] = useState<CustomStoredEntry[]>([])
  const [formSectionLabel, setFormSectionLabel] = useState("")
  const [formCmd, setFormCmd] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Load favorites + custom commands from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFavorites(new Set(parsed))
      } catch {
        // Invalid data, start fresh
      }
    }
    const customRaw = localStorage.getItem(CUSTOM_STORAGE_KEY)
    setCustomItems(parseCustomStorage(customRaw))
    setIsHydrated(true)
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]))
    }
  }, [favorites, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      const payload: CustomStoragePayload = { v: 1, items: customItems }
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(payload))
    }
  }, [customItems, isHydrated])

  const toggleFavorite = (cmd: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(cmd)) {
        next.delete(cmd)
      } else {
        next.add(cmd)
      }
      return next
    })
  }

  const customSectionsUngrouped = useMemo((): Section[] => {
    const byLabel = new Map<string, CustomStoredEntry[]>()
    for (const item of customItems) {
      const label = item.sectionLabel.trim() || "My commands"
      const list = byLabel.get(label) ?? []
      list.push(item)
      byLabel.set(label, list)
    }
    const out: Section[] = []
    for (const [label, items] of byLabel) {
      const id = `custom:${encodeURIComponent(label)}`
      out.push({
        id,
        title: label,
        icon: Command,
        commands: items.map((e) => ({
          cmd: e.cmd,
          desc: e.desc,
          customId: e.id,
        })),
      })
    }
    return out.sort((a, b) => a.title.localeCompare(b.title))
  }, [customItems])

  const allSections = useMemo(
    () => [...basicsSections, ...advancedSections, ...customSectionsUngrouped],
    [customSectionsUngrouped]
  )

  // Get all commands with their descriptions for favorites lookup (built-in first, then custom overrides desc)
  const allCommandsMap = useMemo(() => {
    const map = new Map<string, CommandRow>()
    allSections.forEach((section) => {
      section.commands.forEach((c) => {
        map.set(c.cmd, { cmd: c.cmd, desc: c.desc })
      })
    })
    return map
  }, [allSections])

  const visibleCmdsUnderFilter = useMemo(() => {
    if (activeFilter === null) return null
    const set = new Set<string>()
    basicsSections
      .filter((s) => sectionMatchesFilter(activeFilter, s.id))
      .forEach((s) => s.commands.forEach((c) => set.add(c.cmd)))
    advancedSections
      .filter((s) => sectionMatchesFilter(activeFilter, s.id))
      .forEach((s) => s.commands.forEach((c) => set.add(c.cmd)))
    return set
  }, [activeFilter])

  const filterSection = (section: Section) => {
    let commands = section.commands.filter(
      (c) =>
        c.cmd.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
    )
    if (showOnlyFavorites) {
      commands = commands.filter((c) => favorites.has(c.cmd))
    }
    return { ...section, commands }
  }

  const filteredBasics = useMemo(() => {
    return basicsSections
      .filter((section) => sectionMatchesFilter(activeFilter, section.id))
      .map(filterSection)
      .filter((section) => section.commands.length > 0)
  }, [search, activeFilter, favorites, showOnlyFavorites])

  const filteredAdvanced = useMemo(() => {
    return advancedSections
      .filter((section) => sectionMatchesFilter(activeFilter, section.id))
      .map(filterSection)
      .filter((section) => section.commands.length > 0)
  }, [search, activeFilter, favorites, showOnlyFavorites])

  const filteredCustom = useMemo(() => {
    if (activeFilter !== null) return []
    return customSectionsUngrouped.map(filterSection).filter((s) => s.commands.length > 0)
  }, [customSectionsUngrouped, search, activeFilter, favorites, showOnlyFavorites])

  // Build favorites section from favorited commands
  const favoritesSection = useMemo(() => {
    const favoriteCommands = [...favorites]
      .map((cmd) => allCommandsMap.get(cmd))
      .filter((c): c is CommandRow => c !== undefined)
      .filter(
        (c) =>
          c.cmd.toLowerCase().includes(search.toLowerCase()) ||
          c.desc.toLowerCase().includes(search.toLowerCase())
      )
      .filter((c) => {
        if (visibleCmdsUnderFilter === null) return true
        return visibleCmdsUnderFilter.has(c.cmd)
      })

    if (favoriteCommands.length === 0) return null

    return {
      id: "favorites",
      title: "Favorites",
      icon: Star,
      commands: favoriteCommands,
    }
  }, [favorites, search, allCommandsMap, visibleCmdsUnderFilter])

  const hasSearchResults = (sectionId: string) => {
    if (!search) return true
    const section = allSections.find((s) => s.id === sectionId)
    if (!section) return false
    return section.commands.some(
      (c) =>
        c.cmd.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase())
    )
  }

  const isExpanded = (sectionId: string) => {
    if (search && hasSearchResults(sectionId)) return true
    return !collapsedSections.has(sectionId)
  }

  const toggleSection = (sectionId: string) => {
    if (search) return
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const copyVisibleCommands = async () => {
    const allCommands = [
      ...(favoritesSection && !showOnlyFavorites ? favoritesSection.commands : []),
      ...filteredBasics.flatMap((s) => s.commands),
      ...filteredAdvanced.flatMap((s) => s.commands),
      ...filteredCustom.flatMap((s) => s.commands),
    ]
      .map((c) => c.cmd)
      .filter((cmd, index, self) => self.indexOf(cmd) === index) // dedupe
      .join("\n")
    await copyToClipboard(allCommands, "visible")
  }

  const copySectionCommands = async (section: Section) => {
    const commands = section.commands.map((c) => c.cmd).join("\n")
    await copyToClipboard(commands, `${section.id}-all`)
  }

  const deleteCustomEntry = (id: string) => {
    setCustomItems((prev) => prev.filter((e) => e.id !== id))
  }

  const addCustomEntry = () => {
    const sectionLabel = formSectionLabel.trim()
    const cmd = formCmd.trim()
    const desc = formDesc.trim()
    if (!sectionLabel || !cmd || !desc) {
      setFormError("Section label, command, and description are required.")
      return
    }
    setFormError(null)
    const now = Date.now()
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(36).slice(2)}`
    setCustomItems((prev) => [
      ...prev,
      { id, sectionLabel, cmd, desc, createdAt: now, updatedAt: now },
    ])
    setFormCmd("")
    setFormDesc("")
  }

  const exportCustomTxt = () => {
    const payload: CustomStoragePayload = { v: 1, items: customItems }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `terminal-cheat-sheet-custom-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImportCustomFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      let incoming: CustomStoredEntry[] = []
      if (Array.isArray(parsed)) {
        incoming = parseCustomStorage(JSON.stringify(parsed))
      } else if (parsed && typeof parsed === "object" && "items" in parsed) {
        incoming = parseCustomStorage(JSON.stringify(parsed))
      }
      if (incoming.length === 0) {
        setFormError("Import file had no valid custom commands.")
        return
      }
      setFormError(null)
      setCustomItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id))
        const merged = incoming.filter((i) => !existingIds.has(i.id))
        return [...prev, ...merged]
      })
    } catch {
      setFormError("Could not read import file. Use a TXT exported from this app.")
    }
  }

  const renderCommandRow = (
    command: CommandRow,
    idx: number,
    sectionId: string,
    showFavoriteStar: boolean = true
  ) => {
    const rowKey = command.customId ?? `${sectionId}-${idx}`
    const cmdId = `${sectionId}-${idx}`
    const isCopied = copiedId === cmdId
    const isFavorite = favorites.has(command.cmd)

    return (
      <div
        key={rowKey}
        className="group flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-secondary/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showFavoriteStar && (
            <button
              onClick={() => toggleFavorite(command.cmd)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                isFavorite
                  ? "text-amber-500"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`h-3 w-3 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          )}
          <code className="shrink-0 rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
            {command.cmd}
          </code>
          <span className="truncate text-xs text-muted-foreground">{command.desc}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {command.customId && (
            <button
              type="button"
              onClick={() => deleteCustomEntry(command.customId!)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              title="Remove custom command"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => copyToClipboard(command.cmd, cmdId)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${
              isCopied
                ? "bg-green-500/20 text-green-400"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title="Copy command"
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
    )
  }

  const renderSection = (section: Section & { commands: CommandRow[] }, showFavoriteStars: boolean = true) => {
    const Icon = section.icon
    const expanded = isExpanded(section.id)

    return (
      <section key={section.id} className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={() => toggleSection(section.id)}
            className="flex flex-1 items-center gap-2 text-left hover:opacity-80"
            disabled={!!search}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                expanded ? "" : "-rotate-90"
              }`}
            />
            <Icon className={`h-4 w-4 ${section.id === "favorites" ? "text-amber-500" : "text-muted-foreground"}`} />
            <h3 className="text-sm font-medium text-foreground">{section.title}</h3>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {section.commands.length}
            </span>
          </button>
          <button
            onClick={() => copySectionCommands(section)}
            className="flex h-6 items-center gap-1 rounded px-2 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {copiedId === `${section.id}-all` ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy all
          </button>
        </div>

        {expanded && (
          <div className="divide-y divide-border border-t border-border">
            {section.commands.map((command, idx) =>
              renderCommandRow(command, idx, section.id, showFavoriteStars)
            )}
          </div>
        )}
      </section>
    )
  }

  const filterCategories = [
    { id: null, label: "All" },
    { id: "wsl", label: "WSL" },
    { id: "docker", label: "Docker" },
    { id: "wpcli", label: "WP-CLI" },
    { id: "git", label: "Git" },
    { id: "aliases", label: "Aliases" },
    { id: "nano", label: "Nano" },
    { id: "adv-powershell", label: "PowerShell" },
  ]

  const hasNoResults =
    filteredBasics.length === 0 &&
    filteredAdvanced.length === 0 &&
    filteredCustom.length === 0 &&
    (!favoritesSection || showOnlyFavorites)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Terminal Cheat Sheet</h1>
                <p className="text-xs text-muted-foreground">WSL, Docker, WP-CLI, Git, Aliases</p>
                <p className="mt-0.5 text-[10px] italic text-muted-foreground/70">
                  Built for daily use, not theory
                </p>
              </div>
              <button
                onClick={copyVisibleCommands}
                className="flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-secondary"
              >
                {copiedId === "visible" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy Visible
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-input bg-secondary/50 py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {isHydrated && favorites.size > 0 && (
                <button
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                    showOnlyFavorites
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                      : "border-input bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                  title={showOnlyFavorites ? "Show all commands" : "Show only favorites"}
                >
                  <Star className={`h-3 w-3 ${showOnlyFavorites ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">Favorites only</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id ?? "all"}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    activeFilter === cat.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4">
        {isHydrated && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Your commands</h2>
                <p className="text-[11px] text-muted-foreground">
                  Saved in this browser only. Export a TXT file to copy to another machine.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportCustomTxt}
                  disabled={customItems.length === 0}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
                >
                  <Download className="h-3 w-3" />
                  Export TXT
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-secondary"
                >
                  <Upload className="h-3 w-3" />
                  Import TXT
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".txt,text/plain,application/json"
                  className="hidden"
                  onChange={onImportCustomFile}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Section label
                </label>
                <input
                  type="text"
                  value={formSectionLabel}
                  onChange={(e) => setFormSectionLabel(e.target.value)}
                  placeholder="e.g. Cristi Aliases"
                  className="w-full rounded-md border border-input bg-secondary/50 px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Command
                </label>
                <input
                  type="text"
                  value={formCmd}
                  onChange={(e) => setFormCmd(e.target.value)}
                  placeholder="alias ll='ls -la'"
                  className="w-full rounded-md border border-input bg-secondary/50 px-2 py-1.5 font-mono text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What it does"
                  className="w-full rounded-md border border-input bg-secondary/50 px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            {formError && <p className="mt-2 text-xs text-destructive">{formError}</p>}
            <button
              type="button"
              onClick={addCustomEntry}
              className="mt-3 flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
            >
              <Plus className="h-3 w-3" />
              Add command
            </button>

            {filteredCustom.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Saved groups
                </p>
                <div className="space-y-2">{filteredCustom.map((s) => renderSection(s))}</div>
              </div>
            )}
          </div>
        )}

        {/* Favorites Section - only show if favorites exist and not in "favorites only" mode */}
        {isHydrated && favoritesSection && !showOnlyFavorites && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                Favorites
              </span>
            </div>
            <div className="space-y-2">{renderSection(favoritesSection, false)}</div>
          </div>
        )}

        {filteredBasics.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Basics
              </span>
            </div>
            <div className="space-y-2">{filteredBasics.map((s) => renderSection(s))}</div>
          </div>
        )}

        {filteredAdvanced.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Advanced
              </span>
            </div>
            <div className="space-y-2">{filteredAdvanced.map((s) => renderSection(s))}</div>
          </div>
        )}

        {hasNoResults && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {showOnlyFavorites && favorites.size === 0
                ? "No favorites yet. Click the star icon on any command to add it."
                : `No commands found matching "${search}"`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
