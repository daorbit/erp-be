import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IOnboarding extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;

  // Step 1: Personal Info
  personalInfo?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
    email?: string;
    phone?: string;
    emergencyContact?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
    };
  };

  // Step 2: ID Verification
  idVerification?: {
    aadhaarNumber?: string;
    panNumber?: string;
    passportNumber?: string;
    drivingLicense?: string;
    aadhaarFile?: string;
    panFile?: string;
  };

  // Step 3: Bank Details
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: string;
    chequeFile?: string;
  };

  // Step 4: Documents
  documents?: {
    photo?: string;
    educationCertificate?: string;
    experienceLetter?: string;
    relievingLetter?: string;
    offerLetter?: string;
    addressProof?: string;
  };

  currentStep: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const addressSubSchema = new Schema({
  street: String,
  city: String,
  state: String,
  pinCode: String,
}, { _id: false });

const onboardingSchema = new Schema<IOnboarding>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    personalInfo: {
      firstName: String,
      middleName: String,
      lastName: String,
      dateOfBirth: String,
      gender: String,
      maritalStatus: String,
      email: String,
      phone: String,
      emergencyContact: String,
      address: addressSubSchema,
    },
    idVerification: {
      aadhaarNumber: String,
      panNumber: String,
      passportNumber: String,
      drivingLicense: String,
      aadhaarFile: String,
      panFile: String,
    },
    bankDetails: {
      bankName: String,
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      accountType: String,
      chequeFile: String,
    },
    documents: {
      photo: String,
      educationCertificate: String,
      experienceLetter: String,
      relievingLetter: String,
      offerLetter: String,
      addressProof: String,
    },
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: Date,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    remarks: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

onboardingSchema.index({ user: 1 }, { unique: true });
onboardingSchema.index({ company: 1, status: 1 });

const Onboarding: Model<IOnboarding> = mongoose.model<IOnboarding>('Onboarding', onboardingSchema);

export default Onboarding;
