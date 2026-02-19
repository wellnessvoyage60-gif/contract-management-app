from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base, SessionLocal
from apscheduler.schedulers.background import BackgroundScheduler
from app.tasks.sla_scheduler import check_sla_reminders

app = FastAPI(title='Contract Management System', version='1.0.0')

# Import ALL models so Base.metadata knows about them
from app.models import user, contract, contract_document
from app.models import contract_reviewer, audit_log, notification, archive_metadata

# Import all route files
from app.api.routes import auth, contracts, users, dashboard
from app.api.routes import notifications, archive, reports, vendors, editor

# Import services
from app.services.admin_service import ensure_admin_exists

# Create all database tables
Base.metadata.create_all(bind=engine)

# Create hardcoded admin user
db = SessionLocal()
try:
    ensure_admin_exists(db)
finally:
    db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:5173', 'http://172.16.8.222', 'http://172.16.8.222:3000', 'http://172.16.8.222:8000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register all route groups
app.include_router(auth.router,          prefix='/api/auth',          tags=['Auth'])
app.include_router(dashboard.router,     prefix='/api/dashboard',     tags=['Dashboard'])
app.include_router(contracts.router,     prefix='/api/contracts',     tags=['Contracts'])
app.include_router(users.router,         prefix='/api/users',         tags=['Users'])
app.include_router(editor.router,        prefix='/api/editor',        tags=['Editor'])
app.include_router(notifications.router, prefix='/api/notifications', tags=['Notifications'])
app.include_router(archive.router,       prefix='/api/archive',       tags=['Archive'])
app.include_router(reports.router,       prefix='/api/reports',       tags=['Reports'])
app.include_router(vendors.router,       prefix='/api/vendors',       tags=['Vendors'])

# SLA Reminder Scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    check_sla_reminders,
    'cron',
    day_of_week='mon-fri',
    hour='8-18',
    minute=0,
    id='sla_reminder_check'
)
scheduler.start()
print('[SCHEDULER] SLA reminder scheduler started')
 
@app.on_event('shutdown')
def shutdown_scheduler():
    scheduler.shutdown()

@app.get('/')
def root():
    return {'message': 'Contract Management API is running!'}
