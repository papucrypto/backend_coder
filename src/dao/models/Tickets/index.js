import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ticketCollection = "tickets";
const ticketSchema = new mongoose.Schema({
  code: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  purchase_datetime: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  purchaser: {
    type: String,
    required: true,
  },
});

export const Tickets = mongoose.model(ticketCollection, ticketSchema);
