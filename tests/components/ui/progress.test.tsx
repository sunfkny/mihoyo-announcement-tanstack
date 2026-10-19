// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Progress } from "#/components/ui/progress";

it("renders an indeterminate progress indicator at its starting position", () => {
  const { container } = render(<Progress aria-label="加载进度" />);
  expect(screen.getByRole("progressbar", { name: "加载进度" })).not.toHaveAttribute("aria-valuenow");
  expect(container.querySelector("[style]")).toHaveStyle({ transform: "translateX(-100%)" });
});
