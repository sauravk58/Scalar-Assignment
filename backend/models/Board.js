const mongoose = require("mongoose")

const boardSchema = new mongoose.Schema(
  {
    title: {
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
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visibility: {
      type: String,
      enum: ["private", "workspace", "public"],
      default: "workspace",
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
          enum: ["owner", "admin", "member", "viewer"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
      },
    ],
    labels: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },
        color: {
          type: String,
          required: true,
          match: /^#[0-9A-F]{6}$/i,
        },
      },
    ],
    background: {
      type: String,
      default: "#0079bf",
    },
    starred: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    closed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
boardSchema.index({ workspace: 1 })
boardSchema.index({ owner: 1 })
boardSchema.index({ "members.user": 1 })
boardSchema.index({ visibility: 1 })

module.exports = mongoose.model("Board", boardSchema)
