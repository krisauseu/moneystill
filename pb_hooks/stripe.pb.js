
// Route to create a Stripe Checkout Session
routerAdd("POST", "/api/stripe-checkout", (e) => {
    const STRIPE_SECRET_KEY = $os.getenv("STRIPE_SECRET_KEY");
    const STRIPE_PRICE_ID = $os.getenv("STRIPE_PRICE_ID");
    const FRONTEND_URL = $os.getenv("FRONTEND_URL") || "http://localhost:5173";

    const user = e.auth;
    if (!user) {
        return e.json(401, { "message": "Not authorized. Please sign in again." });
    }

    const userId = user.id;
    const userEmail = typeof user.email === "function" ? user.email() : user.email;

    const body = [
        "mode=subscription",
        "payment_method_types[0]=card",
        "line_items[0][price]=" + encodeURIComponent(STRIPE_PRICE_ID),
        "line_items[0][quantity]=1",
        "customer_email=" + encodeURIComponent(userEmail),
        "client_reference_id=" + encodeURIComponent(userId),
        "success_url=" + encodeURIComponent(FRONTEND_URL + "/?stripe_success=true"),
        "cancel_url=" + encodeURIComponent(FRONTEND_URL + "/?stripe_cancel=true")
    ].join("&");

    try {
        const response = $http.send({
            url: "https://api.stripe.com/v1/checkout/sessions",
            method: "POST",
            body: body,
            headers: {
                "Authorization": "Bearer " + STRIPE_SECRET_KEY,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (response.statusCode !== 200) {
            $app.logger().error("Stripe Checkout Error", "status", response.statusCode, "body", response.raw);
            return e.json(response.statusCode, JSON.parse(response.raw));
        }

        const session = JSON.parse(response.raw);
        return e.json(200, { "url": session.url });
    } catch (err) {
        $app.logger().error("Stripe Checkout Hook Error", "error", err.message);
        return e.json(500, { "message": "Internal error: " + err.message });
    }
});

// Webhook listener
routerAdd("POST", "/api/stripe-webhook", (e) => {
    let data = {};
    try {
        if (typeof e.jsonBody === "function") { data = e.jsonBody(); }
        else { data = e.requestInfo().body; }
    } catch (err) {
        try { data = e.requestInfo().body; } catch (e2) { }
    }

    const type = data.type;
    const db = (e.app || $app).db();
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];

    // 1. Initial Checkout Success
    if (type === "checkout.session.completed") {
        const session = data.data.object;
        const userId = session.client_reference_id;

        if (userId) {
            try {
                db.newQuery("UPDATE users SET subscription_status = 'active', stripe_customer_id = {:customer}, stripe_subscription_id = {:sub}, updated = {:now} WHERE id = {:id}")
                    .bind({
                        customer: session.customer,
                        sub: session.subscription,
                        id: userId,
                        now: now
                    })
                    .execute();
                $app.logger().info("WEBHOOK: Checkout completed, user activated", "userId", userId);
            } catch (err) {
                $app.logger().error("WEBHOOK ERROR: Checkout activation failed", "error", err.message);
            }
        }
    }
    // 2. Subscription Updates (Cancellation, Renewal, etc.)
    else if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
        const sub = data.data.object;
        const customerId = sub.customer;

        // We find the user by their stripe_customer_id
        try {
            // Stripe timestamps are in seconds, SQL needs YYYY-MM-DD HH:MM:SS
            const periodEnd = new Date(sub.current_period_end * 1000).toISOString().replace('T', ' ').split('.')[0];
            const status = sub.status; // 'active', 'canceled', 'past_due', etc.

            // We update status AND the end date
            db.newQuery("UPDATE users SET subscription_status = {:status}, subscription_end = {:end}, updated = {:now} WHERE stripe_customer_id = {:customer}")
                .bind({
                    status: status,
                    end: periodEnd,
                    customer: customerId,
                    now: now
                })
                .execute();

            $app.logger().info("WEBHOOK: Subscription sync", "type", type, "status", status, "end", periodEnd);
        } catch (err) {
            $app.logger().error("WEBHOOK ERROR: Subscription sync failed", "error", err.message);
        }
    }

    return e.json(200, { "success": true });
});

// Route to create a Stripe Customer Portal Session
routerAdd("POST", "/api/stripe-portal", (e) => {
    const STRIPE_SECRET_KEY = $os.getenv("STRIPE_SECRET_KEY");
    const FRONTEND_URL = $os.getenv("FRONTEND_URL") || "http://localhost:5173";

    const user = e.auth || e.requestInfo().auth;
    if (!user) {
        return e.json(401, { "message": "Not authorized. No user model found." });
    }

    const customerId = user.get ? user.get("stripe_customer_id") : user.stripe_customer_id;

    if (!customerId) {
        return e.json(400, { "message": "No active subscription found (Stripe ID missing)." });
    }

    const body = [
        "customer=" + encodeURIComponent(customerId),
        "return_url=" + encodeURIComponent(FRONTEND_URL + "/")
    ].join("&");

    try {
        const response = $http.send({
            url: "https://api.stripe.com/v1/billing_portal/sessions",
            method: "POST",
            body: body,
            headers: {
                "Authorization": "Bearer " + STRIPE_SECRET_KEY,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (response.statusCode !== 200) {
            $app.logger().error("Stripe Portal Error", "status", response.statusCode, "body", response.raw);
            return e.json(response.statusCode, JSON.parse(response.raw));
        }

        const session = JSON.parse(response.raw);
        return e.json(200, { "url": session.url });
    } catch (err) {
        return e.json(500, { "message": err.message });
    }
});
