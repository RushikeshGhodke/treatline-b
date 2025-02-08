import mongoose from "mongoose";
import { Schema } from "mongoose";

// Define the Appointment schema
const appointmentSchema = new Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',  // Reference to the Doctor model
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',  // Reference to the Patient model
    required: true
  },
  // Indicates if the appointment is finalized with a doctor
  finalize_booking: {
    type: Boolean,
    required: true,
    default: false
  },
  // Start and end time of the appointment using timestamps
  start: {
    type: Date,  // Stores as a timestamp
  },
  end: {
    type: Date,  // Stores as a timestamp
  },

  // Priority score for scheduling (encrypted)
  priority_score: {
    type: String,  // Encrypted string for priority scoring
  },
  // Timestamp for when the appointment was created
  createdAt: {
    type: Date,
    default: Date.now  // Automatically set the creation date
  },
  // Time slot index (used for scheduling)
  timeSlot: {
    type: Number,  // Example: 0, 1, 2 representing different time slots
  },
  // Symptoms provided by the patient (in plain text)
  symptoms: {
    type: String,  // Symptoms text input by the patient
  },
  // Additional notes related to the appointment (if any)
  notes: {
    type: String,
    default: ''
  },
  // Flags to track the status of the appointment
  isScheduled: {
    type: Boolean,
    default: false  // Will be set to true when the appointment is scheduled with a doctor
  },
  isNotified: {
    type: Boolean,
    default: false  // Will be set to true when the patient/doctor is notified about the appointment
  }
});

// Create and export the Appointment model
export const Appointment = new mongoose.model("Appointment", appointmentSchema);
