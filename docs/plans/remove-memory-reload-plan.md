# Remove Memory Reload Button Plan

## Goal
Remove the reload button next to the "Memory Usage" header in the popup UI and clean up any associated dead code.

## Findings
1. The button is located in `entrypoints/popup/components/MemoryUsageList.tsx` within the `.section-header`.
2. The button calls the `onRefresh` prop.
3. In `entrypoints/popup/App.tsx`, `onRefresh={fetchMemoryUsage}` is passed to `MemoryUsageList`.
4. `fetchMemoryUsage` is also used by `handleSwitchToMemory` to fetch data when first switching to the memory view, so `fetchMemoryUsage` itself **is not dead code** and must be kept.

## Execution Steps
1. **`entrypoints/popup/components/MemoryUsageList.tsx`**:
   - Remove `onRefresh` from the `MemoryUsageListProps` interface.
   - Remove `onRefresh` from the destructured props.
   - Remove the `<button className="refresh-btn">...` element.
2. **`entrypoints/popup/App.tsx`**:
   - Remove `onRefresh={fetchMemoryUsage}` from the `<MemoryUsageList>` instantiation.
3. **Verification**:
   - Run `biome check .`
   - Run `tsc --noEmit`
   - Run tests if any.
