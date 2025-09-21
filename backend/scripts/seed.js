const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Workspace = require("../models/Workspace")
const Board = require("../models/Board")
const List = require("../models/List")
const Card = require("../models/Card")
const Comment = require("../models/Comment")
const Activity = require("../models/Activity")

const seedData = async () => {
  try {
    console.log("🌱 Starting database seed...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Board.deleteMany({}),
      List.deleteMany({}),
      Card.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
    ])
    console.log("🗑️  Cleared existing data")

    // Create users
    const hashedPassword = await bcrypt.hash("123456", 10)

    const users = await User.create([
      {
        name: "John Doe",
        email: "admin@test.com",
        password: hashedPassword,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      {
        name: "Jane Smith",
        email: "user@test.com",
        password: hashedPassword,
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      },
      {
        name: "Mike Johnson",
        email: "mike@test.com",
        password: hashedPassword,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      },
    ])
    console.log("👥 Created users")

    // Create workspace
    const workspace = await Workspace.create({
      name: "Acme Corporation",
      description: "Main workspace for Acme Corporation projects",
      owner: users[0]._id,
      members: [
        { user: users[0]._id, role: "admin" },
        { user: users[1]._id, role: "member" },
        { user: users[2]._id, role: "member" },
      ],
    })
    console.log("🏢 Created workspace")

    // Update users with workspace
    await User.updateMany({ _id: { $in: users.map((u) => u._id) } }, { $push: { workspaces: workspace._id } })

    // Create boards
    const boards = await Board.create([
      {
        title: "Website Redesign Project",
        description: "Complete redesign of company website with modern UI/UX",
        workspace: workspace._id,
        owner: users[0]._id,
        visibility: "workspace",
        background: "#0079bf",
        members: [
          { user: users[0]._id, role: "owner" },
          { user: users[1]._id, role: "member" },
          { user: users[2]._id, role: "member" },
        ],
        labels: [
          { name: "High Priority", color: "#eb5a46" },
          { name: "Design", color: "#f2d600" },
          { name: "Development", color: "#61bd4f" },
          { name: "Bug", color: "#ff9f1a" },
          { name: "Feature", color: "#c377e0" },
        ],
      },
      {
        title: "Mobile App Development",
        description: "Native mobile app for iOS and Android platforms",
        workspace: workspace._id,
        owner: users[1]._id,
        visibility: "workspace",
        background: "#519839",
        members: [
          { user: users[1]._id, role: "owner" },
          { user: users[2]._id, role: "member" },
        ],
        labels: [
          { name: "iOS", color: "#0079bf" },
          { name: "Android", color: "#61bd4f" },
          { name: "Backend", color: "#c377e0" },
          { name: "Testing", color: "#ff9f1a" },
        ],
      },
    ])
    console.log("📋 Created boards")

    // Update workspace with boards
    await Workspace.findByIdAndUpdate(workspace._id, {
      $push: { boards: { $each: boards.map((b) => b._id) } },
    })

    // Create lists for first board
    const lists = await List.create([
      {
        title: "Backlog",
        board: boards[0]._id,
        position: 1024,
      },
      {
        title: "In Progress",
        board: boards[0]._id,
        position: 2048,
      },
      {
        title: "Review",
        board: boards[0]._id,
        position: 3072,
      },
      {
        title: "Done",
        board: boards[0]._id,
        position: 4096,
      },
    ])
    console.log("📝 Created lists")

    // Update board with lists
    await Board.findByIdAndUpdate(boards[0]._id, {
      $push: { lists: { $each: lists.map((l) => l._id) } },
    })

    // Create cards
    const cards = await Card.create([
      // Backlog cards
      {
        title: "Research competitor websites",
        description: "Analyze top 5 competitor websites for design inspiration and feature comparison",
        list: lists[0]._id,
        board: boards[0]._id,
        position: 1024,
        creator: users[0]._id,
        assignees: [users[1]._id],
        labels: [boards[0].labels[1]._id], // Design
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        checklist: [
          { text: "Identify top 5 competitors", completed: true },
          { text: "Analyze design patterns", completed: false },
          { text: "Document findings", completed: false },
        ],
      },
      {
        title: "Create wireframes for homepage",
        description: "Design low-fidelity wireframes for the new homepage layout",
        list: lists[0]._id,
        board: boards[0]._id,
        position: 2048,
        creator: users[1]._id,
        assignees: [users[1]._id],
        labels: [boards[0].labels[1]._id], // Design
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Set up development environment",
        description: "Configure local development environment with necessary tools and dependencies",
        list: lists[0]._id,
        board: boards[0]._id,
        position: 3072,
        creator: users[2]._id,
        assignees: [users[2]._id],
        labels: [boards[0].labels[2]._id], // Development
      },

      // In Progress cards
      {
        title: "Design system components",
        description: "Create reusable UI components following design system guidelines",
        list: lists[1]._id,
        board: boards[0]._id,
        position: 1024,
        creator: users[1]._id,
        assignees: [users[1]._id],
        labels: [boards[0].labels[1]._id, boards[0].labels[0]._id], // Design, High Priority
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        checklist: [
          { text: "Button components", completed: true },
          { text: "Form components", completed: true },
          { text: "Navigation components", completed: false },
          { text: "Card components", completed: false },
        ],
      },
      {
        title: "Implement responsive navigation",
        description: "Build mobile-first responsive navigation with hamburger menu",
        list: lists[1]._id,
        board: boards[0]._id,
        position: 2048,
        creator: users[2]._id,
        assignees: [users[2]._id],
        labels: [boards[0].labels[2]._id], // Development
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },

      // Review cards
      {
        title: "Homepage hero section",
        description: "Review and test the new homepage hero section implementation",
        list: lists[2]._id,
        board: boards[0]._id,
        position: 1024,
        creator: users[2]._id,
        assignees: [users[0]._id, users[1]._id],
        labels: [boards[0].labels[1]._id], // Design
        completed: false,
      },

      // Done cards
      {
        title: "Project kickoff meeting",
        description: "Initial project planning and team alignment meeting",
        list: lists[3]._id,
        board: boards[0]._id,
        position: 1024,
        creator: users[0]._id,
        assignees: [users[0]._id, users[1]._id, users[2]._id],
        completed: true,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        title: "Brand guidelines review",
        description: "Review and approve updated brand guidelines for the new design",
        list: lists[3]._id,
        board: boards[0]._id,
        position: 2048,
        creator: users[1]._id,
        assignees: [users[0]._id],
        labels: [boards[0].labels[1]._id], // Design
        completed: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ])
    console.log("🎯 Created cards")

    // Update lists with cards
    for (let i = 0; i < lists.length; i++) {
      const listCards = cards.filter((card) => card.list.toString() === lists[i]._id.toString())
      await List.findByIdAndUpdate(lists[i]._id, {
        $push: { cards: { $each: listCards.map((c) => c._id) } },
      })
    }

    // Create comments
    const comments = await Comment.create([
      {
        text: "Great progress on the wireframes! The layout looks clean and user-friendly.",
        card: cards[1]._id,
        author: users[0]._id,
      },
      {
        text: "I've added some additional requirements in the description. Please review when you get a chance.",
        card: cards[3]._id,
        author: users[1]._id,
      },
      {
        text: "The navigation is working well on desktop. Still need to test on mobile devices.",
        card: cards[4]._id,
        author: users[2]._id,
      },
      {
        text: "Looks good! Just a few minor adjustments needed on the spacing.",
        card: cards[5]._id,
        author: users[0]._id,
      },
    ])
    console.log("💬 Created comments")

    // Update cards with comments
    for (const comment of comments) {
      await Card.findByIdAndUpdate(comment.card, {
        $push: { comments: comment._id },
      })
    }

    // Create activities
    const activities = await Activity.create([
      {
        type: "board_created",
        actor: users[0]._id,
        board: boards[0]._id,
        description: 'created board "Website Redesign Project"',
      },
      {
        type: "list_created",
        actor: users[0]._id,
        board: boards[0]._id,
        list: lists[0]._id,
        description: 'added list "Backlog"',
      },
      {
        type: "list_created",
        actor: users[0]._id,
        board: boards[0]._id,
        list: lists[1]._id,
        description: 'added list "In Progress"',
      },
      {
        type: "card_created",
        actor: users[0]._id,
        board: boards[0]._id,
        card: cards[0]._id,
        description: 'added card "Research competitor websites" to "Backlog"',
      },
      {
        type: "card_moved",
        actor: users[1]._id,
        board: boards[0]._id,
        card: cards[3]._id,
        description: 'moved card "Design system components" from "Backlog" to "In Progress"',
      },
      {
        type: "comment_added",
        actor: users[0]._id,
        board: boards[0]._id,
        card: cards[1]._id,
        comment: comments[0]._id,
        description: 'commented on card "Create wireframes for homepage"',
      },
      {
        type: "card_updated",
        actor: users[1]._id,
        board: boards[0]._id,
        card: cards[3]._id,
        description: 'updated card "Design system components"',
      },
    ])
    console.log("📊 Created activities")

    console.log("\n🎉 Database seeded successfully!")
    console.log("\n📧 Test Users:")
    console.log("   Admin: admin@test.com / 123456")
    console.log("   User:  user@test.com / 123456")
    console.log("   Mike:  mike@test.com / 123456")
    console.log("\n🏢 Workspace: Acme Corporation")
    console.log("📋 Boards: Website Redesign Project, Mobile App Development")
    console.log("\n🚀 You can now start the application and login with the test credentials!")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
    process.exit(0)
  }
}

// Run the seed function
seedData()
