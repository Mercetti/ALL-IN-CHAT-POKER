const DEFAULT_AVATAR = '/logo.png';
const DEFAULT_CARD_BACK = '/assets/card-back.png';
const CARD_FACE_BASE_FALLBACK = '/assets/cosmetics/cards/faces/classic';
const ALL_IN_EFFECT_SPRITE = '/assets/cosmetics/effects/all-in/allin_burst_horizontal_sheet.png?v=3';
const FOLD_EFFECT = '/assets/cosmetics/effects/folds/fold-dust.png';
const DEAL_FACE_DOWN = '/assets/cosmetics/effects/deals/face-down-deal.png';
const DEAL_FACE_UP = '/assets/cosmetics/effects/deals/face-up/face-up-deal.png';
const CARD_FLIP_SPRITE = '/assets/cosmetics/effects/deals/face-up/card_flip_sprite.png';
const CARD_FLIP_META = '/assets/cosmetics/effects/deals/face-up/card_flip_animation.json';

const CHIP_DENOMS = [
  { value: 1000, color: '#f5a524', label: '1k' },
  { value: 500, color: '#9b59b6', label: '500' },
  { value: 100, color: '#111', label: '100' },
  { value: 25, color: '#2ecc71', label: '25' },
  { value: 5, color: '#e74c3c', label: '5' },
  { value: 1, color: '#ecf0f1', label: '1' },
];

const CHIP_ASSETS = {
  1: { top: '/assets/cosmetics/effects/chips/chip-1-top.png', side: '/assets/cosmetics/effects/chips/chip-1-side.png' },
  5: { top: '/assets/cosmetics/effects/chips/chip-5-top.png', side: '/assets/cosmetics/effects/chips/chip-5-side.png' },
  25: { top: '/assets/cosmetics/effects/chips/chip-25-top.png', side: '/assets/cosmetics/effects/chips/chip-25-side.png' },
  100: { top: '/assets/cosmetics/effects/chips/chip-100-top.png', side: '/assets/cosmetics/effects/chips/chip-100-side.png' },
  500: { top: '/assets/cosmetics/effects/chips/chip-500-top.png', side: '/assets/cosmetics/effects/chips/chip-500-side.png' },
};

function getSocketUrl() {
  if (typeof getBackendBase === 'function') {
    return getBackendBase() || '';
  }
  return '';
}

function isEventForChannel(targetChannel, payload) {
  if (!payload || !payload.channel || !targetChannel) return true;
  return payload.channel === targetChannel;
}

function normalizeSuitName(raw = '') {
  const s = (raw || '').toString().toLowerCase();
  if (['h', '♥', 'hearts', 'heart'].includes(s)) return 'hearts';
  if (['d', '♦', 'diamonds', 'diamond'].includes(s)) return 'diamonds';
  if (['c', '♣', 'clubs', 'club'].includes(s)) return 'clubs';
  if (['s', '♠', 'spades', 'spade'].includes(s)) return 'spades';
  return null;
}

function normalizeRankName(raw = '') {
  const r = (raw || '').toString().toUpperCase();
  if (['T', '10'].includes(r)) return '10';
  if (['J', 'JACK'].includes(r)) return 'jack';
  if (['Q', 'QUEEN'].includes(r)) return 'queen';
  if (['K', 'KING'].includes(r)) return 'king';
  if (['A', 'ACE'].includes(r)) return 'ace';
  return ['2', '3', '4', '5', '6', '7', '8', '9'].includes(r) ? r : null;
}

export {
  DEFAULT_AVATAR,
  DEFAULT_CARD_BACK,
  CARD_FACE_BASE_FALLBACK,
  ALL_IN_EFFECT_SPRITE,
  FOLD_EFFECT,
  DEAL_FACE_DOWN,
  DEAL_FACE_UP,
  CARD_FLIP_SPRITE,
  CARD_FLIP_META,
  CHIP_DENOMS,
  CHIP_ASSETS,
  getSocketUrl,
  isEventForChannel,
  normalizeSuitName,
  normalizeRankName,
};
