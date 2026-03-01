Vyaparika
AI-Based Inventory & Business Network Platform (In Progress)
Vyaparika is a role-based business management platform designed for Retailers, Distributors, and Manufacturers.

The goal is to build a scalable system that combines:
Inventory management
Expense tracking
Real-time stock updates
Business networking (follow-based system)
Order management (Paid / Unpaid tracking)
Location-based business discovery

Current Focus
Supabase backend integration
Role-based data isolation
Real-time subscriptions
Secure authentication (Google + OTP)
Clean, scalable database schema

Tech Stack
Frontend:
React (Vite) • TypeScript • TailwindCSS
Backend:
Supabase (PostgreSQL, Auth, Realtime, RLS)

Status
🚧 Actively under development
Architecture-first approach
Core backend being stabilized before feature expansion

Vision
To build a reliable operating system for small and medium business supply chains — not just another inventory app.


Run Locally
1️⃣ Clone the Repository
git clone https://github.com/vinayakbansal2006/smart-vyapar-app.git
cd vyaparika


2️⃣ Install Dependencies
Make sure you have Node.js (v18 or higher) installed.
Then run:
npm install


3️⃣ Configure Environment Variables
Create a .env file in the root directory and add:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
You can find these values in your Supabase project settings.


4️⃣ Start Development Server
npm run dev
The app will run at:
http://localhost:3000
(or the port shown in your terminal)
