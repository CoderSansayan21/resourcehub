export const RESOURCE_CATEGORIES = [
  {
    description: "Rooms for meetings, workshops and focused collaboration.",
    image: "/images/categories/meeting-rooms.png",
    label: "Meeting Rooms",
    value: "meeting-rooms",
  },
  {
    description: "Shared equipment that helps teams get work done.",
    image: "/images/categories/equipment.png",
    label: "Equipment",
    value: "equipment",
  },
  {
    description: "Flexible desks and spaces for individual work.",
    image: "/images/categories/workspaces.png",
    label: "Workspaces",
    value: "workspaces",
  },
  {
    description: "Dedicated computer-enabled rooms for technical work.",
    image: "/images/categories/computer-labs.png",
    label: "Computer Labs",
    value: "computer-labs",
  },
  {
    description: "Other shared resources, facilities and equipment.",
    image: "/images/categories/others.png",
    label: "Others",
    value: "others",
  },
] as const;

export type ResourceCategoryValue = (typeof RESOURCE_CATEGORIES)[number]["value"];

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<ResourceCategoryValue, string[]> = {
  "computer-labs": ["computer lab", "computer labs", "computer room", "computer rooms", "lab"],
  equipment: ["equipment", "device", "devices", "av equipment"],
  "meeting-rooms": [
    "boardroom",
    "conference room",
    "conference rooms",
    "meeting room",
    "meeting rooms",
  ],
  others: [],
  workspaces: ["desk", "desks", "workspace", "workspaces", "hot desk", "hot desks"],
};

function normalizeType(value: string) {
  return value.trim().toLowerCase().replaceAll("_", " ").replaceAll("-", " ").replace(/\s+/g, " ");
}

export function getResourceCategory(type: string): ResourceCategory | null {
  const normalized = normalizeType(type);

  return (
    RESOURCE_CATEGORIES.find(
      (category) =>
        normalized === normalizeType(category.value) ||
        CATEGORY_ALIASES[category.value].some((alias) => normalized === alias),
    ) ?? null
  );
}

export function getResourceCategoryValue(type: string): ResourceCategoryValue | null {
  return getResourceCategory(type)?.value ?? null;
}

export function getResourceCategoryLabel(type: string) {
  return getResourceCategory(type)?.label ?? type;
}
