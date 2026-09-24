import { describe, expect, it, vi } from "vitest";

import { createCollection } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create: vi.fn() } },
}));

describe("createCollection", () => {
  it("connects the collection to the user and returns the new id", async () => {
    vi.mocked(prisma.collection.create).mockResolvedValue({ id: "col-1" } as never);

    const id = await createCollection("user-1", {
      name: "React Patterns",
      description: "Hooks and components",
    });

    expect(id).toBe("col-1");
    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: {
        name: "React Patterns",
        description: "Hooks and components",
        user: { connect: { id: "user-1" } },
      },
      select: { id: true },
    });
  });

  it("stores a null description", async () => {
    vi.mocked(prisma.collection.create).mockResolvedValue({ id: "col-2" } as never);

    await createCollection("user-1", { name: "Inbox", description: null });

    expect(prisma.collection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    );
  });
});
