# 💰 Expensify AI — AI-Powered Expense Tracker

A full-stack expense tracking application with an integrated AI chatbot that manages your finances through natural language.

## 🏗️ Project Structure

```
expense-tracker/
├── backend/                    # Node.js + Express API
│   ├── server.js               # Entry point
│   ├── .env.example            # Environment variables template
│   ├── models/
│   │   ├── User.js             # User schema (bcrypt password hashing)
│   │   └── Expense.js          # Expense schema with indexes
│   ├── routes/
│   │   ├── auth.js             # Signup, login, /me
│   │   ├── expenses.js         # Full CRUD + pagination/filtering
│   │   ├── analytics.js        # Summary, trend, top, category comparison
│   │   └── chat.js             # AI message processing + action execution
│   ├── middleware/
│   │   └── auth.js             # JWT protect middleware + signToken
│   └── services/
│       └── aiService.js        # Anthropic/OpenAI API + fallback parser
│
└── frontend/                   # React application
    ├── public/index.html
    └── src/
        ├── App.js              # Root component + routing
        ├── index.js / index.css
        ├── context/
        │   └── AuthContext.js  # JWT auth state management
        ├── utils/
        │   ├── api.js          # Axios instance + all API calls
        │   └── helpers.js      # Constants, formatters, category maps
        └── components/
            ├── auth/AuthPage.js         # Login + Signup forms
            ├── common/Sidebar.js        # Navigation sidebar
            ├── dashboard/Dashboard.js   # Charts + summary stats
            ├── expenses/
            │   ├── ExpenseList.js       # Filterable, paginated table
            │   └── ExpenseModal.js      # Add/Edit expense form
            ├── analytics/Analytics.js   # Bar charts + category detail
            └── chat/ChatPage.js         # AI conversational interface
```

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET  | /api/auth/me | Get current user |

### Expenses (all require Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/expenses | List with pagination + filters |
| GET    | /api/expenses/:id | Single expense |
| GET    | /api/expenses/last/one | Most recent expense |
| POST   | /api/expenses | Create expense |
| PUT    | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| DELETE | /api/expenses | Bulk delete (body: {ids:[]}) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/summary | Dashboard totals + category breakdown |
| GET | /api/analytics/trend?months=6 | Monthly + daily spending trends |
| GET | /api/analytics/top-expenses?period=month&limit=5 | Top expenses |
| GET | /api/analytics/category-detail | Month-over-month comparison |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat | Send AI message, execute action |
| DELETE | /api/chat/history | Clear conversation context |

## 🗄️ Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (unique, required)",
  "password": "string (bcrypt hashed)",
  "createdAt": "Date"
}
```

### Expenses Collection
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User, indexed)",
  "amount": "number (min: 0, required)",
  "category": "enum: Food|Transport|Entertainment|Bills|Shopping|Healthcare|Other",
  "merchant": "string",
  "description": "string",
  "payment_method": "enum: Cash|Credit Card|Debit Card|Apple Pay|Google Pay|Bank Transfer|Other",
  "date": "Date (indexed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
Compound indexes: `{user, date}` and `{user, category}`

## 🤖 AI Chat — How It Works

```
User message
     │
     ▼
Build context (last 20 expenses + today's date)
     │
     ▼
Send to AI (Anthropic Claude or OpenAI GPT-4)
     │
     ▼
Parse JSON response → action + data + message
     │
     ▼
Execute action in MongoDB:
  CREATE_EXPENSE  → Expense.create(...)
  UPDATE_EXPENSE  → Expense.findByIdAndUpdate(...)
  DELETE_EXPENSE  → Expense.findByIdAndDelete(...)
  READ_EXPENSE    → Expense.find(filter) + aggregate
  CHAT            → return message only
     │
     ▼
Return result to frontend + update conversation history
```

### AI Response Format
```json
{
  "action": "CREATE_EXPENSE",
  "data": {
    "amount": 45,
    "category": "Food",
    "merchant": "Walmart",
    "description": "weekly groceries",
    "date": "2026-03-07"
  },
  "message": "Added $45 grocery expense at Walmart."
}
```

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Anthropic or OpenAI API key

### Step 1: Clone / Download

```bash
# If using git
git clone <repo-url>
cd expense-tracker

# Or just navigate to the downloaded folder
cd expense-tracker
```

### Step 2: Backend Setup

```bash
cd backend
npm install

# Copy env template
cp .env.example .env
# Edit .env with your values (MongoDB URI, API key, JWT secret)
```

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

### Step 4: Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_random_secret_here_make_it_long
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
FRONTEND_URL=http://localhost:3000
```

### Step 5: Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# → App running on http://localhost:3000
```

Open http://localhost:3000, create an account, and start tracking!

---

## ☁️ Deployment

### Option A: Railway (Recommended — Full-Stack)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project
3. Deploy backend:
   - Connect GitHub repo
   - Set root directory to `backend/`
   - Add environment variables from `.env`
   - Railway auto-detects Node.js
4. Add MongoDB plugin in Railway dashboard
5. Deploy frontend:
   - New service → GitHub repo
   - Root directory: `frontend/`
   - Build: `npm run build`
   - Set `REACT_APP_API_URL=https://your-backend.railway.app/api`

### Option B: Render

**Backend:**
```
Build Command: npm install
Start Command: npm start
Root Directory: backend
Environment: Add all .env variables
```

**Frontend:**
```
Build Command: npm run build
Publish Directory: frontend/build
Root Directory: frontend
Environment: REACT_APP_API_URL=https://your-api.onrender.com/api
```

**Database:** Use MongoDB Atlas (free tier)
- Create cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Get connection string → set as MONGODB_URI

### Option C: Docker

```dockerfile
# Backend Dockerfile (backend/Dockerfile)
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml (root)
version: '3.8'
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      MONGODB_URI: mongodb://mongo:27017/expense_tracker
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on: [mongo]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    environment:
      REACT_APP_API_URL: http://localhost:5000/api

volumes:
  mongo_data:
```

```bash
docker-compose up --build
```

## 🔐 Security Features

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT tokens** expire in 7 days
- **Helmet.js** security headers
- **Rate limiting**: 100 req/15min globally, 20 req/min for chat
- **CORS** restricted to frontend URL
- All expense routes validate ownership (`user: req.user._id`)
- Input validation with **express-validator**

## 🎯 Example AI Conversations

```
User: I spent $45 on groceries at Walmart yesterday
AI: ✅ Added $45 Food expense at Walmart on Mar 7

User: Actually make that $52
AI: ✅ Updated your Walmart expense from $45 to $52

User: Add coffee $5, lunch $18, and uber $12
AI: ✅ Added 3 expenses totaling $35.00

User: How much did I spend on food this month?
AI: Your food spending this month: $156.50 across 8 transactions

User: Compare this month vs last month
AI: This month: $892 | Last month: $743 | +20.1% increase
Food: +35% | Transport: -12% | Shopping: +8%

User: Delete my last expense
AI: 🗑️ Deleted $12 Transport expense
```
