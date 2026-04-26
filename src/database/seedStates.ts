import State from '../modules/states/state.model.js';

/**
 * Indian States + Union Territories with GSTIN state codes.
 * Seeded globally (no company scope) so master pickers across the app can
 * use them as a shared reference list.
 */
const INDIAN_STATES: Array<{ name: string; shortName: string; stateCode: string; isUT?: boolean }> = [
  { name: 'ANDAMAN AND NICOBAR ISLANDS', shortName: 'AN', stateCode: '35', isUT: true },
  { name: 'ANDHRA PRADESH', shortName: 'AP', stateCode: '37' },
  { name: 'ARUNACHAL PRADESH', shortName: 'AR', stateCode: '12' },
  { name: 'ASSAM', shortName: 'AS', stateCode: '18' },
  { name: 'BIHAR', shortName: 'BR', stateCode: '10' },
  { name: 'CHANDIGARH', shortName: 'CH', stateCode: '04', isUT: true },
  { name: 'CHHATTISGARH', shortName: 'CG', stateCode: '22' },
  { name: 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', shortName: 'DN', stateCode: '26', isUT: true },
  { name: 'DELHI', shortName: 'DL', stateCode: '07', isUT: true },
  { name: 'GOA', shortName: 'GA', stateCode: '30' },
  { name: 'GUJARAT', shortName: 'GJ', stateCode: '24' },
  { name: 'HARYANA', shortName: 'HR', stateCode: '06' },
  { name: 'HIMACHAL PRADESH', shortName: 'HP', stateCode: '02' },
  { name: 'JAMMU AND KASHMIR', shortName: 'JK', stateCode: '01', isUT: true },
  { name: 'JHARKHAND', shortName: 'JH', stateCode: '20' },
  { name: 'KARNATAKA', shortName: 'KA', stateCode: '29' },
  { name: 'KERALA', shortName: 'KL', stateCode: '32' },
  { name: 'LADAKH', shortName: 'LA', stateCode: '38', isUT: true },
  { name: 'LAKSHADWEEP', shortName: 'LD', stateCode: '31', isUT: true },
  { name: 'MADHYA PRADESH', shortName: 'MP', stateCode: '23' },
  { name: 'MAHARASHTRA', shortName: 'MH', stateCode: '27' },
  { name: 'MANIPUR', shortName: 'MN', stateCode: '14' },
  { name: 'MEGHALAYA', shortName: 'ML', stateCode: '17' },
  { name: 'MIZORAM', shortName: 'MZ', stateCode: '15' },
  { name: 'NAGALAND', shortName: 'NL', stateCode: '13' },
  { name: 'ODISHA', shortName: 'OR', stateCode: '21' },
  { name: 'PUDUCHERRY', shortName: 'PY', stateCode: '34', isUT: true },
  { name: 'PUNJAB', shortName: 'PB', stateCode: '03' },
  { name: 'RAJASTHAN', shortName: 'RJ', stateCode: '08' },
  { name: 'SIKKIM', shortName: 'SK', stateCode: '11' },
  { name: 'TAMIL NADU', shortName: 'TN', stateCode: '33' },
  { name: 'TELANGANA', shortName: 'TG', stateCode: '36' },
  { name: 'TRIPURA', shortName: 'TR', stateCode: '16' },
  { name: 'UTTAR PRADESH', shortName: 'UP', stateCode: '09' },
  { name: 'UTTARAKHAND', shortName: 'UK', stateCode: '05' },
  { name: 'WEST BENGAL', shortName: 'WB', stateCode: '19' },
];

export async function seedIndianStates(): Promise<void> {
  try {
    // Only seed global (no-company) entries; per-company state lists stay untouched.
    const existing = await State.countDocuments({ company: { $exists: false } });
    if (existing >= INDIAN_STATES.length) return;

    const ops = INDIAN_STATES.map((s) => ({
      updateOne: {
        filter: { name: s.name, company: { $exists: false } },
        update: { $setOnInsert: { ...s, country: 'INDIA', isActive: true } },
        upsert: true,
      },
    }));

    const res = await State.bulkWrite(ops, { ordered: false });
    const inserted = (res as any).upsertedCount ?? 0;
    if (inserted > 0) {
      console.log(`[SEED] Indian states seeded (${inserted} new, ${INDIAN_STATES.length} total)`);
    }
  } catch (error: any) {
    console.error('[SEED] Failed to seed Indian states:', error.message);
  }
}
