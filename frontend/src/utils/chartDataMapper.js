const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Merges live and planning data for Recharts Comparison Chart.
 * 
 * @param {Object} liveSummary - Summary data for live scenario (scenario_id is NULL)
 * @param {Object} planSummary - Summary data for selected planning scenario
 * @returns {Array} - Array of objects formatted for Recharts
 */
export const mergeScenarioData = (liveSummary, planSummary) => {
    if (!liveSummary || !planSummary) return [];

    return MONTHS.map((month, index) => {
        const monthNum = index + 1;

        // Extract monthly balances (income - total expense)
        // Adjust these keys based on actual API response format if different
        const liveVal = liveSummary.monthlyBalances?.[monthNum] || 0;
        const planVal = planSummary.monthlyBalances?.[monthNum] || 0;

        const diff = liveVal - planVal;
        const diffPercent = planVal !== 0 ? (diff / Math.abs(planVal)) * 100 : 0;

        return {
            month,
            monthNum,
            live: liveVal,
            plan: planVal,
            diff,
            diffPercent: parseFloat(diffPercent.toFixed(2))
        };
    });
};
