
migrate((app) => {
    // 0. Cleanup failed attempts
    const toDelete = ["scenario_values", "scenarios", "monthly_values", "categories"];
    toDelete.forEach(name => {
        try {
            const c = app.findCollectionByNameOrId(name);
            if (c) app.delete(c);
        } catch (e) { }
    });

    const CAT_ID = "pbc_categories";
    const SCE_ID = "pbc_scenarios";

    // 1. Categories
    const categories = new Collection({
        id: CAT_ID,
        name: "categories",
        type: "base",
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "user = @request.auth.id",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id",
    });
    categories.fields.add(new TextField({ name: "name", required: true }));
    categories.fields.add(new SelectField({ name: "type", required: true, values: ["income", "expense"] }));
    categories.fields.add(new BoolField({ name: "is_fixed" }));
    categories.fields.add(new NumberField({ name: "display_order" }));
    categories.fields.add(new RelationField({ name: "user", required: true, collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true }));
    app.save(categories);

    // 2. Monthly Values
    const monthly_values = new Collection({
        name: "monthly_values",
        type: "base",
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "user = @request.auth.id",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id",
    });
    monthly_values.fields.add(new RelationField({ name: "category", required: true, collectionId: CAT_ID, maxSelect: 1, cascadeDelete: true }));
    monthly_values.fields.add(new NumberField({ name: "year", required: true }));
    monthly_values.fields.add(new NumberField({ name: "month", required: true }));
    monthly_values.fields.add(new NumberField({ name: "amount", required: true }));
    monthly_values.fields.add(new RelationField({ name: "user", required: true, collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true }));
    app.save(monthly_values);

    // 3. Scenarios
    const scenarios = new Collection({
        id: SCE_ID,
        name: "scenarios",
        type: "base",
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "user = @request.auth.id",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id",
    });
    scenarios.fields.add(new TextField({ name: "name", required: true }));
    scenarios.fields.add(new NumberField({ name: "year", required: true }));
    scenarios.fields.add(new RelationField({ name: "user", required: true, collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true }));
    app.save(scenarios);

    // 4. Scenario Values
    const scenario_values = new Collection({
        name: "scenario_values",
        type: "base",
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "user = @request.auth.id",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id",
    });
    scenario_values.fields.add(new RelationField({ name: "scenario", required: true, collectionId: SCE_ID, maxSelect: 1, cascadeDelete: true }));
    scenario_values.fields.add(new RelationField({ name: "category", required: true, collectionId: CAT_ID, maxSelect: 1, cascadeDelete: true }));
    scenario_values.fields.add(new NumberField({ name: "year", required: true }));
    scenario_values.fields.add(new NumberField({ name: "month", required: true }));
    scenario_values.fields.add(new NumberField({ name: "amount", required: true }));
    scenario_values.fields.add(new RelationField({ name: "user", required: true, collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true }));
    app.save(scenario_values);

    // 5. Update users
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("subscription_status")) {
        users.fields.add(new TextField({ name: "subscription_status" }));
        users.fields.add(new DateField({ name: "trial_ends_at" }));
        users.fields.add(new TextField({ name: "stripe_customer_id" }));
        users.fields.add(new TextField({ name: "stripe_subscription_id" }));
        users.fields.add(new DateField({ name: "subscription_end" }));
        app.save(users);
    }
})
