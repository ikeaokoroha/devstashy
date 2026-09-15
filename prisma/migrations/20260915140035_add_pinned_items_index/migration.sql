-- CreateIndex
CREATE INDEX "Item_userId_isPinned_updatedAt_idx" ON "Item"("userId", "isPinned", "updatedAt");
