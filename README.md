# TaskMaster - Intern Task Management System

TaskMaster is a comprehensive task management application designed to streamline the workflow between Admins and Interns. It allows admins to assign tasks, track progress, and review submissions, while interns can manage their workload, track time, and submit their work for approval.

Built with **Next.js 16**, **Tailwind CSS v4**, **Prisma**, and **PostgreSQL**.

![TaskMaster Dashboard](https://via.placeholder.com/1200x600?text=TaskMaster+Dashboard+Preview)

## 🚀 Features

### 👑 Admin Features
- **Dashboard Overview**: View key statistics (Total Tasks, Completed, In Progress, No Response).
- **Task Management**:
  - Create and assign tasks to interns with deadlines and priority levels.
  - View all tasks in a responsive list or card view.
  - **Delete Tasks**: Remove tasks directly from the dashboard.
  - **Review Submissions**: Approve or Reject intern submissions with feedback.
- **Intern Management**:
  - View all registered interns.
  - **Approval Workflow**: Approve or Reject new intern registrations.
  - Monitor intern status (Pending, Approved, Rejected).

### 👨‍💻 Intern Features
- **Personal Dashboard**: View assigned tasks and personal statistics.
- **Task Workflow**:
  - **Accept/Decline**: Accept new tasks or decline them with a reason.
  - **Time Tracking**: Start, Pause, and Resume tasks to track working hours.
  - **Submission**: Submit work via Links or Image Uploads (simulated).
- **Status Updates**: Real-time status updates (Pending, In Progress, Under Review, Completed).
- **Registration**: Self-registration with email/password (requires Admin approval).

### 🎨 UI/UX
- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop.
- **Dark/Light Mode**: Seamless theme switching with system preference support.
- **Modern Interface**: Glassmorphism effects, smooth transitions, and interactive elements.
- **Landing Page**: Professional landing page with feature highlights.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [NeonDB](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Credentials Provider)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks & Server Actions

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+ installed.
- A PostgreSQL database (local or cloud like Neon/Supabase).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/task-management.git
   cd task-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   AUTH_SECRET="your-super-secret-key-openssl-rand-base64-32"
   ```

4. **Database Setup**
   Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```

5. **Run the Application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
task-management/
├── app/                    # Next.js App Router
│   ├── actions.ts          # Server Actions (Backend Logic)
│   ├── admin/              # Admin Dashboard Routes
│   ├── api/                # API Routes (Auth)
│   ├── intern/             # Intern Dashboard Routes
│   ├── login/              # Login Page
│   ├── register/           # Registration Page
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Landing Page
├── components/             # Reusable UI Components
│   ├── AdminInternList.tsx # Intern Management List
│   ├── AdminTaskList.tsx   # Admin Task Management
│   ├── CreateTaskForm.tsx  # Task Creation Form
│   ├── InternTaskCard.tsx  # Intern Task Interaction
│   ├── Navbar.tsx          # Responsive Navigation
│   └── ThemeToggle.tsx     # Dark Mode Toggle
├── prisma/                 # Database Configuration
│   └── schema.prisma       # Data Models
├── public/                 # Static Assets
└── ...config files         # Tailwind, TypeScript, Next.js Config
```

## 🗄️ Database Schema

- **User**: Stores Admin and Intern profiles with roles and approval status.
- **Task**: Main task entity with status, priority, deadline, and relations to users.
- **Submission**: Links or files submitted by interns for a task.
- **TimeLog**: Tracks time spent on tasks (Work/Pause intervals).
- **SiteStats**: Tracks unique page views.

## 🔐 Authentication & Roles

- **Admin**:
  - Full access to all dashboards.
  - Can manage users and tasks.
  - *Demo Creds*: `admin@example.com` / `admin123` (Create manually in DB or via seed)

- **Intern**:
  - Restricted access to own dashboard.
  - Must be approved by Admin after registration.
  - *Demo Creds*: Register via `/register` and approve via Admin account.

## 🚀 Deployment

The project is optimized for deployment on **Vercel**.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the `DATABASE_URL` and `AUTH_SECRET` environment variables.
4. Deploy!

*Note: The `package.json` build script is configured to run `prisma generate` automatically.*

## 📄 License

This project is licensed under the MIT License.

---

**Developed by Ashwani Kushwaha**
