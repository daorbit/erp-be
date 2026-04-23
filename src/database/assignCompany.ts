import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Company from '../modules/companies/company.model.js';
import User from '../modules/auth/auth.model.js';

async function run() {
  await connectDB();

  const companies = await Company.find({}, '_id name').lean();
  console.log('\nAvailable companies:');
  companies.forEach((c) => console.log(`  ${c._id}  →  ${c.name}`));

  const user = await User.findOne({ email: 'admin@gmail.com' }, '_id email company').lean();
  console.log('\nUser:', user);

  if (companies.length === 0) {
    console.log('\nNo companies found. Create a company first via super_admin.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Assign the first company to the admin user
  const company = companies[0];
  await User.updateOne({ email: 'admin@gmail.com' }, { company: company._id });
  console.log(`\nAssigned company "${company.name}" (${company._id}) to admin@gmail.com`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
