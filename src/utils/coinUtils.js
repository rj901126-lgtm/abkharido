/**
 * AbKharido Standardized AB Coins & Reward Utility
 * 
 * Rules:
 * 1. Base Reward Formula: Math.floor(price * 0.005) (0.5% cashback on order completion).
 * 2. Redemption Rule: 1 AB Coin = ₹1 instant discount at checkout.
 * 3. Creator/Partner Rule: 1 Coin = ₹1 withdrawable cash (Min threshold: 1,000 coins).
 */

/**
 * Calculates AB Coins earned on purchasing a product or entire order
 * @param {number} price - Item or order price in INR
 * @param {number} [customRate] - Optional custom rate override (default: 0.005)
 * @returns {number} Amount of AB Coins rewarded
 */
export function calculateCoinReward(price, customRate) {
  if (!price || isNaN(price) || price <= 0) return 0;
  const rate = typeof customRate === 'number' && customRate > 0 ? customRate : 0.005;
  return Math.floor(price * rate);
}

/**
 * Formats coin amount with standard currency-like display
 * @param {number} coins 
 * @returns {string} Formatted coin string e.g. "🪙 650 AB Coins (Worth ₹650)"
 */
export function formatCoinReward(coins) {
  const c = Math.max(0, Math.floor(coins || 0));
  return `🪙 +${c} AB Coins (Worth ₹${c})`;
}

/**
 * Computes maximum redeemable coin discount for a cart
 * @param {number} userCoins - User's current wallet coin balance
 * @param {number} cartTotal - Total cart item value
 * @returns {number} Discount amount in INR (1 Coin = ₹1)
 */
export function calculateCoinDiscount(userCoins, cartTotal) {
  const available = Math.max(0, Math.floor(userCoins || 0));
  const maxSpendable = Math.max(0, Math.floor(cartTotal || 0));
  return Math.min(available, maxSpendable);
}

export const COIN_CONFIG = {
  REWARD_RATE: 0.005, // 0.5%
  COIN_VALUE_INR: 1,  // 1 Coin = ₹1
  MIN_WITHDRAWAL_COINS: 1000,
  REFERRAL_BONUS_COINS: 50,
  WELCOME_BONUS_COINS: 100
};

export default {
  calculateCoinReward,
  formatCoinReward,
  calculateCoinDiscount,
  COIN_CONFIG
};
