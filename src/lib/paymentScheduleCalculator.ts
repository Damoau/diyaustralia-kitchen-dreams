/**
 * Payment Schedule Calculator
 * Calculates deposit and balance amounts for payment schedules
 */

export interface PaymentSchedule {
  depositAmount: number;
  depositPercentage: number;
  balanceAmount: number;
  balancePercentage: number;
  totalAmount: number;
  depositDueDate: Date;
  balanceDueDate: Date;
}

export interface PaymentScheduleOptions {
  totalAmount: number;
  depositPercentage?: number; // Default 20%
  depositDueDays?: number; // Days until deposit due (default: 7)
  balanceDueDays?: number; // Days until balance due (default: 30)
}

/**
 * Calculate payment schedule with deposit and balance
 */
export const calculatePaymentSchedule = (options: PaymentScheduleOptions): PaymentSchedule => {
  const {
    totalAmount,
    depositPercentage = 20,
    depositDueDays = 7,
    balanceDueDays = 30,
  } = options;

  // Calculate amounts
  const depositAmount = Math.round(totalAmount * (depositPercentage / 100) * 100) / 100;
  const balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
  const balancePercentage = 100 - depositPercentage;

  // Calculate due dates
  const now = new Date();
  const depositDueDate = new Date(now.getTime() + depositDueDays * 24 * 60 * 60 * 1000);
  const balanceDueDate = new Date(now.getTime() + balanceDueDays * 24 * 60 * 60 * 1000);

  return {
    depositAmount,
    depositPercentage,
    balanceAmount,
    balancePercentage,
    totalAmount,
    depositDueDate,
    balanceDueDate,
  };
};

/**
 * Format payment schedule for display
 */
export const formatPaymentSchedule = (schedule: PaymentSchedule): string => {
  return `
Deposit (${schedule.depositPercentage}%): $${schedule.depositAmount.toFixed(2)} - Due ${schedule.depositDueDate.toLocaleDateString()}
Balance (${schedule.balancePercentage}%): $${schedule.balanceAmount.toFixed(2)} - Due ${schedule.balanceDueDate.toLocaleDateString()}
Total: $${schedule.totalAmount.toFixed(2)}
  `.trim();
};

/**
 * Validate payment amount against schedule
 */
export const validatePaymentAmount = (
  paymentAmount: number,
  schedule: PaymentSchedule,
  paymentType: 'deposit' | 'balance' | 'full'
): { valid: boolean; message?: string } => {
  if (paymentType === 'deposit') {
    if (paymentAmount !== schedule.depositAmount) {
      return {
        valid: false,
        message: `Deposit amount must be exactly $${schedule.depositAmount.toFixed(2)}`,
      };
    }
  } else if (paymentType === 'balance') {
    if (paymentAmount !== schedule.balanceAmount) {
      return {
        valid: false,
        message: `Balance amount must be exactly $${schedule.balanceAmount.toFixed(2)}`,
      };
    }
  } else if (paymentType === 'full') {
    if (paymentAmount !== schedule.totalAmount) {
      return {
        valid: false,
        message: `Full payment amount must be exactly $${schedule.totalAmount.toFixed(2)}`,
      };
    }
  }

  return { valid: true };
};
