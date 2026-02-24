import { pb } from '../lib/pocketbase';

/**
 * Exports all user-related data from PocketBase to a JSON object.
 */
export const exportUserData = async () => {
    const userId = pb.authStore.model.id;

    // Fetch all relevant data concurrently
    const [categories, monthlyValues, scenarios, scenarioValues] = await Promise.all([
        pb.collection('categories').getFullList({ filter: `user = "${userId}"` }),
        pb.collection('monthly_values').getFullList({ filter: `user = "${userId}"` }),
        pb.collection('scenarios').getFullList({ filter: `user = "${userId}"` }),
        pb.collection('scenario_values').getFullList({ filter: `user = "${userId}"` }),
    ]);

    const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                is_fixed: c.is_fixed,
                display_order: c.display_order
            })),
            monthly_values: monthlyValues.map(v => ({
                category: v.category,
                year: v.year,
                month: v.month,
                amount: v.amount
            })),
            scenarios: scenarios.map(s => ({
                id: s.id,
                name: s.name,
                year: s.year
            })),
            scenario_values: scenarioValues.map(v => ({
                scenario: v.scenario,
                category: v.category,
                year: v.year,
                month: v.month,
                amount: v.amount
            }))
        }
    };

    return exportData;
};

/**
 * Imports user data from a JSON object into the current PocketBase instance.
 * Handles ID mapping for categories and scenarios.
 */
export const importUserData = async (importData, onProgress) => {
    const userId = pb.authStore.model.id;
    const { categories, monthly_values, scenarios, scenario_values } = importData.data;

    const categoryMap = {}; // oldId -> newId
    const scenarioMap = {}; // oldId -> newId

    let completed = 0;
    const totalSteps = categories.length + scenarios.length + monthly_values.length + scenario_values.length;

    const updateProgress = (message) => {
        const percent = Math.round((completed / totalSteps) * 100);
        if (onProgress) onProgress(message, percent);
    };

    // 1. Import Categories
    updateProgress('Importing categories...');
    for (const cat of categories) {
        const newCat = await pb.collection('categories').create({
            name: cat.name,
            type: cat.type,
            is_fixed: cat.is_fixed,
            display_order: cat.display_order,
            user: userId
        });
        categoryMap[cat.id] = newCat.id;
        completed++;
        updateProgress('Importing categories...');
    }

    // 2. Import Scenarios
    updateProgress('Importing scenarios...');
    for (const sc of scenarios) {
        const newSc = await pb.collection('scenarios').create({
            name: sc.name,
            year: sc.year,
            user: userId
        });
        scenarioMap[sc.id] = newSc.id;
        completed++;
        updateProgress('Importing scenarios...');
    }

    // 3. Import Monthly Values
    updateProgress('Importing monthly values...');
    for (const val of monthly_values) {
        const newCategoryId = categoryMap[val.category];
        if (newCategoryId) {
            await pb.collection('monthly_values').create({
                category: newCategoryId,
                year: val.year,
                month: val.month,
                amount: val.amount,
                user: userId
            });
        }
        completed++;
        updateProgress('Importing monthly values...');
    }

    // 4. Import Scenario Values
    updateProgress('Importing scenario values...');
    for (const val of scenario_values) {
        const newScenarioId = scenarioMap[val.scenario];
        const newCategoryId = categoryMap[val.category];
        if (newScenarioId && newCategoryId) {
            await pb.collection('scenario_values').create({
                scenario: newScenarioId,
                category: newCategoryId,
                year: val.year,
                month: val.month,
                amount: val.amount,
                user: userId
            });
        }
        completed++;
        updateProgress('Importing scenario values...');
    }

    updateProgress('Import complete!', 100);
};

/**
 * Triggers a file download in the browser.
 */
export const downloadJson = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
