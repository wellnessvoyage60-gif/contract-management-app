from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
 
 
class ContractReviewer(Base):
    __tablename__ = 'contract_reviewers'
 
    id = Column(Integer, primary_key=True, autoincrement=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'), nullable=False)
    reviewer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    review_order = Column(Integer, nullable=False, default=1)
    status = Column(String(20), default='pending')  # pending, in_progress, completed
    action_taken = Column(String(50), nullable=True)  # approve, send_to_next, vendor_feedback
    comments = Column(Text, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
