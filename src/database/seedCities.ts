import City from '../modules/cities/city.model.js';

/**
 * Major Indian cities mapped to their state/UT names.
 * Seeded globally (no company scope) so master pickers across the app can
 * use them as a shared reference list.
 */
const INDIAN_CITIES: Array<{ name: string; state: string; shortName?: string; stdCode?: string }> = [
  // ANDAMAN AND NICOBAR ISLANDS
  { name: 'PORT BLAIR', state: 'ANDAMAN AND NICOBAR ISLANDS', shortName: 'PBL', stdCode: '03192' },

  // ANDHRA PRADESH
  { name: 'VISAKHAPATNAM', state: 'ANDHRA PRADESH', shortName: 'VSP', stdCode: '0891' },
  { name: 'VIJAYAWADA', state: 'ANDHRA PRADESH', shortName: 'VJA', stdCode: '0866' },
  { name: 'GUNTUR', state: 'ANDHRA PRADESH', shortName: 'GNT', stdCode: '0863' },
  { name: 'NELLORE', state: 'ANDHRA PRADESH', shortName: 'NLR', stdCode: '0861' },
  { name: 'KURNOOL', state: 'ANDHRA PRADESH', shortName: 'KNL', stdCode: '08518' },
  { name: 'TIRUPATI', state: 'ANDHRA PRADESH', shortName: 'TPT', stdCode: '0877' },
  { name: 'RAJAHMUNDRY', state: 'ANDHRA PRADESH', shortName: 'RJY', stdCode: '0883' },
  { name: 'KAKINADA', state: 'ANDHRA PRADESH', shortName: 'KKD', stdCode: '0884' },
  { name: 'ANANTAPUR', state: 'ANDHRA PRADESH', shortName: 'ATP', stdCode: '08554' },

  // ARUNACHAL PRADESH
  { name: 'ITANAGAR', state: 'ARUNACHAL PRADESH', shortName: 'ITA', stdCode: '0360' },
  { name: 'NAHARLAGUN', state: 'ARUNACHAL PRADESH', shortName: 'NHG', stdCode: '0360' },

  // ASSAM
  { name: 'GUWAHATI', state: 'ASSAM', shortName: 'GHY', stdCode: '0361' },
  { name: 'SILCHAR', state: 'ASSAM', shortName: 'SCH', stdCode: '03842' },
  { name: 'DIBRUGARH', state: 'ASSAM', shortName: 'DBR', stdCode: '0373' },
  { name: 'JORHAT', state: 'ASSAM', shortName: 'JHT', stdCode: '0376' },
  { name: 'NAGAON', state: 'ASSAM', shortName: 'NGN', stdCode: '03672' },

  // BIHAR
  { name: 'PATNA', state: 'BIHAR', shortName: 'PAT', stdCode: '0612' },
  { name: 'GAYA', state: 'BIHAR', shortName: 'GYA', stdCode: '0631' },
  { name: 'BHAGALPUR', state: 'BIHAR', shortName: 'BGP', stdCode: '0641' },
  { name: 'MUZAFFARPUR', state: 'BIHAR', shortName: 'MZP', stdCode: '0621' },
  { name: 'PURNIA', state: 'BIHAR', shortName: 'PNA', stdCode: '06454' },
  { name: 'DARBHANGA', state: 'BIHAR', shortName: 'DBG', stdCode: '06272' },

  // CHANDIGARH
  { name: 'CHANDIGARH', state: 'CHANDIGARH', shortName: 'CHD', stdCode: '0172' },

  // CHHATTISGARH
  { name: 'RAIPUR', state: 'CHHATTISGARH', shortName: 'RPR', stdCode: '0771' },
  { name: 'BHILAI', state: 'CHHATTISGARH', shortName: 'BHL', stdCode: '0788' },
  { name: 'BILASPUR', state: 'CHHATTISGARH', shortName: 'BSP', stdCode: '07752' },
  { name: 'KORBA', state: 'CHHATTISGARH', shortName: 'KRB', stdCode: '07759' },
  { name: 'DURG', state: 'CHHATTISGARH', shortName: 'DRG', stdCode: '0788' },

  // DADRA AND NAGAR HAVELI AND DAMAN AND DIU
  { name: 'DAMAN', state: 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', shortName: 'DMN', stdCode: '0260' },
  { name: 'SILVASSA', state: 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', shortName: 'SLV', stdCode: '0260' },

  // DELHI
  { name: 'NEW DELHI', state: 'DELHI', shortName: 'NDL', stdCode: '011' },
  { name: 'DELHI', state: 'DELHI', shortName: 'DLI', stdCode: '011' },
  { name: 'DWARKA', state: 'DELHI', shortName: 'DWK', stdCode: '011' },
  { name: 'ROHINI', state: 'DELHI', shortName: 'RHN', stdCode: '011' },
  { name: 'SAKET', state: 'DELHI', shortName: 'SKT', stdCode: '011' },

  // GOA
  { name: 'PANAJI', state: 'GOA', shortName: 'PNJ', stdCode: '0832' },
  { name: 'MARGAO', state: 'GOA', shortName: 'MGO', stdCode: '0832' },
  { name: 'VASCO DA GAMA', state: 'GOA', shortName: 'VDG', stdCode: '0834' },
  { name: 'MAPUSA', state: 'GOA', shortName: 'MPS', stdCode: '0832' },

  // GUJARAT
  { name: 'AHMEDABAD', state: 'GUJARAT', shortName: 'AMD', stdCode: '079' },
  { name: 'SURAT', state: 'GUJARAT', shortName: 'SRT', stdCode: '0261' },
  { name: 'VADODARA', state: 'GUJARAT', shortName: 'VDR', stdCode: '0265' },
  { name: 'RAJKOT', state: 'GUJARAT', shortName: 'RJT', stdCode: '0281' },
  { name: 'BHAVNAGAR', state: 'GUJARAT', shortName: 'BVN', stdCode: '0278' },
  { name: 'JAMNAGAR', state: 'GUJARAT', shortName: 'JMN', stdCode: '0288' },
  { name: 'GANDHINAGAR', state: 'GUJARAT', shortName: 'GND', stdCode: '079' },
  { name: 'JUNAGADH', state: 'GUJARAT', shortName: 'JGD', stdCode: '0285' },
  { name: 'ANAND', state: 'GUJARAT', shortName: 'AND', stdCode: '02692' },
  { name: 'NAVSARI', state: 'GUJARAT', shortName: 'NVS', stdCode: '02637' },

  // HARYANA
  { name: 'FARIDABAD', state: 'HARYANA', shortName: 'FBD', stdCode: '0129' },
  { name: 'GURUGRAM', state: 'HARYANA', shortName: 'GGN', stdCode: '0124' },
  { name: 'PANIPAT', state: 'HARYANA', shortName: 'PNP', stdCode: '0180' },
  { name: 'AMBALA', state: 'HARYANA', shortName: 'ABL', stdCode: '0171' },
  { name: 'YAMUNANAGAR', state: 'HARYANA', shortName: 'YMN', stdCode: '01732' },
  { name: 'ROHTAK', state: 'HARYANA', shortName: 'RTK', stdCode: '01262' },
  { name: 'HISAR', state: 'HARYANA', shortName: 'HSR', stdCode: '01662' },
  { name: 'KARNAL', state: 'HARYANA', shortName: 'KNL', stdCode: '0184' },
  { name: 'SONIPAT', state: 'HARYANA', shortName: 'SNP', stdCode: '0130' },

  // HIMACHAL PRADESH
  { name: 'SHIMLA', state: 'HIMACHAL PRADESH', shortName: 'SML', stdCode: '0177' },
  { name: 'DHARAMSHALA', state: 'HIMACHAL PRADESH', shortName: 'DHR', stdCode: '01892' },
  { name: 'SOLAN', state: 'HIMACHAL PRADESH', shortName: 'SLN', stdCode: '01792' },
  { name: 'MANDI', state: 'HIMACHAL PRADESH', shortName: 'MDI', stdCode: '01905' },

  // JAMMU AND KASHMIR
  { name: 'SRINAGAR', state: 'JAMMU AND KASHMIR', shortName: 'SXR', stdCode: '0194' },
  { name: 'JAMMU', state: 'JAMMU AND KASHMIR', shortName: 'JAM', stdCode: '0191' },
  { name: 'ANANTNAG', state: 'JAMMU AND KASHMIR', shortName: 'ANN', stdCode: '01932' },
  { name: 'BARAMULLA', state: 'JAMMU AND KASHMIR', shortName: 'BRM', stdCode: '01952' },

  // JHARKHAND
  { name: 'RANCHI', state: 'JHARKHAND', shortName: 'RNC', stdCode: '0651' },
  { name: 'JAMSHEDPUR', state: 'JHARKHAND', shortName: 'JSP', stdCode: '0657' },
  { name: 'DHANBAD', state: 'JHARKHAND', shortName: 'DHN', stdCode: '0326' },
  { name: 'BOKARO', state: 'JHARKHAND', shortName: 'BKR', stdCode: '06542' },
  { name: 'HAZARIBAGH', state: 'JHARKHAND', shortName: 'HZB', stdCode: '06546' },

  // KARNATAKA
  { name: 'BENGALURU', state: 'KARNATAKA', shortName: 'BLR', stdCode: '080' },
  { name: 'MYSURU', state: 'KARNATAKA', shortName: 'MYS', stdCode: '0821' },
  { name: 'HUBBALLI', state: 'KARNATAKA', shortName: 'HBL', stdCode: '0836' },
  { name: 'MANGALURU', state: 'KARNATAKA', shortName: 'MNG', stdCode: '0824' },
  { name: 'BELAGAVI', state: 'KARNATAKA', shortName: 'BGM', stdCode: '0831' },
  { name: 'DAVANAGERE', state: 'KARNATAKA', shortName: 'DVG', stdCode: '08192' },
  { name: 'BALLARI', state: 'KARNATAKA', shortName: 'BLY', stdCode: '08392' },
  { name: 'TUMKURU', state: 'KARNATAKA', shortName: 'TKR', stdCode: '0816' },
  { name: 'SHIVAMOGGA', state: 'KARNATAKA', shortName: 'SHM', stdCode: '08182' },
  { name: 'VIJAYAPURA', state: 'KARNATAKA', shortName: 'BJP', stdCode: '08352' },

  // KERALA
  { name: 'THIRUVANANTHAPURAM', state: 'KERALA', shortName: 'TRV', stdCode: '0471' },
  { name: 'KOCHI', state: 'KERALA', shortName: 'COK', stdCode: '0484' },
  { name: 'KOZHIKODE', state: 'KERALA', shortName: 'CCJ', stdCode: '0495' },
  { name: 'THRISSUR', state: 'KERALA', shortName: 'TCR', stdCode: '0487' },
  { name: 'KOLLAM', state: 'KERALA', shortName: 'KLM', stdCode: '0474' },
  { name: 'KANNUR', state: 'KERALA', shortName: 'CNN', stdCode: '0497' },
  { name: 'ALAPPUZHA', state: 'KERALA', shortName: 'ALP', stdCode: '0477' },
  { name: 'PALAKKAD', state: 'KERALA', shortName: 'PGT', stdCode: '0491' },

  // LADAKH
  { name: 'LEH', state: 'LADAKH', shortName: 'LEH', stdCode: '01982' },
  { name: 'KARGIL', state: 'LADAKH', shortName: 'KGL', stdCode: '01985' },

  // LAKSHADWEEP
  { name: 'KAVARATTI', state: 'LAKSHADWEEP', shortName: 'KVT', stdCode: '04896' },

  // MADHYA PRADESH
  { name: 'BHOPAL', state: 'MADHYA PRADESH', shortName: 'BPL', stdCode: '0755' },
  { name: 'INDORE', state: 'MADHYA PRADESH', shortName: 'IDR', stdCode: '0731' },
  { name: 'JABALPUR', state: 'MADHYA PRADESH', shortName: 'JBP', stdCode: '0761' },
  { name: 'GWALIOR', state: 'MADHYA PRADESH', shortName: 'GWL', stdCode: '0751' },
  { name: 'UJJAIN', state: 'MADHYA PRADESH', shortName: 'UJN', stdCode: '0734' },
  { name: 'SAGAR', state: 'MADHYA PRADESH', shortName: 'SGR', stdCode: '07582' },
  { name: 'RATLAM', state: 'MADHYA PRADESH', shortName: 'RTM', stdCode: '07412' },
  { name: 'SATNA', state: 'MADHYA PRADESH', shortName: 'STN', stdCode: '07672' },

  // MAHARASHTRA
  { name: 'MUMBAI', state: 'MAHARASHTRA', shortName: 'BOM', stdCode: '022' },
  { name: 'PUNE', state: 'MAHARASHTRA', shortName: 'PNQ', stdCode: '020' },
  { name: 'NAGPUR', state: 'MAHARASHTRA', shortName: 'NAG', stdCode: '0712' },
  { name: 'NASHIK', state: 'MAHARASHTRA', shortName: 'NSK', stdCode: '0253' },
  { name: 'AURANGABAD', state: 'MAHARASHTRA', shortName: 'AWB', stdCode: '0240' },
  { name: 'SOLAPUR', state: 'MAHARASHTRA', shortName: 'SUR', stdCode: '0217' },
  { name: 'THANE', state: 'MAHARASHTRA', shortName: 'TNA', stdCode: '022' },
  { name: 'KOLHAPUR', state: 'MAHARASHTRA', shortName: 'KOP', stdCode: '0231' },
  { name: 'AMRAVATI', state: 'MAHARASHTRA', shortName: 'AMV', stdCode: '0721' },
  { name: 'NAVI MUMBAI', state: 'MAHARASHTRA', shortName: 'NMB', stdCode: '022' },
  { name: 'PIMPRI-CHINCHWAD', state: 'MAHARASHTRA', shortName: 'PPC', stdCode: '020' },
  { name: 'SANGLI', state: 'MAHARASHTRA', shortName: 'SNG', stdCode: '0233' },
  { name: 'MALEGAON', state: 'MAHARASHTRA', shortName: 'MLG', stdCode: '02554' },

  // MANIPUR
  { name: 'IMPHAL', state: 'MANIPUR', shortName: 'IMF', stdCode: '0385' },

  // MEGHALAYA
  { name: 'SHILLONG', state: 'MEGHALAYA', shortName: 'SHL', stdCode: '0364' },

  // MIZORAM
  { name: 'AIZAWL', state: 'MIZORAM', shortName: 'AJL', stdCode: '0389' },

  // NAGALAND
  { name: 'KOHIMA', state: 'NAGALAND', shortName: 'KOM', stdCode: '0370' },
  { name: 'DIMAPUR', state: 'NAGALAND', shortName: 'DMU', stdCode: '03862' },

  // ODISHA
  { name: 'BHUBANESWAR', state: 'ODISHA', shortName: 'BBI', stdCode: '0674' },
  { name: 'CUTTACK', state: 'ODISHA', shortName: 'CTC', stdCode: '0671' },
  { name: 'ROURKELA', state: 'ODISHA', shortName: 'RKL', stdCode: '0661' },
  { name: 'BRAHMAPUR', state: 'ODISHA', shortName: 'BPT', stdCode: '0680' },
  { name: 'SAMBALPUR', state: 'ODISHA', shortName: 'SBP', stdCode: '0663' },

  // PUDUCHERRY
  { name: 'PUDUCHERRY', state: 'PUDUCHERRY', shortName: 'PNY', stdCode: '0413' },

  // PUNJAB
  { name: 'LUDHIANA', state: 'PUNJAB', shortName: 'LDH', stdCode: '0161' },
  { name: 'AMRITSAR', state: 'PUNJAB', shortName: 'ATQ', stdCode: '0183' },
  { name: 'JALANDHAR', state: 'PUNJAB', shortName: 'JLR', stdCode: '0181' },
  { name: 'PATIALA', state: 'PUNJAB', shortName: 'PTL', stdCode: '0175' },
  { name: 'BATHINDA', state: 'PUNJAB', shortName: 'BTI', stdCode: '0164' },
  { name: 'MOHALI', state: 'PUNJAB', shortName: 'MOH', stdCode: '0172' },
  { name: 'PATHANKOT', state: 'PUNJAB', shortName: 'PTK', stdCode: '0186' },

  // RAJASTHAN
  { name: 'JAIPUR', state: 'RAJASTHAN', shortName: 'JAI', stdCode: '0141' },
  { name: 'JODHPUR', state: 'RAJASTHAN', shortName: 'JDH', stdCode: '0291' },
  { name: 'KOTA', state: 'RAJASTHAN', shortName: 'KTJ', stdCode: '0744' },
  { name: 'BIKANER', state: 'RAJASTHAN', shortName: 'BKN', stdCode: '0151' },
  { name: 'AJMER', state: 'RAJASTHAN', shortName: 'AJM', stdCode: '0145' },
  { name: 'UDAIPUR', state: 'RAJASTHAN', shortName: 'UDR', stdCode: '0294' },
  { name: 'BHILWARA', state: 'RAJASTHAN', shortName: 'BHL', stdCode: '01482' },
  { name: 'ALWAR', state: 'RAJASTHAN', shortName: 'AWR', stdCode: '0144' },
  { name: 'SIKAR', state: 'RAJASTHAN', shortName: 'SKR', stdCode: '01572' },
  { name: 'SRIGANGANAGAR', state: 'RAJASTHAN', shortName: 'SGG', stdCode: '0154' },

  // SIKKIM
  { name: 'GANGTOK', state: 'SIKKIM', shortName: 'GTK', stdCode: '03592' },

  // TAMIL NADU
  { name: 'CHENNAI', state: 'TAMIL NADU', shortName: 'MAA', stdCode: '044' },
  { name: 'COIMBATORE', state: 'TAMIL NADU', shortName: 'CJB', stdCode: '0422' },
  { name: 'MADURAI', state: 'TAMIL NADU', shortName: 'IXM', stdCode: '0452' },
  { name: 'TIRUCHIRAPPALLI', state: 'TAMIL NADU', shortName: 'TRZ', stdCode: '0431' },
  { name: 'SALEM', state: 'TAMIL NADU', shortName: 'SXL', stdCode: '0427' },
  { name: 'TIRUNELVELI', state: 'TAMIL NADU', shortName: 'TEN', stdCode: '0462' },
  { name: 'TIRUPPUR', state: 'TAMIL NADU', shortName: 'TUP', stdCode: '0421' },
  { name: 'VELLORE', state: 'TAMIL NADU', shortName: 'VLR', stdCode: '0416' },
  { name: 'ERODE', state: 'TAMIL NADU', shortName: 'ERD', stdCode: '0424' },
  { name: 'THOOTHUKUDI', state: 'TAMIL NADU', shortName: 'TCN', stdCode: '0461' },

  // TELANGANA
  { name: 'HYDERABAD', state: 'TELANGANA', shortName: 'HYD', stdCode: '040' },
  { name: 'WARANGAL', state: 'TELANGANA', shortName: 'WGL', stdCode: '0870' },
  { name: 'NIZAMABAD', state: 'TELANGANA', shortName: 'NZB', stdCode: '08462' },
  { name: 'KARIMNAGAR', state: 'TELANGANA', shortName: 'KMG', stdCode: '0878' },
  { name: 'KHAMMAM', state: 'TELANGANA', shortName: 'KMM', stdCode: '08742' },
  { name: 'RAMAGUNDAM', state: 'TELANGANA', shortName: 'RMG', stdCode: '08728' },

  // TRIPURA
  { name: 'AGARTALA', state: 'TRIPURA', shortName: 'IXA', stdCode: '0381' },

  // UTTAR PRADESH
  { name: 'LUCKNOW', state: 'UTTAR PRADESH', shortName: 'LKO', stdCode: '0522' },
  { name: 'KANPUR', state: 'UTTAR PRADESH', shortName: 'KNU', stdCode: '0512' },
  { name: 'GHAZIABAD', state: 'UTTAR PRADESH', shortName: 'GZB', stdCode: '0120' },
  { name: 'AGRA', state: 'UTTAR PRADESH', shortName: 'AGR', stdCode: '0562' },
  { name: 'MEERUT', state: 'UTTAR PRADESH', shortName: 'MER', stdCode: '0121' },
  { name: 'VARANASI', state: 'UTTAR PRADESH', shortName: 'VNS', stdCode: '0542' },
  { name: 'PRAYAGRAJ', state: 'UTTAR PRADESH', shortName: 'IXD', stdCode: '0532' },
  { name: 'BAREILLY', state: 'UTTAR PRADESH', shortName: 'BEK', stdCode: '0581' },
  { name: 'ALIGARH', state: 'UTTAR PRADESH', shortName: 'ALG', stdCode: '0571' },
  { name: 'MORADABAD', state: 'UTTAR PRADESH', shortName: 'MDB', stdCode: '0591' },
  { name: 'NOIDA', state: 'UTTAR PRADESH', shortName: 'NOI', stdCode: '0120' },
  { name: 'MATHURA', state: 'UTTAR PRADESH', shortName: 'MTR', stdCode: '0565' },
  { name: 'FIROZABAD', state: 'UTTAR PRADESH', shortName: 'FZD', stdCode: '05612' },
  { name: 'GORAKHPUR', state: 'UTTAR PRADESH', shortName: 'GOP', stdCode: '0551' },
  { name: 'JHANSI', state: 'UTTAR PRADESH', shortName: 'JHS', stdCode: '0510' },

  // UTTARAKHAND
  { name: 'DEHRADUN', state: 'UTTARAKHAND', shortName: 'DED', stdCode: '0135' },
  { name: 'HARIDWAR', state: 'UTTARAKHAND', shortName: 'HDW', stdCode: '01334' },
  { name: 'ROORKEE', state: 'UTTARAKHAND', shortName: 'RKE', stdCode: '01332' },
  { name: 'HALDWANI', state: 'UTTARAKHAND', shortName: 'HLW', stdCode: '05946' },
  { name: 'NAINITAL', state: 'UTTARAKHAND', shortName: 'NTL', stdCode: '05942' },

  // WEST BENGAL
  { name: 'KOLKATA', state: 'WEST BENGAL', shortName: 'CCU', stdCode: '033' },
  { name: 'ASANSOL', state: 'WEST BENGAL', shortName: 'ASN', stdCode: '0341' },
  { name: 'SILIGURI', state: 'WEST BENGAL', shortName: 'SLG', stdCode: '0353' },
  { name: 'DURGAPUR', state: 'WEST BENGAL', shortName: 'DGP', stdCode: '0343' },
  { name: 'BARDHAMAN', state: 'WEST BENGAL', shortName: 'BWN', stdCode: '0342' },
  { name: 'MALDA', state: 'WEST BENGAL', shortName: 'MLD', stdCode: '03512' },
  { name: 'HOWRAH', state: 'WEST BENGAL', shortName: 'HWH', stdCode: '033' },
  { name: 'KHARAGPUR', state: 'WEST BENGAL', shortName: 'KGP', stdCode: '03222' },
];

export async function seedIndianCities(): Promise<void> {
  try {
    // Only seed global (no-company) entries; per-company city lists stay untouched.
    const existing = await City.countDocuments({ company: { $exists: false } });
    if (existing >= INDIAN_CITIES.length) return;

    const ops = INDIAN_CITIES.map((c) => ({
      updateOne: {
        filter: { name: c.name, state: c.state, company: { $exists: false } },
        update: { $setOnInsert: { ...c, isActive: true } },
        upsert: true,
      },
    }));

    const res = await City.bulkWrite(ops, { ordered: false });
    const inserted = (res as any).upsertedCount ?? 0;
    if (inserted > 0) {
      console.log(`[SEED] Indian cities seeded (${inserted} new, ${INDIAN_CITIES.length} total)`);
    }
  } catch (error: any) {
    console.error('[SEED] Failed to seed Indian cities:', error.message);
  }
}
