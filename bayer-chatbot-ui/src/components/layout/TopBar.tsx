import React from "react";
import { Menu, Moon, Sun } from "lucide-react";

import { useTheme } from "../theme/ThemeProvider";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

type TopBarProps = {
  title: string;
  subtitle?: string;
  onOpenSidebar?: () => void;
  model?: string;
  models?: string[] | null;
  modelsError?: string;
  onChangeModel?: (model: string) => void;
};

export function TopBar({
  title,
  subtitle,
  onOpenSidebar,
  model,
  models,
  modelsError,
  onChangeModel
}: TopBarProps) {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <header className="flex items-center justify-between gap-2 border-b bg-background/70 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenSidebar ? (
          <Button variant="ghost" size="icon" onClick={onOpenSidebar} aria-label="Open sidebar" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          {subtitle ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {model && onChangeModel ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                {model}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Model</DropdownMenuLabel>
              {modelsError ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">{modelsError}</div>
              ) : null}
              <DropdownMenuSeparator />
              {(models ?? [model]).slice(0, 50).map((m) => (
                <DropdownMenuItem key={m} onSelect={() => onChangeModel(m)}>
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
