
// This hook automatically enables the Batch API in PocketBase on startup.
// This is required for the optimized frontend budget saving (batchUpdateValues) to work.

onAfterBootstrap((e) => {
    const settings = $app.settings();

    // Enable Batch API if it's not already enabled
    if (!settings.batch.enabled) {
        console.log("PocketBase Hook: Enabling Batch API...");
        settings.batch.enabled = true;
        try {
            $app.saveSettings(settings);
            console.log("PocketBase Hook: Batch API successfully enabled.");
        } catch (err) {
            console.error("PocketBase Hook: Failed to enable Batch API:", err);
        }
    }

    return e.next();
});
