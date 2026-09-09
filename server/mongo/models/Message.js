// История сообщений чата консультации. Хранится в MongoDB, потому что
// сообщения пишутся часто, читаются пачкой при входе в комнату и не требуют
// жёсткой реляционной схемы.
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    consultationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin', 'system'],
      default: 'patient',
    },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    kind: { type: String, enum: ['user', 'system'], default: 'user' },
  },
  { timestamps: true, collection: 'messages' }
);

messageSchema.index({ consultationId: 1, createdAt: 1 });

messageSchema.statics.history = function history(consultationId, limit = 50) {
  return this.find({ consultationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .then((rows) => rows.reverse());
};

module.exports = mongoose.model('Message', messageSchema);
