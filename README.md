# Senbetsu

Senbetsu is an AI-powered tab manager and Chrome extension for organizing tabs,
saving groups, and freeing memory with Chrome's native tab discard behavior.

## Automatic tab offloading

Open the **Memory** tab to choose **Off**, **1 minute**, **3 minutes**, or
**5 minutes**. The setting is Off by default and is saved locally. When enabled,
Senbetsu checks all browser windows about every 30 seconds and offloads eligible
inactive HTTP(S) tabs after the selected minimum inactivity period.

Chrome alarms are approximate, so the threshold is a minimum rather than an
exact deadline. Active, pinned, private, audible, loading, frozen, discarded,
internal, and otherwise non-discardable tabs are left alone. Offloaded tabs
remain in the tab strip and reload normally when activated. Select **Off** to
clear the background schedule.
