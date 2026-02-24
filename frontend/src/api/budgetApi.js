import { pb } from '../lib/pocketbase';

// Categories API
export const getCategories = async () => {
    return await pb.collection('categories').getFullList({
        sort: '-type,display_order',
    });
};

export const createCategory = async (category) => {
    // If display_order is not provided, calculate the next one for this section
    const finalCategory = { ...category };

    if (finalCategory.display_order === undefined || finalCategory.display_order === null) {
        try {
            // Find max display_order for categories of same type and fixed status
            const filter = `type = "${category.type}" && is_fixed = ${category.is_fixed === true}`;
            const existing = await pb.collection('categories').getList(1, 1, {
                filter,
                sort: '-display_order',
            });

            const maxOrder = existing.items.length > 0 ? (existing.items[0].display_order || 0) : 0;
            finalCategory.display_order = maxOrder + 1;
            console.log(`budgetApi: Calculated new display_order for ${category.name}: ${finalCategory.display_order}`);
        } catch (err) {
            console.error('budgetApi: Failed to calculate display_order:', err);
            finalCategory.display_order = 99;
        }
    }

    return await pb.collection('categories').create({
        ...finalCategory,
        user: pb.authStore.model.id,
    });
};

export const updateCategory = async (id, category) => {
    return await pb.collection('categories').update(id, category);
};

export const deleteCategory = async (id) => {
    // Delete all related monthly values first
    const monthlyValues = await pb.collection('monthly_values').getFullList({
        filter: `category = "${id}"`,
    });
    for (const v of monthlyValues) {
        await pb.collection('monthly_values').delete(v.id);
    }

    // Delete all related scenario values
    const scenarioValues = await pb.collection('scenario_values').getFullList({
        filter: `category = "${id}"`,
    });
    for (const v of scenarioValues) {
        await pb.collection('scenario_values').delete(v.id);
    }

    // Finally delete the category
    return await pb.collection('categories').delete(id);
};

// Monthly Values API
export const getValuesByYear = async (year, scenarioId = null) => {
    const categories = await getCategories();

    const collectionName = scenarioId ? 'scenario_values' : 'monthly_values';
    const filter = scenarioId
        ? `year = ${year} && scenario = "${scenarioId}"`
        : `year = ${year}`;

    const values = await pb.collection(collectionName).getFullList({
        filter,
    });

    // Transform to expected format (same as old backend)
    return categories.map(category => {
        const categoryValues = values
            .filter(v => v.category === category.id)
            .map(v => ({ month: v.month, amount: parseFloat(v.amount) }))
            .sort((a, b) => a.month - b.month);

        return {
            category_id: category.id,
            name: category.name,
            type: category.type,
            is_fixed: category.is_fixed,
            display_order: category.display_order,
            monthly_values: categoryValues
        };
    });
};

export const updateValue = async (category_id, year, month, amount, scenario_id = null) => {
    const collectionName = scenario_id ? 'scenario_values' : 'monthly_values';

    // Check if record exists for upsert
    let filter = `category = "${category_id}" && year = ${year} && month = ${month}`;
    if (scenario_id) filter += ` && scenario = "${scenario_id}"`;

    const existing = await pb.collection(collectionName).getList(1, 1, { filter });

    // Ensure amount is a valid number and not null/undefined/empty string
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);

    if (isNaN(numericAmount)) {
        console.error(' budgetApi: Invalid amount passed to updateValue:', { category_id, year, month, amount });
    }

    const data = {
        category: category_id,
        year,
        month,
        amount: isNaN(numericAmount) ? 0 : numericAmount,
        user: pb.authStore.model.id,
        ...(scenario_id && { scenario: scenario_id })
    };

    try {
        if (existing.items.length > 0) {
            // Minimal payload since we are updating an existing record
            const updateData = {
                amount: isNaN(numericAmount) ? 0 : numericAmount
            };
            console.log(`budgetApi: Updating ${collectionName} record ${existing.items[0].id}`, updateData);
            return await pb.collection(collectionName).update(existing.items[0].id, updateData);
        } else {
            console.log(`budgetApi: Creating new ${collectionName} record`, data);
            return await pb.collection(collectionName).create(data);
        }
    } catch (err) {
        console.error(`budgetApi: Detailed error saving to ${collectionName}:`, {
            message: err.message,
            status: err.status,
            data: err.data,
            requestData: data
        });
        throw err;
    }
};

export const batchUpdateValues = async (updates) => {
    if (!updates || updates.length === 0) return [];

    const firstUpdate = updates[0];
    const collectionName = firstUpdate.scenario_id ? 'scenario_values' : 'monthly_values';
    const year = firstUpdate.year;
    const scenario_id = firstUpdate.scenario_id;

    console.log(`budgetApi: Optimized batch update for ${updates.length} items in ${collectionName}`);

    // 1. Fetch all existing records for this scope (year + optional scenario)
    // This allows us to know which records to 'update' and which to 'create' in one go.
    let filter = `year = ${year}`;
    if (scenario_id) {
        filter += ` && scenario = "${scenario_id}"`;
    }

    try {
        const existingRecords = await pb.collection(collectionName).getFullList({
            filter,
            requestKey: null // Disable auto-cancellation for this fetch if needed
        });

        // Map for quick lookup: "categoryId-month" -> recordId
        const existingMap = {};
        existingRecords.forEach(rec => {
            const key = `${rec.category}-${rec.month}`;
            existingMap[key] = rec.id;
        });

        // 2. Build and send batch
        const batch = pb.createBatch();

        for (const update of updates) {
            const key = `${update.category_id}-${update.month}`;
            const existingId = existingMap[key];

            if (existingId) {
                // Update existing record
                batch.collection(collectionName).update(existingId, {
                    amount: update.amount
                });
            } else {
                // Create new record
                batch.collection(collectionName).create({
                    category: update.category_id,
                    year: update.year,
                    month: update.month,
                    amount: update.amount,
                    user: pb.authStore.model.id,
                    ...(update.scenario_id && { scenario: update.scenario_id })
                });
            }
        }

        const result = await batch.send();
        console.log(`budgetApi: Batch update completed successfully`);
        return result;

    } catch (err) {
        console.error('budgetApi: Optimized batch update failed:', err);
        throw err;
    }
};

// Summary API
export const getSummary = async (year, scenarioId = null) => {
    const categories = await getCategories();
    const collectionName = scenarioId ? 'scenario_values' : 'monthly_values';
    const filter = scenarioId
        ? `year = ${year} && scenario = "${scenarioId}"`
        : `year = ${year}`;

    const values = await pb.collection(collectionName).getFullList({ filter });

    // Calculate totals (re-implemented from old server.js)
    const incomeByMonth = {};
    const expenseFixedByMonth = {};
    const expenseVariableByMonth = {};
    let yearlyIncome = 0;
    let yearlyExpenseFixed = 0;
    let yearlyExpenseVariable = 0;

    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });

    values.forEach(v => {
        const category = categoryMap[v.category];
        if (!category) return;

        const amount = parseFloat(v.amount);

        if (category.type === 'income') {
            incomeByMonth[v.month] = (incomeByMonth[v.month] || 0) + amount;
            yearlyIncome += amount;
        } else if (category.is_fixed) {
            expenseFixedByMonth[v.month] = (expenseFixedByMonth[v.month] || 0) + amount;
            yearlyExpenseFixed += amount;
        } else {
            expenseVariableByMonth[v.month] = (expenseVariableByMonth[v.month] || 0) + amount;
            yearlyExpenseVariable += amount;
        }
    });

    const monthlyBalances = {};
    for (let m = 1; m <= 12; m++) {
        const income = incomeByMonth[m] || 0;
        const expenseFixed = expenseFixedByMonth[m] || 0;
        const expenseVariable = expenseVariableByMonth[m] || 0;
        monthlyBalances[m] = income - expenseFixed - expenseVariable;
    }

    return {
        year: parseInt(year),
        incomeByMonth,
        expenseFixedByMonth,
        expenseVariableByMonth,
        monthlyBalances,
        yearlyTotals: {
            income: yearlyIncome,
            expenseFixed: yearlyExpenseFixed,
            expenseVariable: yearlyExpenseVariable,
            totalExpense: yearlyExpenseFixed + yearlyExpenseVariable,
            balance: yearlyIncome - yearlyExpenseFixed - yearlyExpenseVariable
        }
    };
};

// Health check
export const checkHealth = async () => {
    return { status: 'healthy', database: 'pocketbase' };
};

// =====================================================
// SCENARIOS API
// =====================================================

export const getScenarios = async (year) => {
    return await pb.collection('scenarios').getFullList({
        filter: `year = ${year}`,
        sort: '-name',
    });
};

export const createScenario = async (name, year, copyFromLive = false) => {
    const scenario = await pb.collection('scenarios').create({
        name,
        year,
        user: pb.authStore.model.id,
    });

    if (copyFromLive) {
        const liveValues = await pb.collection('monthly_values').getFullList({
            filter: `year = ${year}`,
        });

        for (const v of liveValues) {
            await pb.collection('scenario_values').create({
                category: v.category,
                year: v.year,
                month: v.month,
                amount: v.amount,
                user: pb.authStore.model.id,
                scenario: scenario.id,
            });
        }
    }

    return scenario;
};

export const updateScenario = async (id, name) => {
    return await pb.collection('scenarios').update(id, { name });
};

export const deleteScenario = async (id) => {
    return await pb.collection('scenarios').delete(id);
};
