from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    notification_type = Column(Enum('assignment', 'reminder_1', 'reminder_2',
                                    'escalation', 'approval', 'vendor_invite'))
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
