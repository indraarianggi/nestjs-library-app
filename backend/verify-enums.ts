import {
  Role,
  MembershipStatus,
  BookStatus,
  CopyStatus,
  LoanStatus,
  Currency,
  SmtpProvider,
} from '@prisma/client';

// This file verifies that all enums are properly typed in TypeScript
console.log('Verifying enum types...');

// Role enum
const adminRole: Role = 'ADMIN';
const memberRole: Role = 'MEMBER';
console.log('✓ Role enum:', { adminRole, memberRole });

// MembershipStatus enum
const pendingStatus: MembershipStatus = 'PENDING';
const activeStatus: MembershipStatus = 'ACTIVE';
const suspendedStatus: MembershipStatus = 'SUSPENDED';
console.log('✓ MembershipStatus enum:', {
  pendingStatus,
  activeStatus,
  suspendedStatus,
});

// BookStatus enum
const activeBook: BookStatus = 'ACTIVE';
const archivedBook: BookStatus = 'ARCHIVED';
console.log('✓ BookStatus enum:', { activeBook, archivedBook });

// CopyStatus enum
const availableCopy: CopyStatus = 'AVAILABLE';
const onLoanCopy: CopyStatus = 'ON_LOAN';
const lostCopy: CopyStatus = 'LOST';
const damagedCopy: CopyStatus = 'DAMAGED';
console.log('✓ CopyStatus enum:', {
  availableCopy,
  onLoanCopy,
  lostCopy,
  damagedCopy,
});

// LoanStatus enum
const requestedLoan: LoanStatus = 'REQUESTED';
const approvedLoan: LoanStatus = 'APPROVED';
const activeLoan: LoanStatus = 'ACTIVE';
const overdueLoan: LoanStatus = 'OVERDUE';
const returnedLoan: LoanStatus = 'RETURNED';
const rejectedLoan: LoanStatus = 'REJECTED';
console.log('✓ LoanStatus enum:', {
  requestedLoan,
  approvedLoan,
  activeLoan,
  overdueLoan,
  returnedLoan,
  rejectedLoan,
});

// Currency enum
const idrCurrency: Currency = 'IDR';
console.log('✓ Currency enum:', { idrCurrency });

// SmtpProvider enum
const mailtrapProvider: SmtpProvider = 'MAILTRAP';
console.log('✓ SmtpProvider enum:', { mailtrapProvider });

console.log('\n✅ All enum types are properly typed in TypeScript!');
