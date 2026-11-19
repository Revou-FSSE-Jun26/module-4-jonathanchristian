import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorPanel } from "@/components/shared/ErrorPanel";

describe("Shared components", () => {
  it("BaseButton renders distinct variant classes, fires onClick once, and ignores clicks when disabled", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onDisabled = vi.fn();

    render(
      <div>
        <BaseButton variant="primary" onClick={onPrimary}>
          Primary
        </BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="destructive">Destructive</BaseButton>
        <BaseButton disabled onClick={onDisabled}>
          Disabled
        </BaseButton>
      </div>
    );

    const primary = screen.getByRole("button", { name: "Primary" });
    const secondary = screen.getByRole("button", { name: "Secondary" });
    const destructive = screen.getByRole("button", { name: "Destructive" });
    const disabled = screen.getByRole("button", { name: "Disabled" });

    expect(primary.className).not.toBe(secondary.className);
    expect(secondary.className).not.toBe(destructive.className);
    expect(primary.className).not.toBe(destructive.className);

    await user.click(primary);
    expect(onPrimary).toHaveBeenCalledTimes(1);

    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.click(disabled);
    expect(onDisabled).not.toHaveBeenCalled();
  });

  it("BaseBadge renders distinct classes for color variants", () => {
    render(
      <div>
        <BaseBadge variant="gray">Gray</BaseBadge>
        <BaseBadge variant="blue">Blue</BaseBadge>
        <BaseBadge variant="green">Green</BaseBadge>
        <BaseBadge variant="red">Red</BaseBadge>
      </div>
    );
    const classes = ["Gray", "Blue", "Green", "Red"].map((t) => screen.getByText(t).className);
    expect(new Set(classes).size).toBe(4);
  });

  it("BaseModal handles open/close, Escape, backdrop click, content click, focus in and focus restore", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <div>
        <button type="button">Trigger</button>
        <BaseModal open={false} onClose={onClose} title="Test Modal">
          <button type="button">Inside</button>
        </BaseModal>
      </div>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(
      <div>
        <button type="button">Trigger</button>
        <BaseModal open={true} onClose={onClose} title="Test Modal">
          <button type="button">Inside</button>
        </BaseModal>
      </div>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Content click does not close
    await user.click(screen.getByText("Test Modal"));
    expect(onClose).not.toHaveBeenCalled();

    // Escape closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Backdrop click closes
    await user.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);

    // Closing restores focus to trigger
    rerender(
      <div>
        <button type="button">Trigger</button>
        <BaseModal open={false} onClose={onClose} title="Test Modal">
          <button type="button">Inside</button>
        </BaseModal>
      </div>
    );
    expect(document.activeElement).toBe(trigger);
  });

  it("ConfirmDialog and ErrorPanel render and trigger callbacks", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onRetry = vi.fn();

    render(
      <div>
        <ConfirmDialog open={true} message="Delete item?" onConfirm={onConfirm} onCancel={onCancel} />
        <ErrorPanel message="Failed to load" onRetry={onRetry} />
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
