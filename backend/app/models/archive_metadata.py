from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Numeric
from sqlalchemy.sql import func
from app.core.database import Base


class ArchiveMetadata(Base):
    __tablename__ = 'archive_metadata'

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'), unique=True, nullable=False)
    signed_pdf_path = Column(String(500), nullable=True)
    vendor_name = Column(String(255), nullable=True)
    contract_value = Column(Numeric(15, 2), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    contract_title = Column(String(500), nullable=True)
    archived_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    archived_at = Column(DateTime, server_default=func.now())
