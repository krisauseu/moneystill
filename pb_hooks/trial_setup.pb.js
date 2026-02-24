
// 1. Initial Trial setup for NEW users (Email & Google)
// Triggered during the API record creation request
onRecordCreateRequest((e) => {
    // Set fields BEFORE the record is persisted/validated
    e.record.set("subscription_status", "trial");

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    e.record.set("trial_ends_at", trialEndsAt);

    return e.next(); // Mandatory in PocketBase v0.23+
}, "users");

// 2. Migration for OLD users upon successful Password Auth
onRecordAuthWithPasswordRequest((e) => {
    const result = e.next(); // Execute the actual authentication

    // If authentication was successful, e.record is populated
    if (e.record && !e.record.get("trial_ends_at")) {
        e.record.set("subscription_status", "trial");
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        e.record.set("trial_ends_at", trialEndsAt);

        $app.dao().saveRecord(e.record);
    }

    return result;
}, "users");

// 3. Migration for OLD users upon successful OAuth2 Auth
onRecordAuthWithOAuth2Request((e) => {
    const result = e.next();

    if (e.record && !e.record.get("trial_ends_at")) {
        e.record.set("subscription_status", "trial");
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        e.record.set("trial_ends_at", trialEndsAt);

        $app.dao().saveRecord(e.record);
    }

    return result;
}, "users");
