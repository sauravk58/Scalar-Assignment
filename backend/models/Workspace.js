const mongoose = require("mongoose")

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
      },
    ],
    settings: {
      visibility: {
        type: String,
        enum: ["private", "public"],
        default: "private",
      },
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
workspaceSchema.index({ owner: 1 })
workspaceSchema.index({ "members.user": 1 })

module.exports = mongoose.model("Workspace", workspaceSchema)