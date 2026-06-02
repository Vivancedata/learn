"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, type ButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type ThemeToggleMode = "toggle" | "menu";

type ThemeName = "light" | "dark" | "system";

export interface ThemeToggleProps
  extends Omit<ButtonProps, "asChild" | "children" | "onClick"> {
  mode?: ThemeToggleMode;
  align?: React.ComponentPropsWithoutRef<typeof DropdownMenuContent>["align"];
  showSystemOption?: boolean;
}

function ThemeToggle({
  mode = "toggle",
  variant,
  size = "icon",
  align = "end",
  showSystemOption = mode === "menu",
  type,
  ...buttonProps
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const currentTheme =
    theme === "system" && !showSystemOption ? (resolvedTheme ?? "light") : (theme ?? "system");
  const buttonVariant = variant ?? (mode === "menu" ? "outline" : "ghost");
  const ariaLabel =
    buttonProps["aria-label"] ?? (mode === "menu" ? "Change theme" : "Toggle theme");
  const iconSizeClassName = mode === "menu" ? "h-[1.2rem] w-[1.2rem]" : "h-5 w-5";

  const iconContent = (
    <>
      <Sun
        className={`${iconSizeClassName} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`}
      />
      <Moon
        className={`absolute ${iconSizeClassName} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`}
      />
      <span className="sr-only">{ariaLabel}</span>
    </>
  );

  if (mode === "toggle") {
    return (
      <Button
        variant={buttonVariant}
        size={size}
        type={type ?? "button"}
        aria-label={ariaLabel}
        onClick={() => setTheme(nextTheme)}
        {...buttonProps}
      >
        {iconContent}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          size={size}
          type={type ?? "button"}
          aria-label={ariaLabel}
          {...buttonProps}
        >
          {iconContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuRadioGroup
          value={currentTheme}
          onValueChange={(value) => setTheme(value as ThemeName)}
        >
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          {showSystemOption ? (
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          ) : null}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ThemeToggle };
