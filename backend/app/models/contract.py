from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Date, Numeric
from sqlalchemy.sql import func
from app.core.database import Base


class Contract(Base):
    __tablename__ = 'contracts'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    contract_number = Column(String(100), unique=True)
    category = Column(Enum('supply_service', 'service', 'msa', 'nda', 'bida_basis', 'general', 'supply_service_contract', 'service_contract', 'bida_basis_contract'), nullable=False)
    status = Column(Enum('draft', 'in_review', 'vendor_feedback', 'approved', 'signed'), default='draft')
    vendor_name = Column(String(255), nullable=True)
    contract_value = Column(Numeric(15, 2), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    sla_days = Column(Integer, nullable=False)
    sla_deadline = Column(Date, nullable=True)
    current_handler_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    uploader_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
