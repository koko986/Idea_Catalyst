"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, RefreshCw, UserRound } from "lucide-react";
import { logout } from "@/app/login/actions";

type AccountMenuProps = {
  email: string;
  initials: string;
  roleLabel: string;
};

export function AccountMenu({ email, initials, roleLabel }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={container}>
      <button
        className="account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${email}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="avatar">{initials}</span>
        <span className="account-identity">
          <strong>{email}</strong>
          <span>{roleLabel}</span>
        </span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-dropdown-head">
            <strong>{email}</strong>
            <span className="badge">{roleLabel}</span>
          </div>
          <Link
            className="account-dropdown-item"
            role="menuitem"
            href="/profile"
            onClick={() => setOpen(false)}
          >
            <UserRound size={16} />
            View profile
          </Link>
          <form action={logout}>
            <button className="account-dropdown-item" role="menuitem" type="submit">
              <RefreshCw size={16} />
              Switch account
            </button>
          </form>
          <form action={logout}>
            <button
              className="account-dropdown-item danger"
              role="menuitem"
              type="submit"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
