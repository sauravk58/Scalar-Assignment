const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "card_created",
        "card_updated",
        "card_moved",
        "card_archived",
        "card_deleted",
        "comment_added",
        "comment_updated",
        "comment_deleted",
        "list_created",
        "list_updated",
        "list_moved",
        "list_archived",
        "board_created",
        "board_updated",
        "member_added",
        "member_removed",
        "label_added",
        "label_removed",
        "due_date_added",
        "due_date_updated",
        "due_date_removed",
        "attachment_added",
        "attachment_removed",
        "checklist_item_added",
        "checklist_item_completed",
        "checklist_item_uncompleted",
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for activity feed queries
activitySchema.index({ board: 1, createdAt: -1 })
activitySchema.index({ card: 1, createdAt: -1 })
activitySchema.index({ actor: 1, createdAt: -1 })

module.exports = mongoose.model("Activity", activitySchema)
