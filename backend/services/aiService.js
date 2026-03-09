require('dotenv').config();

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];

// ── Smart Categorization (fallback) ──────────────────────────────────────────
const categoryKeywords = {
  Food: ['coffee', 'starbucks', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'restaurant', 'food', 'pizza', 'burger', 'sushi', 'chipotle', 'mcdonalds', 'uber eats', 'doordash', 'grubhub', 'cafe', 'bakery', 'snack', 'meal', 'eat', 'walmart', 'whole foods', 'trader joe'],
  Transport: ['uber', 'lyft', 'taxi', 'cab', 'gas', 'fuel', 'petrol', 'metro', 'subway', 'bus', 'train', 'parking', 'toll', 'car wash', 'airline', 'flight', 'shell', 'chevron', 'bp'],
  Entertainment: ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'cinema', 'theater', 'game', 'gaming', 'concert', 'ticket', 'gym', 'fitness', 'youtube', 'twitch', 'steam', 'subscription'],
  Bills: ['electricity', 'electric', 'water', 'internet', 'wifi', 'phone', 'rent', 'mortgage', 'insurance', 'comcast', 'verizon', 'at&t', 'utility', 'utilities', 'cable', 'heating', 'gas bill'],
  Shopping: ['amazon', 'ebay', 'walmart shopping', 'target', 'zara', 'h&m', 'nike', 'clothes', 'clothing', 'shoes', 'apparel', 'mall', 'department store', 'ikea', 'home depot', 'best buy'],
  Healthcare: ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'clinic', 'medicine', 'prescription', 'dental', 'vision', 'medical', 'health', 'therapy', 'urgent care'],
};

const autoCategorize = (text) => {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'Other';
};

// ── Date resolution ───────────────────────────────────────────────────────────
const resolveDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const today = new Date();
  const lower = dateStr.toLowerCase();
  if (lower === 'today') return today.toISOString().slice(0, 10);
  if (lower === 'yesterday') {
    today.setDate(today.getDate() - 1);
    return today.toISOString().slice(0, 10);
  }
  if (lower.includes('last week')) {
    today.setDate(today.getDate() - 7);
    return today.toISOString().slice(0, 10);
  }
  // Try to parse
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  } catch {}
  return new Date().toISOString().slice(0, 10);
};

// ── Build AI system prompt ────────────────────────────────────────────────────
const buildSystemPrompt = (expenses) => {
  const today = new Date().toISOString().slice(0, 10);
  const recentExp = expenses.slice(0, 10).map(e =>
    `[${e._id}] ${e.date?.toISOString?.().slice(0,10) || e.date} | ${e.category} | ${e.merchant || 'N/A'} | $${e.amount} | ${e.description}`
  ).join('\n');

  return `You are an AI financial assistant for an Expense Tracker application.
Today's date: ${today}

Recent expenses (last 10):
${recentExp || '(no expenses yet)'}

Your task: Parse the user's natural language message and return ONLY valid JSON (no markdown, no preamble).

Supported actions:
1. CREATE_EXPENSE - add expense(s)
2. READ_EXPENSE - query/analyze expenses
3. UPDATE_EXPENSE - modify expense
4. DELETE_EXPENSE - remove expense
5. CHAT - general conversation

== RESPONSE FORMATS ==

Single expense:
{"action":"CREATE_EXPENSE","data":{"amount":number,"category":"Food|Transport|Entertainment|Bills|Shopping|Healthcare|Other","merchant":"string","description":"string","payment_method":"string","date":"YYYY-MM-DD"},"message":"human friendly confirmation"}

Multiple expenses (one sentence with multiple items):
{"action":"CREATE_EXPENSE","data":{"expenses":[{...},{...}]},"message":"Added N expenses totaling $X"}

Read/Query:
{"action":"READ_EXPENSE","data":{"category":"optional","date_range":"this_month|last_month|this_week|today|all","analytics":"total|breakdown|compare|top","merchant":"optional"},"message":"Fetching your expenses..."}

Update:
{"action":"UPDATE_EXPENSE","data":{"expense_id":"id or 'last'","amount":optional,"category":optional,"merchant":optional,"description":optional,"date":optional},"message":"Updated..."}

Delete:
{"action":"DELETE_EXPENSE","data":{"expense_id":"id or 'last'","target":"optional: last_expense"},"message":"Deleted..."}

Chat:
{"action":"CHAT","message":"friendly response"}

== AUTO-CATEGORIZATION RULES ==
Food: coffee, groceries, lunch, dinner, restaurant, Starbucks, Chipotle, Walmart (food)
Transport: Uber, Lyft, taxi, gas, fuel, parking, metro, bus
Entertainment: Netflix, Spotify, movie, game, gym, concert
Bills: electricity, water, internet, phone, rent, insurance
Shopping: Amazon, clothes, mall, Target, Zara
Healthcare: pharmacy, doctor, hospital, medicine, CVS

== DATE RULES ==
"yesterday" → day before today
"today" → ${today}
"last week" → 7 days ago
Always output dates as YYYY-MM-DD

== CRITICAL RULES ==
- Return ONLY valid JSON, nothing else
- For "actually make that X" or "change it to X" → UPDATE_EXPENSE with expense_id: "last"
- Always be helpful and friendly in the message field
- If unclear, use action "CHAT" and ask for clarification`;
};

// ── Anthropic API call ────────────────────────────────────────────────────────
const callAnthropic = async (messages, systemPrompt) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Anthropic API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '{}';
};

// ── OpenAI API call ───────────────────────────────────────────────────────────
const callOpenAI = async (messages, systemPrompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
};

// ── Main AI processing function ───────────────────────────────────────────────
const processMessage = async (conversationHistory, expenses) => {
  const systemPrompt = buildSystemPrompt(expenses);

  let rawText;
  const provider = process.env.AI_PROVIDER || 'anthropic';

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    rawText = await callOpenAI(conversationHistory, systemPrompt);
  } else if (process.env.ANTHROPIC_API_KEY) {
    rawText = await callAnthropic(conversationHistory, systemPrompt);
  } else {
    // Fallback: basic rule-based parsing
    return fallbackParse(conversationHistory[conversationHistory.length - 1]?.content || '');
  }

  // Clean and parse JSON
  const clean = rawText.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    // Resolve relative dates in CREATE/UPDATE
    if (parsed.action === 'CREATE_EXPENSE') {
      if (parsed.data?.date) parsed.data.date = resolveDate(parsed.data.date);
      if (parsed.data?.expenses) {
        parsed.data.expenses = parsed.data.expenses.map(e => ({ ...e, date: resolveDate(e.date) }));
      }
    }
    return parsed;
  } catch {
    return { action: 'CHAT', message: rawText };
  }
};

// ── Simple fallback parser (no API key) ──────────────────────────────────────
const fallbackParse = (text) => {
  const lower = text.toLowerCase();
  const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  if ((lower.includes('spent') || lower.includes('add') || lower.includes('bought') || lower.includes('paid')) && amount) {
    const category = autoCategorize(text);
    const merchantMatch = text.match(/(?:at|from|@)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:yesterday|today|for|on|\$)|$)/);
    return {
      action: 'CREATE_EXPENSE',
      data: { amount, category, merchant: merchantMatch?.[1]?.trim() || '', description: text, date: new Date().toISOString().slice(0, 10) },
      message: `Added $${amount} for ${category}.`,
    };
  }
  if (lower.includes('how much') || lower.includes('show') || lower.includes('list') || lower.includes('total')) {
    return { action: 'READ_EXPENSE', data: { date_range: 'this_month', analytics: 'total' }, message: 'Fetching your expenses...' };
  }
  if (lower.includes('delete') || lower.includes('remove')) {
    return { action: 'DELETE_EXPENSE', data: { target: 'last_expense' }, message: 'Deleting your last expense.' };
  }
  if (lower.includes('update') || lower.includes('change') || lower.includes('actually') || lower.includes('make that')) {
    return { action: 'UPDATE_EXPENSE', data: { expense_id: 'last', ...(amount && { amount }) }, message: amount ? `Updating to $${amount}.` : 'What would you like to update?' };
  }
  return { action: 'CHAT', message: "I can help you track expenses! Try: 'I spent $45 at Walmart' or 'How much did I spend this month?'" };
};

module.exports = { processMessage, autoCategorize, resolveDate };
