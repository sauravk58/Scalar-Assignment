const mongoose = require("mongoose")
require("dotenv").config()

const migrations = [
  {
    version: "1.0.0",
    description: "Initial database setup",
    up: async () => {
      console.log("Creating initial indexes...")

      // Users indexes
      await mongoose.connection.db.collection("users").createIndex({ email: 1 }, { unique: true })
      await mongoose.connection.db.collection("users").createIndex({ workspaces: 1 })

      // Boards indexes
      await mongoose.connection.db.collection("boards").createIndex({ workspace: 1 })
      await mongoose.connection.db.collection("boards").createIndex({ owner: 1 })
      await mongoose.connection.db.collection("boards").createIndex({ "members.user": 1 })

      // Cards indexes
      await mongoose.connection.db.collection("cards").createIndex({ list: 1, position: 1 })
      await mongoose.connection.db.collection("cards").createIndex({ board: 1, archived: 1 })
      await mongoose.connection.db.collection("cards").createIndex({ title: "text", description: "text" })

      // Activities indexes
      await mongoose.connection.db.collection("activities").createIndex({ board: 1, createdAt: -1 })

      console.log("✅ Initial indexes created")
    },
  },
  {
    version: "1.1.0",
    description: "Add performance indexes",
    up: async () => {
      console.log("Adding performance indexes...")

      // Additional performance indexes
      await mongoose.connection.db.collection("cards").createIndex({ assignees: 1 })
      await mongoose.connection.db.collection("cards").createIndex({ dueDate: 1 })
      await mongoose.connection.db.collection("comments").createIndex({ card: 1, createdAt: -1 })

      console.log("✅ Performance indexes added")
    },
  },
]

const runMigrations = async () => {
  try {
    console.log("🔄 Starting database migrations...")

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("✅ Connected to MongoDB")

    // Create migrations collection if it doesn't exist
    const migrationsCollection = mongoose.connection.db.collection("migrations")

    // Get completed migrations
    const completedMigrations = await migrationsCollection.find({}).toArray()
    const completedVersions = completedMigrations.map((m) => m.version)

    // Run pending migrations
    for (const migration of migrations) {
      if (!completedVersions.includes(migration.version)) {
        console.log(`📦 Running migration ${migration.version}: ${migration.description}`)

        try {
          await migration.up()

          // Record successful migration
          await migrationsCollection.insertOne({
            version: migration.version,
            description: migration.description,
            completedAt: new Date(),
          })

          console.log(`✅ Migration ${migration.version} completed`)
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error)
          throw error
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already completed`)
      }
    }

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
    process.exit(0)
  }
}

// Run migrations
runMigrations()
