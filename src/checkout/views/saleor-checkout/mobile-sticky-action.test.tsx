// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileStickyAction } from "./mobile-sticky-action";

describe("MobileStickyAction", () => {
	it("renders the information-step CTA based on shipping requirements", () => {
		render(<MobileStickyAction step={1} isShippingRequired={true} />);

		expect(screen.getByRole("button", { name: /continue to shipping/i })).toBeTruthy();
	});

	it("renders the payment CTA with the total and disables while loading", () => {
		render(<MobileStickyAction step={3} isShippingRequired={true} isLoading total="$42.00" />);

		const button = screen.getByRole("button", { name: /pay \$42\.00/i });
		expect(button).toBeDisabled();
	});

	it("calls the action handler when clicked", () => {
		const onAction = vi.fn();
		render(<MobileStickyAction step={2} isShippingRequired={false} onAction={onAction} />);

		fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

		expect(onAction).toHaveBeenCalledOnce();
	});
});
