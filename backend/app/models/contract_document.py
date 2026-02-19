from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, BigInteger
from sqlalchemy.sql import func
from app.core.database import Base


class ContractDocument(Base):
    __tablename__ = 'contract_documents'

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'), nullable=False)
    version = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    file_type = Column(Enum('docx', 'pdf'), default='docx')
    uploaded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
