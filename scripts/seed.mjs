import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'public', 'data')
const imageDir = join(root, 'public', 'images', 'products')

rmSync(dataDir, { recursive: true, force: true })
rmSync(imageDir, { recursive: true, force: true })
mkdirSync(dataDir, { recursive: true })
mkdirSync(imageDir, { recursive: true })

const iso = (daysAgo, hour = 10, minute = 30) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const isoFuture = (daysAhead, hour = 12) => iso(-daysAhead, hour)

const pad = (value, size = 4) => String(value).padStart(size, '0')

const admin = {
  id: 'adm-01',
  name: 'Sonali Owner',
  email: 'admin@sonalifoshol.com',
  username: 'admin',
  password: 'sonali123',
  role: 'owner',
  avatar: '/images/avatar-admin.svg',
}

const categories = [
  { id: 'cat-01', slug: 'rice', nameEn: 'Rice', nameBn: 'চাল', order: 1, hidden: false },
  { id: 'cat-02', slug: 'oil', nameEn: 'Oil', nameBn: 'তেল', order: 2, hidden: false },
  { id: 'cat-03', slug: 'honey-ghee', nameEn: 'Honey & Ghee', nameBn: 'মধু ও ঘি', order: 3, hidden: false },
]

const svgEscape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const palettes = {
  rice: ['#E8D5A9', '#C9A75E'],
  oil: ['#F6D98B', '#D4A359'],
  'honey-ghee': ['#F3C77B', '#B9752A'],
}

function writeProductImage(slug, nameBn, category) {
  const [from, to] = palettes[category] ?? palettes.rice
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" fill="url(#g)"/>
  <circle cx="380" cy="90" r="120" fill="#ffffff" opacity="0.16"/>
  <circle cx="80" cy="410" r="150" fill="#1B3B2B" opacity="0.10"/>
  <text x="240" y="244" text-anchor="middle" font-family="'Hind Siliguri','Noto Sans Bengali',sans-serif" font-size="40" font-weight="600" fill="#1B3B2B">${svgEscape(nameBn)}</text>
  <text x="240" y="298" text-anchor="middle" font-family="'Plus Jakarta Sans',sans-serif" font-size="18" letter-spacing="4" fill="#1B3B2B" opacity="0.7">SONALI FOSHol</text>
</svg>`
  writeFileSync(join(imageDir, `${slug}.svg`), svg, 'utf8')
}

const baseProducts = [
  {
    slug: 'miniket-rice',
    nameBn: 'মিনিকেট চাল',
    nameEn: 'Miniket Rice',
    category: 'rice',
    originBn: 'নাটোর',
    badgeBn: 'সেরা বিক্রিত',
    shortDescBn: 'প্রতিদিনের রান্নার জন্য ঝরঝরে ও সুগন্ধি মিনিকেট চাল।',
    fullDescBn: 'নাটোরের উর্বর মাটিতে চাষ করা মিনিকেট চাল। কেমিক্যালমুক্ত প্রক্রিয়ায় ছাঁটা, রান্নার পর ঝরঝরে ও সুস্বাদু।',
    nutritionHighlights: ['কার্বোহাইড্রেট সমৃদ্ধ', 'কম চর্বি', 'গ্লুটেন-মুক্ত'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 89, mrp: 95, stock: 120 },
      { label: '৫ কেজি', grams: 5000, price: 430, mrp: 460, stock: 40 },
      { label: '১০ কেজি', grams: 10000, price: 850, mrp: 900, stock: 18 },
    ],
  },
  {
    slug: 'basmati-rice',
    nameBn: 'বাসমতী চাল',
    nameEn: 'Basmati Rice',
    category: 'rice',
    originBn: 'দিনাজপুর',
    shortDescBn: 'পোলাও ও বিরিয়ানির জন্য দীর্ঘ দানার সুগন্ধি বাসমতী চাল।',
    fullDescBn: 'দিনাজপুরের বাসমতী চাল, লম্বা দানা ও প্রাকৃতিক সুগন্ধ। অনুষ্ঠান ও উৎসবের রান্নায় পারফেক্ট।',
    nutritionHighlights: ['দীর্ঘ দানা', 'সুগন্ধি', 'কম স্টার্চ'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 145, mrp: 160, stock: 60 },
      { label: '৫ কেজি', grams: 5000, price: 710, mrp: 760, stock: 22 },
    ],
  },
  {
    slug: 'polao-rice',
    nameBn: 'পোলাও চাল',
    nameEn: 'Polao Rice',
    category: 'rice',
    originBn: 'নওগাঁ',
    shortDescBn: 'নরম ও সুগন্ধি পোলাও চাল, উৎসবের রান্নার সঙ্গী।',
    fullDescBn: 'নওগাঁ অঞ্চলের পোলাও চাল। হালকা সুগন্ধ ও নরম টেক্সচার, পোলাও ও খিচুড়ির জন্য আদর্শ।',
    nutritionHighlights: ['নরম টেক্সচার', 'প্রাকৃতিক সুগন্ধ'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 120, mrp: 135, stock: 48 },
      { label: '৫ কেজি', grams: 5000, price: 590, mrp: 650, stock: 15 },
    ],
  },
  {
    slug: 'kataribhog-rice',
    nameBn: 'কাটারিভোগ চাল',
    nameEn: 'Kataribhog Rice',
    category: 'rice',
    originBn: 'দিনাজপুর',
    badgeBn: 'ঐতিহ্যবাহী',
    shortDescBn: 'ঐতিহ্যবাহী সুগন্ধি কাটারিভোগ চাল, পায়েসের জন্য সেরা।',
    fullDescBn: 'দিনাজপুরের ঐতিহ্যবাহী কাটারিভোগ চাল। ছোট দানা ও গভীর সুগন্ধ, পায়েস ও বিশেষ রান্নায় অনবদ্য।',
    nutritionHighlights: ['গভীর সুগন্ধ', 'ঐতিহ্যবাহী জাত'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 135, mrp: 150, stock: 34 },
      { label: '৫ কেজি', grams: 5000, price: 660, mrp: 720, stock: 9 },
    ],
  },
  {
    slug: 'brown-rice',
    nameBn: 'ব্রাউন রাইস',
    nameEn: 'Brown Rice',
    category: 'rice',
    originBn: 'নাটোর',
    shortDescBn: 'ফাইবার সমৃদ্ধ খোসাসহ ব্রাউন রাইস, স্বাস্থ্যকর বিকল্প।',
    fullDescBn: 'নাটোরের ব্রাউন রাইস, ভুসি保留 করে প্রক্রিয়াজাত। উচ্চ ফাইবার ও ধীরে হজমযোগ্য কার্বোহাইড্রেট।',
    nutritionHighlights: ['উচ্চ ফাইবার', 'হোল গ্রেইন', 'লো গ্লাইসেমিক'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 110, mrp: 125, stock: 26 },
      { label: '৫ কেজি', grams: 5000, price: 540, mrp: 600, stock: 8 },
    ],
  },
  {
    slug: 'chinigura-rice',
    nameBn: 'চিনিগুড়া চাল',
    nameEn: 'Chinigura Rice',
    category: 'rice',
    originBn: 'নওগাঁ',
    shortDescBn: 'পায়েস ও ফিরনি বানানোর জন্য ছোট দানার চিনিগুড়া চাল।',
    fullDescBn: 'নওগাঁর চিনিগুড়া চাল, ছোট সুগন্ধি দানা। পায়েস, ফিরনি ও মিষ্টান্নে দুর্দান্ত।',
    nutritionHighlights: ['ছোট দানা', 'সুগন্ধি'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 130, mrp: 145, stock: 30 },
      { label: '৫ কেজি', grams: 5000, price: 640, mrp: 700, stock: 0 },
    ],
  },
  {
    slug: 'kalijira-rice',
    nameBn: 'কালিজিরা চাল',
    nameEn: 'Kalijira Rice',
    category: 'rice',
    originBn: 'নওগাঁ',
    shortDescBn: 'সূক্ষ্ম সুগন্ধি কালিজিরা চাল, বিশেষ অনুষ্ঠানের জন্য।',
    fullDescBn: 'নওগাঁর কালিজিরা চাল, অত্যন্ত সূক্ষ্ম দানা ও মিষ্টি সুগন্ধ। বিরিয়ানি ও পোলাওয়ে অভিজাত স্বাদ।',
    nutritionHighlights: ['সূক্ষ্ম দানা', 'মিষ্টি সুগন্ধ'],
    weights: [
      { label: '১ কেজি', grams: 1000, price: 150, mrp: 165, stock: 12 },
      { label: '৫ কেজি', grams: 5000, price: 740, mrp: 800, stock: 0 },
    ],
  },
  {
    slug: 'mustard-oil',
    nameBn: 'সরিষার তেল',
    nameEn: 'Mustard Oil',
    category: 'oil',
    originBn: 'মানিকগঞ্জ',
    badgeBn: 'সেরা বিক্রিত',
    shortDescBn: 'ঘানি ভাঙা খাঁটি সরিষার তেল, ঝাঁঝালো স্বাদ।',
    fullDescBn: 'মানিকগঞ্জের সরিষা থেকে ঘানিতে ভাঙা খাঁটি তেল। প্রাকৃতিক ঝাঁঝ ও রান্নায় গভীর স্বাদ।',
    nutritionHighlights: ['ওমেগা-৩', 'ঘানি ভাঙা', 'কোনো প্রিজারভেটিভ নেই'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 180, mrp: 200, stock: 55 },
      { label: '১ লিটার', grams: 1000, price: 350, mrp: 380, stock: 32 },
      { label: '২ লিটার', grams: 2000, price: 680, mrp: 740, stock: 14 },
    ],
  },
  {
    slug: 'coconut-oil',
    nameBn: 'নারিকেল তেল',
    nameEn: 'Coconut Oil',
    category: 'oil',
    originBn: 'খুলনা',
    shortDescBn: 'কোল্ড প্রেসড খাঁটি নারিকেল তেল, রান্না ও ত্বকের জন্য।',
    fullDescBn: 'খুলনার নারিকেল থেকে কোল্ড প্রেস পদ্ধতিতে তৈরি খাঁটি তেল। হালকা মিষ্টি ঘ্রাণ, রান্না ও স্কিনকেয়ারে ব্যবহারযোগ্য।',
    nutritionHighlights: ['কোল্ড প্রেসড', 'এমসিটি সমৃদ্ধ', 'প্রাকৃতিক ঘ্রাণ'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 220, mrp: 240, stock: 40 },
      { label: '১ লিটার', grams: 1000, price: 420, mrp: 460, stock: 21 },
    ],
  },
  {
    slug: 'olive-oil',
    nameBn: 'অলিভ অয়েল',
    nameEn: 'Olive Oil',
    category: 'oil',
    originBn: 'স্পেন',
    badgeBn: 'প্রিমিয়াম',
    shortDescBn: 'এক্সট্রা ভার্জিন অলিভ অয়েল, সালাদ ও হেলদি রান্নার জন্য।',
    fullDescBn: 'স্পেন থেকে আমদানি করা এক্সট্রা ভার্জিন অলিভ অয়েল। ঠান্ডা চাপে নিষ্কাশিত, সালাদ ড্রেসিং ও হালকা রান্নার জন্য উপযুক্ত।',
    nutritionHighlights: ['এক্সট্রা ভার্জিন', 'ওমেগা-৯', 'অ্যান্টিঅক্সিডেন্ট'],
    weights: [
      { label: '৫০০ মিলি', grams: 500, price: 650, mrp: 700, stock: 18 },
      { label: '১ লিটার', grams: 1000, price: 1250, mrp: 1350, stock: 6 },
    ],
  },
  {
    slug: 'soybean-oil',
    nameBn: 'সয়াবিন তেল',
    nameEn: 'Soybean Oil',
    category: 'oil',
    originBn: 'ঢাকা',
    shortDescBn: 'প্রতিদিনের রান্নার জন্য পরিশোধিত সয়াবিন তেল।',
    fullDescBn: 'পরিশোধিত সয়াবিন তেল, হালকা স্বাদ ও উচ্চ স্মোক পয়েন্ট। প্রতিদিনের ভাজা ও রান্নার জন্য নির্ভরযোগ্য।',
    nutritionHighlights: ['ভিটামিন ই', 'হালকা স্বাদ'],
    weights: [
      { label: '১ লিটার', grams: 1000, price: 165, mrp: 175, stock: 90 },
      { label: '৫ লিটার', grams: 5000, price: 810, mrp: 850, stock: 35 },
    ],
  },
  {
    slug: 'sesame-oil',
    nameBn: 'তিলের তেল',
    nameEn: 'Sesame Oil',
    category: 'oil',
    originBn: 'যশোর',
    shortDescBn: 'খাঁটি তিলের তেল, রান্না ও ঐতিহ্যবাহী ব্যবহারে।',
    fullDescBn: 'যশোরের তিল থেকে তৈরি খাঁটি তেল। গভীর বাদামি স্বাদ, রান্না ও শরীরে মালিশে ব্যবহারযোগ্য।',
    nutritionHighlights: ['ক্যালসিয়াম', 'ওমেগা-৬'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 240, mrp: 260, stock: 0 },
      { label: '১ লিটার', grams: 1000, price: 470, mrp: 510, stock: 11 },
    ],
  },
  {
    slug: 'ghani-mustard-oil',
    nameBn: 'ঘানি ভাঙা সরিষার তেল',
    nameEn: 'Ghani Mustard Oil',
    category: 'oil',
    originBn: 'পাবনা',
    shortDescBn: 'ঐতিহ্যবাহী ঘানিতে ভাঙা সরিষার তেল, তীব্র ঝাঁঝ।',
    fullDescBn: 'পাবনার সরিষা ঐতিহ্যবাহী কাঠের ঘানিতে ভাঙা। প্রাকৃতিক ঝাঁঝ ও পুষ্টিগুণ অটুট থাকে।',
    nutritionHighlights: ['কাঠের ঘানি', 'ওমেগা-৩', 'ঝাঁঝালো স্বাদ'],
    weights: [
      { label: '১ লিটার', grams: 1000, price: 380, mrp: 420, stock: 25 },
      { label: '২ লিটার', grams: 2000, price: 740, mrp: 800, stock: 9 },
    ],
  },
  {
    slug: 'sundarban-honey',
    nameBn: 'সুন্দরবনের মধু',
    nameEn: 'Sundarban Honey',
    category: 'honey-ghee',
    originBn: 'খুলনা',
    badgeBn: 'খাঁটি',
    shortDescBn: 'সুন্দরবনের প্রাকৃতিক মধু, কোনো চিনি বা প্রিজারভেটিভ নেই।',
    fullDescBn: 'সুন্দরবনের খলিশা ও গরান ফুল থেকে সংগ্রহ করা প্রাকৃতিক মধু। কাঁচা ও অপরিশোধিত, প্রাকৃতিক ক্রিস্টালাইজেশন স্বাভাবিক।',
    nutritionHighlights: ['কাঁচা মধু', 'অ্যান্টিঅক্সিডেন্ট', 'কোনো চিনি নেই'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 420, mrp: 450, stock: 28 },
      { label: '১ কেজি', grams: 1000, price: 800, mrp: 850, stock: 10 },
    ],
  },
  {
    slug: 'black-seed-honey',
    nameBn: 'কালোজিরার মধু',
    nameEn: 'Black Seed Honey',
    category: 'honey-ghee',
    originBn: 'সাতক্ষীরা',
    shortDescBn: 'কালোজিরা ফুলের বিরল মধু, গাঢ় রঙ ও শক্তিশালী স্বাদ।',
    fullDescBn: 'সাতক্ষীরার কালোজিরা ফুল থেকে সংগ্রহ করা বিরল মধু। গাঢ় রঙ, মাটির মতো ঘ্রাণ ও শক্তিশালী স্বাদ।',
    nutritionHighlights: ['বিরল সংগ্রহ', 'গাঢ় রঙ', 'প্রাকৃতিক'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 480, mrp: 520, stock: 15 },
      { label: '১ কেজি', grams: 1000, price: 920, mrp: 980, stock: 5 },
    ],
  },
  {
    slug: 'lychee-honey',
    nameBn: 'লিচু ফুলের মধু',
    nameEn: 'Lychee Flower Honey',
    category: 'honey-ghee',
    originBn: 'দিনাজপুর',
    shortDescBn: 'লিচু ফুলের হালকা মিষ্টি মধু, সকালের নাস্তার জন্য।',
    fullDescBn: 'দিনাজপুরের লিচু বাগানের ফুল থেকে সংগ্রহ করা হালকা রঙের মধু। মিষ্টি সুবাস ও নরম স্বাদ।',
    nutritionHighlights: ['হালকা স্বাদ', 'প্রাকৃতিক এনজাইম'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 380, mrp: 420, stock: 32 },
      { label: '১ কেজি', grams: 1000, price: 720, mrp: 780, stock: 16 },
    ],
  },
  {
    slug: 'pure-ghee',
    nameBn: 'খাঁটি গাওয়া ঘি',
    nameEn: 'Pure Gawa Ghee',
    category: 'honey-ghee',
    originBn: 'বগুড়া',
    badgeBn: 'সেরা বিক্রিত',
    shortDescBn: 'দেশি গরুর দুধের খাঁটি গাওয়া ঘি, দানাদার ও সুগন্ধি।',
    fullDescBn: 'বগুড়ার দেশি গরুর দুধ থেকে ঐতিহ্যবাহী পদ্ধতিতে তৈরি গাওয়া ঘি। দানাদার টেক্সচার ও গভীর সুগন্ধ।',
    nutritionHighlights: ['দেশি গরুর দুধ', 'দানাদার', 'কোনো ভেজাল নেই'],
    weights: [
      { label: '২৫০ গ্রাম', grams: 250, price: 380, mrp: 420, stock: 30 },
      { label: '৫০০ গ্রাম', grams: 500, price: 740, mrp: 800, stock: 18 },
      { label: '১ কেজি', grams: 1000, price: 1450, mrp: 1550, stock: 7 },
    ],
  },
  {
    slug: 'buffalo-ghee',
    nameBn: 'বাফেলো ঘি',
    nameEn: 'Buffalo Ghee',
    category: 'honey-ghee',
    originBn: 'বগুড়া',
    shortDescBn: 'মহিষের দুধের ঘন ও সুগন্ধি ঘি, বিশেষ রান্নার জন্য।',
    fullDescBn: 'মহিষের দুধ থেকে তৈরি ঘন ঘি। উৎসবের রান্না ও মিষ্টান্নে অভিজাত স্বাদ যোগ করে।',
    nutritionHighlights: ['ঘন টেক্সচার', 'উৎসবের রান্না'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 820, mrp: 880, stock: 12 },
      { label: '১ কেজি', grams: 1000, price: 1600, mrp: 1700, stock: 4 },
    ],
  },
  {
    slug: 'cow-ghee',
    nameBn: 'গরুর ঘি',
    nameEn: 'Cow Ghee',
    category: 'honey-ghee',
    originBn: 'পাবনা',
    shortDescBn: 'পাবনার গরুর দুধের ঘি, প্রতিদিনের রান্নায় স্বাদ বাড়ায়।',
    fullDescBn: 'পাবনার গরুর দুধ থেকে তৈরি ঘি। হালকা সুগন্ধ, ভাত ও রুটির সঙ্গে দুর্দান্ত।',
    nutritionHighlights: ['প্রতিদিনের ব্যবহার', 'ভিটামিন এ, ডি'],
    weights: [
      { label: '২৫০ গ্রাম', grams: 250, price: 420, mrp: 460, stock: 20 },
      { label: '৫০০ গ্রাম', grams: 500, price: 820, mrp: 880, stock: 8 },
    ],
  },
  {
    slug: 'mixed-flower-honey',
    nameBn: 'মিশ্র ফুলের মধু',
    nameEn: 'Mixed Flower Honey',
    category: 'honey-ghee',
    originBn: 'মুন্সিগঞ্জ',
    shortDescBn: 'মিশ্র ফুলের প্রাকৃতিক মধু, প্রতিদিনের ব্যবহারের জন্য।',
    fullDescBn: 'মুন্সিগঞ্জের বাগান ও ফসলের ফুল থেকে সংগ্রহ করা মিশ্র মধু। মৃদু মিষ্টি স্বাদ, প্রতিদিনের খাবারে উপযুক্ত।',
    nutritionHighlights: ['প্রাকৃতিক', 'মৃদু স্বাদ'],
    weights: [
      { label: '৫০০ গ্রাম', grams: 500, price: 350, mrp: 390, stock: 0 },
      { label: '১ কেজি', grams: 1000, price: 680, mrp: 740, stock: 0 },
    ],
  },
]

const draftSlugs = new Set(['sesame-oil', 'mixed-flower-honey', 'cow-ghee'])
const createdDays = [96, 92, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20]

const products = baseProducts.map((base, index) => {
  const totalStock = base.weights.reduce((sum, weight) => sum + weight.stock, 0)
  const slugUpper = base.slug.replace(/-/g, '').toUpperCase()
  writeProductImage(base.slug, base.nameBn, base.category)
  return {
    id: `prd-${pad(index + 1, 3)}`,
    slug: base.slug,
    nameBn: base.nameBn,
    nameEn: base.nameEn,
    category: base.category,
    originBn: base.originBn,
    image: `/images/products/${base.slug}.svg`,
    images: [`/images/products/${base.slug}.svg`],
    badgeBn: base.badgeBn,
    inStock: totalStock > 0,
    status: draftSlugs.has(base.slug) ? 'draft' : 'active',
    shortDescBn: base.shortDescBn,
    fullDescBn: base.fullDescBn,
    nutritionHighlights: base.nutritionHighlights,
    weights: base.weights.map((weight) => ({
      ...weight,
      sku: `${slugUpper}-${weight.grams}`,
    })),
    createdAt: iso(createdDays[index % createdDays.length], 9, 15),
    updatedAt: iso(Math.max(0, createdDays[index % createdDays.length] - 14), 16, 40),
  }
})

const customers = [
  { id: 'cus-01', name: 'রফিকুল ইসলাম', phone: '01711234567', district: 'ঢাকা', address: 'বাসা ১২, রোড ৫, ধানমন্ডি, ঢাকা', flagged: false },
  { id: 'cus-02', name: 'সুমাইয়া আক্তার', phone: '01822334455', district: 'চট্টগ্রাম', address: '৪৫/বি, আগ্রাবাদ, চট্টগ্রাম', flagged: false },
  { id: 'cus-03', name: 'মাহবুব হাসান', phone: '01933445566', district: 'খুলনা', address: 'বাসা ৭, সড়ক ২, সোনাডাঙ্গা, খুলনা', flagged: false },
  { id: 'cus-04', name: 'নাসরিন সুলতানা', phone: '01644556677', district: 'রাজশাহী', address: '৩৩, শাহ মখদুম, রাজশাহী', flagged: false },
  { id: 'cus-05', name: 'আব্দুল করিম', phone: '01555667788', district: 'সিলেট', address: '১২, জিন্দাবাজার, সিলেট', flagged: true },
  { id: 'cus-06', name: 'ফারহানা ইয়াসমিন', phone: '01766778899', district: 'বরিশাল', address: 'বাসা ৯, বান্দ রোড, বরিশাল', flagged: false },
  { id: 'cus-07', name: 'শাহীন আলম', phone: '01877889900', district: 'রংপুর', address: '২১, ধাপ, রংপুর', flagged: false },
  { id: 'cus-08', name: 'তাসনিম জাহান', phone: '01988990011', district: 'ময়মনসিংহ', address: '৫, চরপাড়া, ময়মনসিংহ', flagged: false },
  { id: 'cus-09', name: 'জাহিদুল ইসলাম', phone: '01699001122', district: 'কুমিল্লা', address: '৭৮, কান্দিরপাড়, কুমিল্লা', flagged: true },
  { id: 'cus-10', name: 'রুবিনা পারভীন', phone: '01500112233', district: 'নারায়ণগঞ্জ', address: 'বাসা ১৪, চাষাঢ়া, নারায়ণগঞ্জ', flagged: false },
]

const productBySlug = Object.fromEntries(products.map((product) => [product.slug, product]))

function findVariant(product, label) {
  const variant = product.weights.find((weight) => weight.label === label)
  if (!variant) throw new Error(`Variant ${label} not found for ${product.slug}`)
  return variant
}

const orderSpecs = [
  { customer: 0, status: 'pending', daysAgo: 0, zone: 'inside_dhaka', payment: 'cod', items: [['miniket-rice', '১০ কেজি', 1], ['mustard-oil', '১ লিটার', 2]] },
  { customer: 1, status: 'pending', daysAgo: 0, zone: 'outside_dhaka', payment: 'whatsapp', items: [['sundarban-honey', '৫০০ গ্রাম', 2], ['pure-ghee', '৫০০ গ্রাম', 1]] },
  { customer: 2, status: 'pending', daysAgo: 1, zone: 'outside_dhaka', payment: 'messenger', items: [['basmati-rice', '৫ কেজি', 1]] },
  { customer: 3, status: 'pending', daysAgo: 1, zone: 'inside_dhaka', payment: 'cod', items: [['ghani-mustard-oil', '২ লিটার', 1], ['polao-rice', '৫ কেজি', 1]] },
  { customer: 4, status: 'pending', daysAgo: 2, zone: 'outside_dhaka', payment: 'cod', items: [['cow-ghee', '২৫০ গ্রাম', 2]] },
  { customer: 5, status: 'confirmed', daysAgo: 2, zone: 'inside_dhaka', payment: 'cod', items: [['miniket-rice', '৫ কেজি', 1], ['soybean-oil', '৫ লিটার', 1]] },
  { customer: 6, status: 'confirmed', daysAgo: 3, zone: 'outside_dhaka', payment: 'whatsapp', items: [['black-seed-honey', '৫০০ গ্রাম', 1], ['lychee-honey', '১ কেজি', 1]] },
  { customer: 7, status: 'confirmed', daysAgo: 3, zone: 'inside_dhaka', payment: 'cod', items: [['kataribhog-rice', '৫ কেজি', 1], ['coconut-oil', '১ লিটার', 2]] },
  { customer: 8, status: 'processing', daysAgo: 4, zone: 'outside_dhaka', payment: 'cod', items: [['brown-rice', '৫ কেজি', 1], ['mustard-oil', '৫০০ গ্রাম', 2]] },
  { customer: 9, status: 'processing', daysAgo: 5, zone: 'inside_dhaka', payment: 'messenger', items: [['pure-ghee', '১ কেজি', 1]] },
  { customer: 0, status: 'shipped', daysAgo: 6, zone: 'inside_dhaka', payment: 'cod', items: [['chinigura-rice', '১ কেজি', 3], ['sundarban-honey', '১ কেজি', 1]] },
  { customer: 2, status: 'shipped', daysAgo: 7, zone: 'outside_dhaka', payment: 'whatsapp', items: [['olive-oil', '১ লিটার', 1], ['basmati-rice', '১ কেজি', 2]] },
  { customer: 1, status: 'delivered', daysAgo: 10, zone: 'outside_dhaka', payment: 'cod', items: [['miniket-rice', '১০ কেজি', 1], ['pure-ghee', '২৫০ গ্রাম', 1]] },
  { customer: 3, status: 'delivered', daysAgo: 14, zone: 'inside_dhaka', payment: 'cod', items: [['mustard-oil', '২ লিটার', 1], ['polao-rice', '৫ কেজি', 2]] },
  { customer: 5, status: 'delivered', daysAgo: 18, zone: 'inside_dhaka', payment: 'messenger', items: [['lychee-honey', '৫০০ গ্রাম', 2], ['ghani-mustard-oil', '১ লিটার', 1]] },
  { customer: 7, status: 'delivered', daysAgo: 24, zone: 'outside_dhaka', payment: 'cod', items: [['buffalo-ghee', '৫০০ গ্রাম', 1], ['kalijira-rice', '১ কেজি', 2]] },
  { customer: 9, status: 'delivered', daysAgo: 30, zone: 'inside_dhaka', payment: 'whatsapp', items: [['soybean-oil', '১ লিটার', 4], ['coconut-oil', '৫০০ গ্রাম', 1]] },
  { customer: 4, status: 'rejected', daysAgo: 8, zone: 'outside_dhaka', payment: 'cod', items: [['cow-ghee', '৫০০ গ্রাম', 1]], rejection: { reason: 'fake_order', feedback: 'একই নম্বর থেকে বারবার অর্ডার বাতিল করা হচ্ছে।', by: 'Sonali Owner' } },
  { customer: 8, status: 'rejected', daysAgo: 16, zone: 'outside_dhaka', payment: 'cod', items: [['black-seed-honey', '১ কেজি', 1]], rejection: { reason: 'outside_area', feedback: 'গ্রাহকের এলাকায় আমাদের কুরিয়ার পৌঁছায় না।', by: 'Sonali Owner' } },
  { customer: 6, status: 'cancelled', daysAgo: 21, zone: 'inside_dhaka', payment: 'cod', items: [['pure-ghee', '৫০০ গ্রাম', 1]], cancelNote: 'গ্রাহক নিজেই অর্ডার বাতিল করেছেন।' },
]

const deliveryFees = { inside_dhaka: 60, outside_dhaka: 120 }
const admins = ['Sonali Owner', 'System']

function historyFor(spec, createdAt) {
  const created = new Date(createdAt)
  const steps = []
  const at = (minutes) => new Date(created.getTime() + minutes * 60 * 1000).toISOString()
  steps.push({ status: 'pending', at: at(0), by: 'System', note: 'Order placed by customer' })
  if (spec.status === 'rejected') {
    steps.push({ status: 'rejected', at: at(35), by: 'Sonali Owner', note: spec.rejection.reason })
    return steps
  }
  if (spec.status === 'cancelled') {
    steps.push({ status: 'cancelled', at: at(50), by: 'System', note: spec.cancelNote })
    return steps
  }
  const flow = ['confirmed', 'processing', 'shipped', 'delivered']
  const targetStep = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 }[spec.status]
  for (let step = 1; step <= targetStep; step += 1) {
    steps.push({
      status: flow[step - 1],
      at: at(step * 180),
      by: admins[0],
      note: step === 3 ? 'Handed over to courier' : undefined,
    })
  }
  return steps
}

const orders = orderSpecs.map((spec, index) => {
  const customer = customers[spec.customer]
  const items = spec.items.map(([slug, label, qty]) => {
    const product = productBySlug[slug]
    const variant = findVariant(product, label)
    return {
      productId: product.id,
      slug: product.slug,
      title: product.nameBn,
      image: product.image,
      weightLabel: label,
      unitPrice: variant.price,
      qty,
    }
  })
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const discount = subtotal >= 1500 ? Math.round(subtotal * 0.05) : 0
  const deliveryFee = deliveryFees[spec.zone]
  const total = subtotal + deliveryFee - discount
  const createdAt = iso(spec.daysAgo, 10 + (index % 8), (index * 7) % 60)
  const activeStatuses = ['pending', 'confirmed', 'processing', 'shipped']
  return {
    id: `ord-${pad(101 + index, 4)}`,
    orderNumber: `SFO-2026-${8492 - index}`,
    createdAt,
    expectedDeliveryDate: activeStatuses.includes(spec.status) ? isoFuture(2 + (index % 3)) : undefined,
    status: spec.status,
    customer: {
      name: customer.name,
      phone: customer.phone,
      district: customer.district,
      address: customer.address,
      note: index % 4 === 0 ? 'দুপুরের পরে কল করবেন, সকালে ব্যস্ত থাকি।' : undefined,
    },
    deliveryZone: spec.zone,
    paymentMethod: spec.payment,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    rejection: spec.rejection ? { ...spec.rejection, at: historyFor(spec, createdAt).at(-1).at } : undefined,
    courier: ['shipped', 'delivered'].includes(spec.status)
      ? { name: index % 2 === 0 ? 'Pathao' : 'Steadfast', trackingId: `TRK${900000 + index * 137}` }
      : undefined,
    statusHistory: historyFor(spec, createdAt),
  }
})

const customerSummaries = customers.map((customer) => {
  const customerOrders = orders.filter((order) => order.customer.phone === customer.phone)
  const totalSpent = customerOrders
    .filter((order) => order.status !== 'rejected' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0)
  const lastOrder = customerOrders
    .map((order) => order.createdAt)
    .sort()
    .at(-1)
  return {
    ...customer,
    orderCount: customerOrders.length,
    totalSpent,
    createdAt: iso(120 + Number(customer.id.slice(-2)) * 3, 11, 0),
    lastOrderAt: lastOrder,
  }
})

const reviewTexts = [
  { product: 'miniket-rice', author: 'রফিকুল ইসলাম', rating: 5, text: 'চাল খুব ভালো, ঝরঝরে হয়েছে। আবার অর্ডার করব।', status: 'approved', daysAgo: 6 },
  { product: 'mustard-oil', author: 'সুমাইয়া আক্তার', rating: 5, text: 'সরিষার তেলের ঝাঁঝ একদম খাঁটি। পরিবারের সবাই পছন্দ করেছে।', status: 'approved', daysAgo: 9 },
  { product: 'pure-ghee', author: 'মাহবুব হাসান', rating: 4, text: 'ঘিয়ের সুগন্ধ চমৎকার, তবে দাম একটু বেশি।', status: 'approved', daysAgo: 13 },
  { product: 'sundarban-honey', author: 'নাসরিন সুলতানা', rating: 5, text: 'মধু একদম প্রাকৃতিক, চিনির মিষ্টি নেই।', status: 'approved', daysAgo: 20 },
  { product: 'basmati-rice', author: 'ফারহানা ইয়াসমিন', rating: 4, text: 'বাসমতী চালের সুগন্ধ ভালো লেগেছে।', status: 'pending', daysAgo: 1 },
  { product: 'ghani-mustard-oil', author: 'শাহীন আলম', rating: 5, text: 'ঘানি ভাঙা তেল পাওয়া কঠিন, এখানে পেয়ে ভালো লাগলো।', status: 'pending', daysAgo: 2 },
  { product: 'lychee-honey', author: 'তাসনিম জাহান', rating: 4, text: 'লিচু ফুলের মধু হালকা ও মিষ্টি।', status: 'pending', daysAgo: 3 },
  { product: 'buffalo-ghee', author: 'জাহিদুল ইসলাম', rating: 5, text: 'বাফেলো ঘি ঘন ও সুস্বাদু।', status: 'pending', daysAgo: 4 },
  { product: 'olive-oil', author: 'রুবিনা পারভীন', rating: 3, text: 'অলিভ অয়েল ঠিক আছে, প্যাকেজিং আরও ভালো হতে পারত।', status: 'hidden', daysAgo: 11 },
  { product: 'soybean-oil', author: 'অজ্ঞাত গ্রাহক', rating: 1, text: 'অপ্রাসঙ্গিক মন্তব্য।', status: 'hidden', daysAgo: 15 },
]

const reviews = reviewTexts.map((entry, index) => {
  const product = productBySlug[entry.product]
  return {
    id: `rev-${pad(index + 1, 3)}`,
    productId: product.id,
    productNameBn: product.nameBn,
    author: entry.author,
    rating: entry.rating,
    text: entry.text,
    status: entry.status,
    createdAt: iso(entry.daysAgo, 13, (index * 11) % 60),
  }
})

const calendarEvents = [
  { id: 'evt-01', title: 'সরিষার তেল স্টক রিফিল', type: 'admin', start: iso(-2, 9).slice(0, 10), allDay: true, note: 'পাবনা থেকে নতুন ব্যাচ আসছে।' },
  { id: 'evt-02', title: 'সুন্দরবন মধু সংগ্রহ মৌসুম শুরু', type: 'admin', start: iso(-5, 9).slice(0, 10), allDay: true, note: 'মৌয়ালদের সাথে যোগাযোগ করুন।' },
  { id: 'evt-03', title: 'ঈদ অফার শুরু', type: 'admin', start: iso(-9, 9).slice(0, 10), end: iso(-6, 9).slice(0, 10), allDay: true, note: 'ঘি ও মধুতে ১০% ছাড়।' },
  { id: 'evt-04', title: 'কুরিয়ার পিকআপ', type: 'admin', start: iso(0, 15).slice(0, 10), allDay: false, note: 'বিকেল ৩টায় Steadfast পিকআপ।' },
  { id: 'evt-05', title: 'স্টাফ মিটিং', type: 'admin', start: iso(3, 11).slice(0, 10), allDay: false, note: 'মাসিক বিক্রয় পর্যালোচনা।' },
  { id: 'evt-06', title: 'নতুন ব্যাচ গাওয়া ঘি', type: 'admin', start: iso(7, 10).slice(0, 10), allDay: true, note: 'বগুড়া থেকে ৫০ কেজি ঘি আসবে।' },
].map((event) => ({ ...event, start: `${event.start}T09:00:00.000Z` }))

const settings = {
  storeName: 'Sonali Foshol Organics',
  storeNameBn: 'সোনালী ফসল অর্গানিকস',
  whatsappNumber: '01712345678',
  facebookUrl: 'https://facebook.com/sonalifoshol',
  messengerUrl: 'https://m.me/sonalifoshol',
  deliveryFeeInside: 60,
  deliveryFeeOutside: 120,
  freeShippingThreshold: 2000,
  lowStockThreshold: 10,
}

const sales = []
for (let index = 89; index >= 0; index -= 1) {
  const date = new Date()
  date.setDate(date.getDate() - index)
  const weekday = date.getDay()
  const weekendBoost = weekday === 5 || weekday === 6 ? 1.35 : 1
  const wave = 1 + Math.sin(index / 5) * 0.18 + Math.cos(index / 11) * 0.12
  const ordersCount = Math.round((4 + (index % 6) + (index % 3)) * weekendBoost * wave)
  const revenue = Math.round(ordersCount * (720 + (index % 9) * 45) * weekendBoost)
  sales.push({ date: date.toISOString().slice(0, 10), revenue, orders: ordersCount })
}

const dashboard = { sales }

writeFileSync(join(dataDir, 'admin.json'), JSON.stringify(admin, null, 2))
writeFileSync(join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2))
writeFileSync(join(dataDir, 'products.json'), JSON.stringify(products, null, 2))
writeFileSync(join(dataDir, 'orders.json'), JSON.stringify(orders, null, 2))
writeFileSync(join(dataDir, 'customers.json'), JSON.stringify(customerSummaries, null, 2))
writeFileSync(join(dataDir, 'reviews.json'), JSON.stringify(reviews, null, 2))
writeFileSync(join(dataDir, 'calendar-events.json'), JSON.stringify(calendarEvents, null, 2))
writeFileSync(join(dataDir, 'settings.json'), JSON.stringify(settings, null, 2))
writeFileSync(join(dataDir, 'dashboard.json'), JSON.stringify(dashboard, null, 2))

writeFileSync(
  join(root, 'public', 'images', 'avatar-admin.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#1B3B2B"/><text x="48" y="58" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#D4A359">SO</text></svg>`,
)

console.log(`Seed complete: ${products.length} products, ${orders.length} orders, ${customerSummaries.length} customers, ${reviews.length} reviews, ${calendarEvents.length} events.`)
