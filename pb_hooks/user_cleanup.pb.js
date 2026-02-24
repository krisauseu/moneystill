
// This hook ensures that when a user is deleted, all their associated data
// is also removed directly at the database level for maximum performance.
// This prevents the frontend from having to delete hundreds of records one-by-one.

onRecordBeforeDeleteRequest((e) => {
    const userId = e.record.id;

    console.log(`PocketBase Hook: Starting fast data cleanup for user ${userId}...`);

    try {
        // We use bulk SQL for speed and to bypass individual record hooks/validation
        // that could slow down the process significantly.

        $app.db().newQuery("DELETE FROM monthly_values WHERE user = {:userId}")
            .bind({ userId })
            .execute();

        $app.db().newQuery("DELETE FROM scenario_values WHERE user = {:userId}")
            .bind({ userId })
            .execute();

        $app.db().newQuery("DELETE FROM scenarios WHERE user = {:userId}")
            .bind({ userId })
            .execute();

        $app.db().newQuery("DELETE FROM categories WHERE user = {:userId}")
            .bind({ userId })
            .execute();

        console.log(`PocketBase Hook: Cleanup for user ${userId} completed.`);
    } catch (err) {
        console.error(`PocketBase Hook: Cleanup for user ${userId} failed:`, err);
        // We still allow the user deletion to proceed as it's the primary action
    }

    return e.next();
}, "users");
