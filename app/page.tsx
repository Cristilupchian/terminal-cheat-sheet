"use client"

import { useState, useMemo } from "react"
import { Copy, Check, Search, Terminal, Container, GitBranch, FileCode, Command, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

const sections = [
  {
    id: "wsl",
    title: "WSL / Terminal Basics",
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

export default function CheatSheet() {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredSections = useMemo(() => {
    return sections
      .filter((section) => !activeFilter || section.id === activeFilter)
      .map((section) => ({
        ...section,
        commands: section.commands.filter(
          (c) =>
            c.cmd.toLowerCase().includes(search.toLowerCase()) ||
            c.desc.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((section) => section.commands.length > 0)
  }, [search, activeFilter])

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const copyAllCommands = async () => {
    const allCommands = filteredSections
      .flatMap((s) => s.commands.map((c) => c.cmd))
      .join("\n")
    await copyToClipboard(allCommands, "all")
  }

  const copyAllAliases = async () => {
    const aliasSection = sections.find((s) => s.id === "aliases")
    if (aliasSection) {
      const aliases = aliasSection.commands.map((c) => c.cmd).join("\n")
      await copyToClipboard(aliases, "aliases-all")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Terminal Cheat Sheet</h1>
                <p className="text-xs text-muted-foreground">WSL, Docker, WP-CLI, Git, Aliases</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">Built for daily use, not theory</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllCommands}
                className="h-7 gap-1.5 text-xs"
              >
                {copiedId === "all" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy All
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-secondary/50 py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveFilter(null)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  !activeFilter
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                All
              </button>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveFilter(activeFilter === section.id ? null : section.id)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    activeFilter === section.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon
            return (
              <section key={section.id} className="rounded-lg border border-border bg-card">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-foreground">{section.title}</h2>
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {section.commands.length}
                    </span>
                  </div>
                  {section.id === "aliases" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAllAliases}
                      className="h-6 gap-1 px-2 text-[10px]"
                    >
                      {copiedId === "aliases-all" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy all aliases
                    </Button>
                  )}
                </div>

                {/* Commands */}
                <div className="divide-y divide-border">
                  {section.commands.map((command, idx) => {
                    const cmdId = `${section.id}-${idx}`
                    const isCopied = copiedId === cmdId
                    return (
                      <div
                        key={idx}
                        className="group flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-secondary/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <code className="shrink-0 rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
                            {command.cmd}
                          </code>
                          <span className="truncate text-xs text-muted-foreground">
                            {command.desc}
                          </span>
                        </div>
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
                    )
                  })}
                </div>
              </section>
            )
          })}

          {filteredSections.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No commands found matching &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
