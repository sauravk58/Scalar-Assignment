# Mini-Trello (Kanban) App

A full-stack Trello-like Kanban application built with the MERN stack, featuring real-time collaboration, drag-and-drop functionality, and comprehensive project management features.

#Demo Video Link
https://youtu.be/wwNTGvB-AQ8

##Screenshots
<img width="1240" height="556" alt="image" src="https://github.com/user-attachments/assets/b6e19c5c-09f9-44ba-8056-214d706727e6" />
<img width="1236" height="552" alt="image" src="https://github.com/user-attachments/assets/36ba34e1-5486-47ff-ae76-f86bcae6b977" />
<img width="1226" height="548" alt="image" src="https://github.com/user-attachments/assets/64a7b59a-fe93-4b2d-9ad6-c9efd02a0a21" />
<img width="1225" height="535" alt="image" src="https://github.com/user-attachments/assets/ed9d18b6-04db-4d91-addc-64d582379e1f" />
<img width="1228" height="547" alt="image" src="https://github.com/user-attachments/assets/f72e63b4-639b-4795-b443-e3a5b7f3de67" />
<img width="1234" height="546" alt="image" src="https://github.com/user-attachments/assets/57d218e0-46c4-4145-9942-d2ba385c5f23" />


## 🚀 Tech Stack & Rationale

**Frontend:**
- **React 18** - Modern UI library with hooks and concurrent features
- **React Router v6** - Client-side routing for SPA navigation
- **React Beautiful DnD** - Smooth drag-and-drop interactions for cards and lists
- **Socket.io Client** - Real-time bidirectional communication
- **Axios** - HTTP client with interceptors for API calls
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Hot Toast** - Elegant toast notifications

**Backend:**
- **Node.js & Express** - Fast, unopinionated web framework
- **MongoDB & Mongoose** - NoSQL database with elegant object modeling
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Stateless authentication with JSON Web Tokens
- **bcryptjs** - Password hashing for security
- **Express Validator** - Input validation and sanitization

**Why MERN?**
The MERN stack provides a cohesive JavaScript ecosystem that enables rapid development and seamless data flow. MongoDB's flexible document structure is perfect for Kanban boards with nested cards and dynamic schemas. React's component-based architecture aligns well with Trello's card-based UI, while Socket.io enables the real-time collaboration essential for team productivity tools.

## 📋 Features

### Core Functionality ✅
- **Authentication**: JWT-based signup/login with protected routes
- **Workspaces**: Organizational containers for boards with member management
- **Boards**: Project boards with customizable backgrounds and visibility settings
- **Lists**: Ordered columns (To Do, In Progress, Done) with drag-and-drop reordering
- **Cards**: Rich cards with titles, descriptions, labels, assignees, due dates, and checklists
- **Comments**: Threaded discussions on cards with real-time updates
- **Activity Log**: Comprehensive audit trail of all board actions
- **Search & Filters**: Text search across cards with label/assignee/due date filters
- **Real-time Collaboration**: Live updates for card moves, edits, and comments

### Advanced Features 🎯
- **Drag & Drop**: Smooth card and list reordering with position-based sorting
- **User Presence**: Online user indicators and typing notifications
- **Optimistic Updates**: Immediate UI feedback with server reconciliation
- **Role-based Access**: Board owners, members, and workspace-level permissions
- **Responsive Design**: Mobile-first design that works on all devices
- **Error Handling**: Comprehensive error boundaries and user feedback

## 🛠 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd mini-trello-mern
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm run install-deps
   \`\`\`

3. **Environment Setup**
   \`\`\`bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Update backend/.env with your values:
   # MONGODB_URI=your_mongodb_connection_string
   # JWT_SECRET=your_jwt_secret_key
   # JWT_EXPIRES_IN=1d
   # FRONTEND_URL=http://localhost:3000
   \`\`\`

4. **Start the application**
   \`\`\`bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   # Backend: npm run server
   # Frontend: npm run client
   \`\`\`

5. **Seed sample data** (optional)
   \`\`\`bash
   npm run seed
   \`\`\`

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/api/health

## 📊 Database Schema Overview

<img width="514" height="579" alt="image" src="https://github.com/user-attachments/assets/8275e9cb-0fef-441d-b8b9-ebaa0493f5a2" />


### Key Design Decisions

**Position-based Ordering**: Uses fractional positioning (1024, 1536, 2048...) to avoid expensive reindexing when reordering items.

**Embedded vs Referenced**: Comments and activities are referenced for better query performance, while labels and checklists are embedded for atomic updates.

**Indexes**: Strategic indexes on frequently queried fields:
- `boards: { workspace: 1, owner: 1, 'members.user': 1 }`
- `cards: { board: 1, list: 1, position: 1 }`
- `activities: { board: 1, createdAt: -1 }`

## 🔌 API Reference

### Authentication
\`\`\`
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
\`\`\`

### Boards
\`\`\`
GET    /api/boards         # Get user's boards
POST   /api/boards         # Create board
GET    /api/boards/:id     # Get board with full data
GET    /api/boards/:id/search # Search cards in board
\`\`\`

### Lists
\`\`\`
POST   /api/lists         # Create list
PUT    /api/lists/:id     # Update list
PUT    /api/lists/:id/move # Move list position
PUT    /api/lists/:id/archive # Archive list
\`\`\`

### Cards
\`\`\`
POST   /api/cards         # Create card
PUT    /api/cards/:id     # Update card
PUT    /api/cards/:id/move # Move card between lists
\`\`\`

### Real-time Events
\`\`\`
join-board         # Join board room
leave-board        # Leave board room
card-moved         # Card position changed
card-created       # New card added
card-updated       # Card details changed
list-created       # New list added
comment-added      # New comment posted
\`\`\`

## 🏗 Architecture Overview

\`\`\`
<img width="556" height="286" alt="image" src="https://github.com/user-attachments/assets/ee06c844-aa5e-4c4d-af1b-2a4211b8efea" />

\`\`\`

### Data Flow
1. **Authentication**: JWT tokens stored in localStorage, attached to API requests
2. **Real-time Updates**: Socket.io rooms per board for isolated updates
3. **Optimistic Updates**: UI updates immediately, reverts on server error
4. **State Management**: React Context for auth, local state for board data
5. **Error Handling**: Axios interceptors for global error handling

## 🧪 Testing the Application

### Manual Testing Checklist

**Authentication Flow:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Access protected routes
- [ ] Logout functionality

**Board Management:**
- [ ] Create workspace
- [ ] Create board in workspace
- [ ] View board with lists and cards
- [ ] Search cards by text/labels/assignees

**Kanban Functionality:**
- [ ] Create new list
- [ ] Add cards to lists
- [ ] Drag cards within same list
- [ ] Drag cards between lists
- [ ] Drag lists to reorder
- [ ] Edit card details

**Real-time Collaboration:**
- [ ] Open same board in two browsers
- [ ] Move card in one browser, see update in other
- [ ] Add comment, see real-time notification
- [ ] User presence indicators

### Sample Test Data

The seed script creates:
- 2 test users (admin@test.com / user@test.com, password: 123456)
- 1 workspace with sample boards
- Multiple lists with cards demonstrating all features
- Comments and activities for testing

## 🚀 Deployment

### Environment Variables
\`\`\`bash
# Production Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-production-secret
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-domain.com

# Production Frontend
REACT_APP_BACKEND_API_URL=https://your-backend-domain.com/api
REACT_APP_BACKEND_SOCKET_URL=https://your-backend-domain.com
\`\`\`

## 🔧 Development

### Project Structure
\`\`\`
mini-trello-mern/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth & validation middleware
│   ├── scripts/         # Database seeding scripts
│   └── server.js        # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Route-level components
│   │   ├── contexts/    # React Context providers
│   │   └── App.js       # Main app component
│   └── public/          # Static assets
└── docs/                # Architecture documentation
\`\`\`

### Code Quality
- **ESLint**: Configured for React and Node.js best practices
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for code quality
- **TypeScript**: Consider migration for better type safety

## 📈 Performance Considerations

### Current Optimizations
- **Database Indexes**: Strategic indexing for common queries
- **Pagination**: Activity feeds and search results are paginated
- **Optimistic Updates**: Immediate UI feedback reduces perceived latency
- **Connection Pooling**: MongoDB connection pooling for better performance
- **Compression**: Gzip compression for API responses

### Scaling Recommendations
- **Caching**: Redis for session storage and frequent queries
- **CDN**: Static asset delivery via CloudFront/CloudFlare
- **Database Sharding**: Horizontal scaling by workspace/board
- **Microservices**: Split real-time, API, and file services
- **Load Balancing**: Multiple server instances behind load balancer

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Short expiration times, secure HTTP-only cookies option
- **Input Validation**: Express-validator for all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured for specific frontend origins
- **Helmet**: Security headers for Express
- **Authorization**: Role-based access control for boards and workspaces

## 🐛 Known Limitations & Next Steps

### Current Limitations
- **File Uploads**: Attachment feature UI exists but needs storage integration
- **Email Notifications**: Webhook system planned but not implemented
- **Offline Support**: No offline-first capabilities yet
- **Mobile App**: Web-only, native mobile apps not available
- **Advanced Permissions**: Basic role system, needs granular permissions

### Planned Enhancements
- **Calendar View**: Due date calendar integration
- **Time Tracking**: Built-in time tracking for cards
- **Templates**: Board and card templates for common workflows
- **Integrations**: Slack, GitHub, and email integrations
- **Analytics**: Board metrics and productivity insights
- **Advanced Search**: Full-text search with filters and sorting

## 📞 Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the API documentation
3. Test with the provided seed data
4. Check browser console for client-side errors
5. Review server logs for backend issues

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using the MERN Stack**
