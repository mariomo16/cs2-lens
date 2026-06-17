type InsertMode = "prepend" | "append" | "after";

interface InsertionCandidate {
	selector: string;
	mode: InsertMode;
}

const INSERTION_CANDIDATES: InsertionCandidate[] = [
	{ selector: ".profile_leftcol", mode: "prepend" },
	{ selector: ".profile_rightcol", mode: "prepend" },
	{ selector: ".profile_header", mode: "after" },
	{ selector: ".responsive_page_template_content", mode: "prepend" },
];

export function findInsertionTarget(): {
	anchor: Element;
	mode: InsertMode;
} | null {
	for (const candidate of INSERTION_CANDIDATES) {
		const anchor = document.querySelector(candidate.selector);
		if (anchor) return { anchor, mode: candidate.mode };
	}
	return null;
}

export function insertElement(element: HTMLElement): boolean {
	const target = findInsertionTarget();
	if (!target) return false;

	const { anchor, mode } = target;
	switch (mode) {
		case "prepend":
			anchor.prepend(element);
			break;
		case "append":
			anchor.append(element);
			break;
		default:
			anchor.after(element);
			break;
	}
	return true;
}

export function createShowcaseElement(): HTMLElement {
	const el = document.createElement("div");
	el.className = "profile_customization";

	const header = document.createElement("div");
	header.className = "profile_customization_header";
	header.append("CS2 Lens");

	const block = document.createElement("div");
	block.className = "profile_customization_block";

	el.style.marginBottom = "12px";
	el.append(header, block);

	return el;
}
